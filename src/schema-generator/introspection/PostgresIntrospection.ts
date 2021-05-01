import { EnumDefinitions, Introspection, TableColumnsDefinition, TableMap } from './IntrospectionTypes';
import { ColumnType, Comparable, ConstraintDefinition, NonComparable, RelationDefinition } from '../../types';
import _ from 'lodash';
import Knex = require('knex');

export class PostgresIntrospection implements Introspection {
    private readonly schemaName: string;
    private knex: Knex;

    public constructor(knex: Knex, schemaName?: string) {
        this.knex = knex;
        if (schemaName) this.schemaName = schemaName;
        else this.schemaName = 'public';
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
                if (customTypes[dbType]) {
                    return dbType;
                } else {
                    console.log(
                        `Type [${columnName}] has been mapped to [any] because no specific type has been found.`,
                    );
                    return NonComparable.any;
                }
            }
        }
    }

    // TODO:- need to support native enums and allowed values ideally
    /**
     * TODO:- PG enums are global so this just adds them for each table for now
     * Get the enum types used by a table
     * @param tables
     */
    public async getEnumTypesForTables(tables: string[]): Promise<TableMap<EnumDefinitions>> {
        type rowType = {
            enum_name: string;
            value: string;
            oid: number;
        };
        const result: { rows: rowType[] } = await this.knex.raw(`
            select t.typname as enum_name, e.enumlabel as value, t.oid 
            from pg_type t
            inner join pg_enum e ON (t.oid = e.enumtypid) 
            left join pg_catalog.pg_namespace n ON (n.oid = t.typnamespace) 
            where n.nspname = '${this.schemaName}';
        `);

        const reconciled: TableMap<rowType[]> = tables.reduce((acc: any, val) => {
            acc[val] = result.rows;
            return acc;
        }, {});

        const results: TableMap<EnumDefinitions> = {};

        Object.entries(reconciled).forEach(([table, rows]) => {
            // const rows: rowType[] = result.rows;
            const enumRows = _.groupBy(rows, (r) => r.oid);

            const enums: EnumDefinitions = {};
            for (const [oid, values] of Object.entries(enumRows)) {
                const [{ enum_name }] = values;
                enums[enum_name] = {
                    id: oid,
                    enumName: enum_name,
                    values: values.map((v) => v.value).sort(),
                    columnName: '', // TODO:- how to link to table? info schema udt_name ?
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
        const rows = await this.knex('information_schema.columns')
            .select('table_name', 'column_name', 'udt_name', 'is_nullable', 'column_default')
            .where({ table_schema: this.schemaName })
            .whereIn('table_name', tables);

        const reconciled = _.groupBy(rows, (r) => r.table_name);

        const results: TableMap<TableColumnsDefinition> = {};

        Object.entries(reconciled).forEach(([table, rows]) => {
            const tableDefinition: TableColumnsDefinition = {};

            rows.map(
                (schemaItem: {
                    column_name: string;
                    udt_name: string;
                    is_nullable: string;
                    column_default: string | null;
                }) => {
                    const columnName = schemaItem.column_name;
                    const dbType = schemaItem.udt_name;
                    tableDefinition[columnName] = {
                        dbType,
                        columnDefault: schemaItem.column_default,
                        nullable: schemaItem.is_nullable === 'YES',
                        columnName,
                        tsType: this.getTsTypeForColumn(table, columnName, dbType, enumTypes[table]),
                    };
                },
            );
            results[table] = tableDefinition;
        });
        return results;
    }

    /**
     * Get constraints for tables
     * Bulk operation across many tables
     * @param tables
     * @returns
     */
    public async getTableConstraints(tables: string[]): Promise<TableMap<ConstraintDefinition[]>> {
        const rows = await this.knex('information_schema.key_column_usage as key_usage')
            .select(
                'key_usage.table_name',
                'key_usage.column_name',
                'key_usage.constraint_name',
                'constraints.constraint_type',
            )
            .distinct()
            .leftJoin('information_schema.table_constraints as constraints', function () {
                this.on('key_usage.constraint_name', '=', 'constraints.constraint_name');
                this.andOn('key_usage.constraint_schema', '=', 'constraints.constraint_schema');
                this.andOn('key_usage.table_name', '=', 'constraints.table_name');
            })
            .where({ 'key_usage.table_schema': this.schemaName })
            .whereIn('key_usage.table_name', tables);

        const reconciled = _.groupBy(rows, (r) => r.table_name);

        const results: TableMap<ConstraintDefinition[]> = {};

        Object.entries(reconciled).forEach(([table, rows]) => {
            // group by constraint name
            const columnMap = _.groupBy(rows, (k) => k.constraint_name);
            const constraintMap = _.keyBy(rows, (k) => k.constraint_name);

            const constraintDefinitions: ConstraintDefinition[] = [];

            Object.values(constraintMap).forEach((constraint) => {
                const { constraint_type, constraint_name } = constraint;
                const columns = columnMap[constraint_name];

                constraintDefinitions.push({
                    constraintName: constraint_name,
                    constraintType: constraint_type,
                    columnNames: columns.map((c) => c.column_name).sort(),
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

        const result: { rows: rowType[] } = await this.knex.raw(`
            select c.constraint_name
                , x.table_name
                , x.column_name
                , y.table_name as referenced_table_name
                , y.column_name as referenced_column_name
            from information_schema.referential_constraints c
            left join information_schema.key_column_usage x
                on x.constraint_name = c.constraint_name
            left join information_schema.key_column_usage y
                on y.ordinal_position = x.position_in_unique_constraint
                and y.constraint_name = c.unique_constraint_name
            WHERE x.table_name IN (${tables.map((t) => `'${t}'`).join(',')})
            order by c.constraint_name, x.ordinal_position
        `);

        const reconciled = _.groupBy(result.rows, (r) => r.table_name);

        const results: TableMap<RelationDefinition[]> = {};

        Object.entries(reconciled).forEach(([table, rows]) => {
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
     * Get all relations where the given table does not hold the constraint (1 - N or 1 - 1) i.e. Users.user_id <- Posts.author_id
     * @param tables
     */
    public async getBackwardRelations(tables: string[]): Promise<TableMap<RelationDefinition[]>> {
        type rowType = {
            constraint_name: string;
            table_name: string;
            column_name: string;
            referenced_table_name: string;
            referenced_column_name: string;
        };

        const result: { rows: rowType[] } = await this.knex.raw(`
            select c.constraint_name
                , x.table_name
                , x.column_name
                , y.table_name as referenced_table_name
                , y.column_name as referenced_column_name
            from information_schema.referential_constraints c
            left join information_schema.key_column_usage x
                on x.constraint_name = c.constraint_name
            left join information_schema.key_column_usage y
                on y.ordinal_position = x.position_in_unique_constraint
                and y.constraint_name = c.unique_constraint_name
            WHERE y.table_name IN (${tables.map((t) => `'${t}'`).join(',')})
            order by c.constraint_name, x.ordinal_position
        `);

        const reconciled = _.groupBy(result.rows, (r) => r.referenced_table_name);

        const results: TableMap<RelationDefinition[]> = {};

        Object.entries(reconciled).forEach(([table, rows]) => {
            // group by constraint name to capture multiple relations to same table
            const relations: { [constraintName: string]: RelationDefinition } = {};
            rows.forEach((row) => {
                const { column_name, table_name, referenced_column_name, constraint_name } = row;
                if (table_name == null || column_name == null) return;

                if (!relations[constraint_name])
                    relations[constraint_name] = {
                        toTable: table_name,
                        alias: table_name,
                        joins: [],
                        type: 'hasMany', // default always 1 - N
                    };
                relations[constraint_name].joins.push({
                    fromColumn: referenced_column_name,
                    toColumn: column_name,
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
        const schemaTables = await this.knex('information_schema.columns')
            .select('table_name')
            .where({ table_schema: this.schemaName })
            .groupBy('table_name');

        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name);
    }
}
