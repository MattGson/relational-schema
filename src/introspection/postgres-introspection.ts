import _ from 'lodash';
import {
    ColumnType,
    Comparable,
    ConstraintDefinition,
    ConstraintType,
    EnumDefinitions,
    LogLevel,
    NonComparable,
    RelationDefinition,
    TableColumnsDefinition,
    TableMap,
} from '../types';
import { Knex } from 'knex';
import { Introspection } from './introspection';
import { logger } from '../lib/logger';

export class PostgresIntrospection extends Introspection {
    protected readonly schemaName: string;
    private knex: Knex;
    protected logLevel: LogLevel;

    public constructor(params: { knex: Knex; schemaName?: string; logLevel: LogLevel }) {
        super();
        const { knex, schemaName, logLevel } = params;
        this.knex = knex;
        if (schemaName) this.schemaName = schemaName;
        else this.schemaName = 'public';
        this.logLevel = logLevel;
    }

    public getTsTypeForColumn(
        _tableName: string,
        columnName: string,
        dbType: string,
        customTypes: EnumDefinitions,
    ): ColumnType {
        switch (dbType) {
            case 'bpchar':
            case 'char':
            case 'varchar':
            case 'text':
            case 'citext':
            case 'uuid':
            case 'bytea':
            case 'inet':
            case 'time':
            case 'timetz':
            case 'interval':
            case 'name':
                return Comparable.string;
            case 'int2':
            case 'int4':
            case 'int8':
            case 'float4':
            case 'float8':
            case 'numeric':
            case 'money':
            case 'oid':
                return Comparable.number;
            case 'bool':
                return Comparable.boolean;
            case 'json':
            case 'jsonb':
                return NonComparable.Object;
            case 'date':
            case 'timestamp':
            case 'timestamptz':
                return Comparable.Date;
            case '_int2':
            case '_int4':
            case '_int8':
            case '_float4':
            case '_float8':
            case '_numeric':
            case '_money':
                return NonComparable.ArrayNum;
            case '_bool':
                return NonComparable.ArrayBool;
            case '_varchar':
            case '_text':
            case '_citext':
            case '_uuid':
            case '_bytea':
                return NonComparable.ArrayStr;
            case '_json':
            case '_jsonb':
                return NonComparable.ArrayObj;
            case '_timestamptz':
                return NonComparable.ArrayDate;
            default: {
                if (customTypes && customTypes[dbType]) {
                    return dbType;
                } else {
                    logger.warn(
                        `Type [${columnName}] has been mapped to [any] because no specific type has been found.`,
                    );
                    return NonComparable.any;
                }
            }
        }
    }

    /**
     * Get the enum types used by a table
     * @param tables
     */
    public async getEnumTypesForTables(tables: string[]): Promise<TableMap<EnumDefinitions>> {
        type rowType = {
            enum_name: string;
            value: string;
            oid: number;
            table_name: string;
        };
        const rows: rowType[] = await this.query(
            this.knex('pg_type as t')
                .select('t.typname as enum_name', 'e.enumlabel as value', 't.oid', 'c.table_name')
                .join('pg_enum  as e', 't.oid', '=', 'e.enumtypid')
                .leftJoin('pg_catalog.pg_namespace as n', 'n.oid', '=', 't.typnamespace')
                .leftJoin('information_schema.columns as c', 'c.udt_name', '=', 't.typname')
                .where({ 'n.nspname': this.schemaName, table_schema: this.schemaName })
                .whereIn('c.table_name', tables),
        );

        const results: TableMap<EnumDefinitions> = {};

        this.tableMap(rows, (table, rows) => {
            const enumRows = _.groupBy(rows, (r) => r.oid);

            const enums: EnumDefinitions = {};
            for (const [oid, values] of Object.entries(enumRows)) {
                const [{ enum_name }] = values;
                enums[enum_name] = {
                    id: oid,
                    enumName: enum_name,
                    values: values.map((v) => v.value).sort(),
                };
            }
            results[table] = enums;
        });

        return results;
    }

