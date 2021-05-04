import {
    ColumnType,
    Comparable,
    ConstraintDefinition,
    ConstraintType,
    EnumDefinition,
    EnumDefinitions,
    LogLevel,
    NonComparable,
    RelationDefinition,
    TableColumnsDefinition,
    TableMap,
} from '../types';
import Knex = require('knex');
import { Introspection } from './introspection';
import _ from 'lodash';

export class MySQLIntrospection extends Introspection {
    protected readonly schemaName: string;
    private knex: Knex;
    protected logLevel: LogLevel;

    public constructor(params: { knex: Knex; schemaName: string; logLevel: LogLevel }) {
        super();
        const { knex, schemaName, logLevel } = params;
        this.knex = knex;
        if (schemaName) this.schemaName = schemaName;
        else this.schemaName = 'public';
        this.logLevel = logLevel;
    }

    /**
     * Map the MySQL schema to a typescript schema
     * @param tableName
     * @param columnName
     * @param dbType
     * @param customTypes - enum and set types
     */
    public getTsTypeForColumn(
        tableName: string,
        columnName: string,
        dbType: string,
        customTypes: EnumDefinitions,
    ): ColumnType {
        switch (dbType) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'tinytext':
            case 'mediumtext':
            case 'longtext':
            case 'time':
            case 'geometry':
                // case 'set':
                // case 'enum': - these are handled in the default case
                return Comparable.string;
            case 'integer':
            case 'int':
            case 'smallint':
            case 'mediumint':
            case 'bigint':
            case 'double':
            case 'decimal':
            case 'numeric':
            case 'float':
            case 'year':
                return Comparable.number;
            case 'tinyint':
                return Comparable.boolean;
            case 'json':
                return NonComparable.Object;
            case 'date':
            case 'datetime':
            case 'timestamp':
                return Comparable.Date;
            case 'tinyblob':
            case 'mediumblob':
            case 'longblob':
            case 'blob':
            case 'binary':
            case 'varbinary':
            case 'bit':
                return NonComparable.Buffer;
            default: {
                const possibleEnum = MySQLIntrospection.getEnumName(tableName, columnName);
                if (customTypes[possibleEnum]) {
                    return possibleEnum;
                } else {
                    console.log(
                        `Type [${columnName}] has been mapped to [any] because no specific type has been found.`,
                    );
                    return NonComparable.any;
                }
            }
        }
    }

    /**
     * Get possible values from enum
     * @param mysqlEnum
     */
    private static parseMysqlEnumeration(mysqlEnum: string): string[] {
        return mysqlEnum.replace(/(^(enum|set)\('|'\)$)/gi, '').split(`','`);
    }

    /**
     * Get name of enum
     * @param tableName
     * @param columnName
     */
    private static getEnumName(tableName: string, columnName: string): string {
        return `${tableName}_${columnName}`;
    }

    /**
     * Get the enum types used by a table
     *  * Note: - SET type is supported as well as ENUM but should rarely be used
     * @param tables
     */
    public async getEnumTypesForTables(tables: string[]): Promise<TableMap<EnumDefinitions>> {
        type rowType = {
            column_type: string;
            column_name: string;
            table_name: string;
        };

        const rows: rowType[] = await this.query(
            this.knex('information_schema.columns')
                .select('table_name', 'column_name', 'column_type')
                .whereIn('data_type', ['enum', 'set'])
                .where({ table_schema: this.schemaName })
                .whereIn('table_name', tables),
        );

        const results: TableMap<EnumDefinitions> = {};

        this.tableMap(rows, (table, rows) => {
            const tableEnums: { [enumName: string]: EnumDefinition } = {};

            rows.forEach((enumItem) => {
                const enumName = MySQLIntrospection.getEnumName(enumItem.table_name, enumItem.column_name);
                tableEnums[enumName] = {
                    columnName: enumItem.column_name,
                    enumName,
                    values: MySQLIntrospection.parseMysqlEnumeration(enumItem.column_type).sort(),
                };
            });
            results[table] = tableEnums;
        });

        return results;
    }

    // /**
    //  * Get the enum types for a table
    //  * Note: - SET type is supported as well as ENUM but should rarely be used
    //  */
    // public async getEnumTypesForTable(tables: string[]): Promise<TableMap<EnumDefinitions>> {
    //     const rawEnumRecords = await this.knex('information_schema.columns')
    //         .select('table_name', 'column_name', 'column_type')
    //         .whereIn('data_type', ['enum', 'set'])
    //         .where({ table_schema: this.schemaName, table_name: tableName });

    //     rawEnumRecords.forEach((enumItem: { table_name: string; column_name: string; column_type: string }) => {
    //         const enumName = MySQLIntrospection.getEnumName(enumItem.table_name, enumItem.column_name);
    //         enums[enumName] = {
    //             columnName: enumItem.column_name,
    //             enumName,
    //             values: MySQLIntrospection.parseMysqlEnumeration(enumItem.column_type).sort(),
    //         };
    //     });
    //     return enums;
    // }

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
            data_type: string;
            is_nullable: string;
            column_default: string | null;
            extra: string | null;
        };

        const rows: RowType[] = await this.query(
            this.knex('information_schema.columns')
                .select('column_name', 'data_type', 'is_nullable', 'column_default', 'extra', 'table_name')
                .where({ table_schema: this.schemaName })
                .whereIn('table_name', tables),
        );

        const results: TableMap<TableColumnsDefinition> = {};

        this.tableMap(rows, (table, rows) => {
            const tableDefinition: TableColumnsDefinition = {};

            rows.map((schemaItem) => {
                const { column_name, column_default, extra, data_type, is_nullable } = schemaItem;
                tableDefinition[column_name] = {
                    dbType: data_type,
                    columnDefault: column_default || extra || null,
                    nullable: is_nullable === 'YES',
                    columnName: column_name,
                    tsType: this.getTsTypeForColumn(table, column_name, data_type, enumTypes[table]),
                };
            });
            results[table] = tableDefinition;
        });
        return results;
    }

    // /**
    //  * Get the type definition for a table
    //  * @param tableName
    //  * @param enumTypes
    //  */
    // public async getTableTypes(tableName: string, enumTypes: EnumDefinitions): Promise<TableColumnsDefinition> {
    //     let tableDefinition: TableColumnsDefinition = {};

    //     const tableColumns = await this.knex('information_schema.columns')
    //         .select('column_name', 'data_type', 'is_nullable', 'column_default', 'extra')
    //         .where({ table_name: tableName, table_schema: this.schemaName });

    //     tableColumns.map(
    //         (schemaItem: {
    //             column_name: string;
    //             data_type: string;
    //             is_nullable: string;
    //             column_default: string | null;
    //             extra: string;
    //         }) => {
    //             const columnName = schemaItem.column_name;
    //             const dbType = schemaItem.data_type;
    //             const extra = schemaItem.extra === '' ? null : schemaItem.extra;
    //             tableDefinition[columnName] = {
    //                 dbType,
    //                 columnDefault: schemaItem.column_default || extra,
    //                 nullable: schemaItem.is_nullable === 'YES',
    //                 columnName,
    //                 tsType: this.getTsTypeForColumn(tableName, columnName, dbType, enumTypes),
    //             };
    //         },
    //     );
    //     return tableDefinition;
    // }

    /**
     * Get constraints for tables
     * Bulk operation across many tables
     * @param tables
     * @returns
     */
    public async getTableConstraints(tables: string[]): Promise<TableMap<ConstraintDefinition[]>> {
        type RowType = {
            table_name: string;
            column_name: string;
            constraint_name: string;
            constraint_type: ConstraintType;
        };

        const rows: RowType[] = await this.query(
            this.knex('information_schema.key_column_usage as key_usage')
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
                .whereIn('key_usage.table_name', tables),
        );

        const results: TableMap<ConstraintDefinition[]> = {};

        this.tableMap(rows, (table, rows) => {
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

    // public async getTableConstraints(tableName: string): Promise<ConstraintDefinition[]> {
    //     const rows = await this.knex('information_schema.key_column_usage as key_usage')
    //         .select(
    //             'key_usage.table_name',
    //             'key_usage.column_name',
    //             'key_usage.constraint_name',
    //             'constraints.constraint_type',
    //         )
    //         .distinct()
    //         .leftJoin('information_schema.table_constraints as constraints', function () {
    //             this.on('key_usage.constraint_name', '=', 'constraints.constraint_name');
    //             this.andOn('key_usage.constraint_schema', '=', 'constraints.constraint_schema');
    //             this.andOn('key_usage.table_name', '=', 'constraints.table_name');
    //         })

    //         .where({ 'key_usage.table_name': tableName, 'key_usage.table_schema': this.schemaName });

    //     // group by constraint name
    //     const columnMap = _.groupBy(rows, (k) => k.constraint_name);
    //     const constraintMap = _.keyBy(rows, (k) => k.constraint_name);

    //     const constraintDefinitions: ConstraintDefinition[] = [];

    //     Object.values(constraintMap).forEach((constraint) => {
    //         const { constraint_type, constraint_name } = constraint;
    //         const columns = columnMap[constraint_name];

    //         constraintDefinitions.push({
    //             constraintName: constraint_name,
    //             constraintType: constraint_type,
    //             columnNames: columns.map((c) => c.column_name).sort(),
    //         });
    //     });
    //     return constraintDefinitions;
    // }

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
            this.knex('information_schema.key_column_usage')
                .select(
                    'table_name',
                    'column_name',
                    'constraint_name',
                    'referenced_table_name',
                    'referenced_column_name',
                )
                .where({ table_schema: this.schemaName })
                .whereIn('table_name', tables),
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

    // /**
    //  * Get all relations where the given table holds the constraint (N - 1 or 1 - 1) i.e. Posts.user_id -> Users.user_id
    //  * @param tableName
    //  */
    // public async getForwardRelations(tableName: string): Promise<RelationDefinition[]> {
    //     const rows = await this.knex('information_schema.key_column_usage')
    //         .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
    //         .where({ table_name: tableName, table_schema: this.schemaName });

    //     // group by constraint name to capture multiple relations to same table
    //     let relations: { [constraintName: string]: RelationDefinition } = {};
    //     rows.forEach((row) => {
    //         const { column_name, referenced_table_name, referenced_column_name, constraint_name } = row;
    //         if (referenced_table_name == null || referenced_column_name == null) return;

    //         if (!relations[constraint_name])
    //             relations[constraint_name] = {
    //                 toTable: referenced_table_name,
    //                 alias: referenced_table_name,
    //                 joins: [],
    //                 type: 'belongsTo', // default to N - 1
    //             };
    //         relations[constraint_name].joins.push({
    //             fromColumn: column_name,
    //             toColumn: referenced_column_name,
    //         });
    //     });
    //     return Object.values(relations);
    // }

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

        const rows: rowType[] = await this.query(
            this.knex('information_schema.key_column_usage')
                .select(
                    'table_name as referenced_table_name',
                    'column_name as referenced_column_name',
                    'constraint_name',
                    'referenced_table_name as table_name',
                    'referenced_column_name as column_name',
                )
                .where({ table_schema: this.schemaName })
                .whereIn('information_schema.key_column_usage.referenced_table_name', tables),
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
                        type: 'hasMany', // default always 1 - N
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

    // /**
    //  * Get all relations where the given table does not hold the constraint (1 - N or 1 - 1) i.e. Users.user_id <- Posts.author_id
    //  * @param tableName
    //  */
    // public async getBackwardRelations(tableName: string): Promise<RelationDefinition[]> {
    //     const rows = await this.knex('information_schema.key_column_usage')
    //         .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
    //         .where({ referenced_table_name: tableName, table_schema: this.schemaName });

    //     // group by constraint name to capture multiple relations to same table
    //     let relations: { [constraintName: string]: RelationDefinition } = {};
    //     rows.forEach((row) => {
    //         const { column_name, table_name, referenced_column_name, constraint_name } = row;
    //         if (table_name == null || column_name == null) return;

    //         if (!relations[constraint_name])
    //             relations[constraint_name] = {
    //                 toTable: table_name,
    //                 alias: table_name,
    //                 joins: [],
    //                 type: 'hasMany', // default to 1 - N
    //             };
    //         relations[constraint_name].joins.push({
    //             fromColumn: referenced_column_name,
    //             toColumn: column_name,
    //         });
    //     });
    //     return Object.values(relations);
    // }

    /**
     * Get a list of all table names in schema
     */
    public async getSchemaTables(): Promise<string[]> {
        const schemaTables = await this.query(
            this.knex('information_schema.columns')
                .select('table_name')
                .where({ table_schema: this.schemaName })
                .groupBy('table_name'),
        );

        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name).sort();
    }
}