    /**
     * Get the type definition for a table
     * @param tables
     * @param enumTypes
     */
    public async getTableTypes(
        tables: string[],
        enumTypes: TableMap<EnumDefinitions>,
    ): Promise<TableMap<TableColumnsDefinition>> {
        type RowType = {
            table_name: string;
            column_name: string;
            udt_name: string;
            is_nullable: string;
            is_generated: string;
            column_default: string | null;
            character_maximum_length: number | null;
        };

        const rows: RowType[] = await this.query(
            this.knex('information_schema.columns')
                .select(
                    'table_name',
                    'column_name',
                    'udt_name',
                    'is_nullable',
                    'is_generated',
                    'character_maximum_length',
                    'column_default',
                )
                .where({ table_schema: this.schemaName })
                .whereIn('table_name', tables),
        );

        const results: TableMap<TableColumnsDefinition> = {};

        this.tableMap(rows, (table, rows) => {
            const tableDefinition: TableColumnsDefinition = {};

            rows.map((schemaItem) => {
                const columnName = schemaItem.column_name;
                const dbType = schemaItem.udt_name;
                tableDefinition[columnName] = {
                    dbType,
                    columnDefault: schemaItem.column_default,
                    nullable: schemaItem.is_nullable === 'YES',
                    generated: schemaItem.is_generated === 'ALWAYS',
                    characterMaximumLength: schemaItem.character_maximum_length,
                    columnName,
                    tsType: this.getTsTypeForColumn(table, columnName, dbType, enumTypes[table]),
                };
            });
            results[table] = tableDefinition;
        });
        return results;
    }

    /**
     * Get constraints for tables
     * Bulk operation across many tables
     *
     * @param tables
     * @returns
     */
    public async getTableConstraints(tables: string[]): Promise<TableMap<ConstraintDefinition[]>> {
        type RowType = {
            table_name: string;
            column_name: string;
            constraint_name: string;
            constraint_type: ConstraintType;
            update_rule: string;
            delete_rule: string;
        };

        const rows: RowType[] = await this.query(
            this.knex('information_schema.key_column_usage as key_usage')
                .select(
                    'key_usage.table_name',
                    'key_usage.column_name',
                    'key_usage.constraint_name',
                    'constraints.constraint_type',
                    'referential_constraints.update_rule',
                    'referential_constraints.delete_rule',
                )
                .distinct()
                .leftJoin('information_schema.table_constraints as constraints', function () {
                    this.on('key_usage.constraint_name', '=', 'constraints.constraint_name');
                    this.andOn('key_usage.constraint_schema', '=', 'constraints.constraint_schema');
                    this.andOn('key_usage.table_name', '=', 'constraints.table_name');
                })
                .leftJoin('information_schema.referential_constraints as referential_constraints', function () {
                    this.on('key_usage.constraint_name', '=', 'referential_constraints.constraint_name');
                    this.andOn('key_usage.constraint_schema', '=', 'referential_constraints.constraint_schema');
                })
                .where({ 'key_usage.table_schema': this.schemaName })
                .whereIn('key_usage.table_name', tables),
        );

        const results: TableMap<ConstraintDefinition[]> = {};

        this.tableMap(rows, (table, rows) => {
            // group by constraint name
            const columnMap = _.groupBy(rows, (k) => k.constraint_name);
            const constraintMap = _.keyBy(rows, (k) => k.constraint_name);

            const constraintDefinitions: ConstraintDefinition[] = [];

            Object.values(constraintMap).forEach((constraint) => {
                const { constraint_type, constraint_name, delete_rule, update_rule } = constraint;
                const columns = columnMap[constraint_name];

                constraintDefinitions.push({
                    constraintName: constraint_name,
                    constraintType: constraint_type,
                    columnNames: columns.map((c) => c.column_name).sort(),
                    on_delete: delete_rule,
                    on_update: update_rule,
                });
            });
            results[table] = constraintDefinitions;
        });

        return results;
    }

    /**
     * Get all relations where the given table holds the constraint (N - 1 or 1 - 1) i.e. Posts.user_id -> Users.user_id
     * @param tables
     */
    public async getForwardRelations(tables: string[]): Promise<TableMap<RelationDefinition[]>> {
        type rowType = {
            constraint_name: string;
            table_name: string;
            column_name: string;
            referenced_table_name: string;
            referenced_column_name: string;
        };

        const rows: rowType[] = await this.query(
            this.knex('information_schema.referential_constraints as c')
                .join('information_schema.key_column_usage as x', 'x.constraint_name', '=', 'c.constraint_name')
                .join('information_schema.key_column_usage as y', function (q) {
                    q.on('y.ordinal_position', '=', 'x.position_in_unique_constraint').andOn(
                        'y.constraint_name',
                        '=',
                        'c.unique_constraint_name',
                    );
                })
                .whereIn('x.table_name', tables)
                .where({ 'x.table_schema': this.schemaName })
                .select(
                    'x.constraint_name',
                    'x.table_name',
                    'x.column_name',
                    'y.table_name as referenced_table_name',
                    'y.column_name as referenced_column_name',
                )
                .orderBy('c.constraint_name', 'x.ordinal_position'),
        );

        const results: TableMap<RelationDefinition[]> = {};

        this.tableMap(rows, (table, rows) => {
            // group by constraint name to capture multiple relations to same table
            const relations: { [constraintName: string]: RelationDefinition } = {};
            rows.forEach((row) => {
                const { column_name, referenced_table_name, referenced_column_name, constraint_name } = row;
                if (referenced_table_name == null || referenced_column_name == null) return;

                if (!relations[constraint_name])
                    relations[constraint_name] = {
                        toTable: referenced_table_name,
                        alias: referenced_table_name,
                        joins: [],
                        constraintName: constraint_name,
                        type: 'belongsTo', // default always N - 1
                    };
                relations[constraint_name].joins.push({
                    fromColumn: column_name,
                    toColumn: referenced_column_name,
                });
            });
            results[table] = Object.values(relations);
        });

        return results;
    }

    /**
     * Get all relations where the given table does not hold the constraint (1 - N or 1 - 1)
     * That is => this table is the referenced_table
     * i.e. Users.user_id <- Posts.author_id
     * @param tables
     */
    public async getBackwardRelations(tables: string[]): Promise<TableMap<RelationDefinition[]>> {
        type rowType = {
            constraint_name: string;
            table_name: string;
            referenced_column_name: string;
            referencing_table_name: string;
            referencing_column_name: string;
        };

        const rows: rowType[] = await this.query(
            this.knex('information_schema.referential_constraints as c')
                .join('information_schema.key_column_usage as x', 'x.constraint_name', '=', 'c.constraint_name')
                .join('information_schema.key_column_usage as y', function (q) {
                    q.on('y.ordinal_position', '=', 'x.position_in_unique_constraint').andOn(
                        'y.constraint_name',
                        '=',
                        'c.unique_constraint_name',
                    );
                })
                .whereIn('y.table_name', tables)
                .where({ 'y.table_schema': this.schemaName })
                .select(
                    'x.constraint_name',
                    'x.table_name as referencing_table_name',
                    'x.column_name as referencing_column_name',
                    'y.table_name',
                    'y.column_name as referenced_column_name',
                )
                .orderBy('c.constraint_name', 'x.ordinal_position'),
        );

        const results: TableMap<RelationDefinition[]> = {};

        this.tableMap(rows, (table, rows) => {
            // group by constraint name to capture multiple relations to same table
            const relations: { [constraintName: string]: RelationDefinition } = {};
            rows.forEach((row) => {
                const {
                    referenced_column_name,
                    referencing_column_name,
                    referencing_table_name,
                    constraint_name,
                    table_name,
                } = row;
                if (table_name == null || referenced_column_name == null) return;

                if (!relations[constraint_name])
                    relations[constraint_name] = {
                        toTable: referencing_table_name,
                        alias: referencing_table_name,
                        joins: [],
                        constraintName: constraint_name,
                        type: 'hasMany', // default always 1 - N
                    };
                relations[constraint_name].joins.push({
                    fromColumn: referenced_column_name,
                    toColumn: referencing_column_name,
                });
            });
            results[table] = Object.values(relations);
        });

        return results;
    }

    /**
     * Get a list of all table names in schema
     */
    public async getSchemaTables(): Promise<string[]> {
        const schemaTables = await this.query(
            this.knex('information_schema.tables')
                .select('table_name')
                .where({ table_schema: this.schemaName })
                .where({ table_type: 'BASE TABLE' })
                .groupBy('table_name'),
        );

        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name);
    }
}
