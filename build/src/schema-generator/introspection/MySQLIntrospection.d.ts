import { EnumDefinitions, Introspection, TableColumnsDefinition } from './IntrospectionTypes';
import { ColumnType, ConstraintDefinition, RelationDefinition } from '../../types';
import Knex = require('knex');
export declare class MySQLIntrospection implements Introspection {
    private readonly schemaName;
    private knex;
    constructor(knex: Knex, schemaName?: string);
    /**
     * Map the MySQL schema to a typescript schema
     * @param tableName
     * @param columnName
     * @param dbType
     * @param customTypes - enum and set types
     */
    getTsTypeForColumn(tableName: string, columnName: string, dbType: string, customTypes: EnumDefinitions): ColumnType;
    /**
     * Get possible values from enum
     * @param mysqlEnum
     */
    private static parseMysqlEnumeration;
    /**
     * Get name of enum
     * @param tableName
     * @param columnName
     */
    private static getEnumName;
    /**
     * Get the enum types for a table
     * Note: - SET type is supported as well as ENUM but should rarely be used
     */
    getEnumTypesForTable(tableName: string): Promise<EnumDefinitions>;
    /**
     * Get the type definition for a table
     * @param tableName
     * @param enumTypes
     */
    getTableTypes(tableName: string, enumTypes: EnumDefinitions): Promise<TableColumnsDefinition>;
    getTableConstraints(tableName: string): Promise<ConstraintDefinition[]>;
    /**
     * Get all relations where the given table holds the constraint (N - 1 or 1 - 1) i.e. Posts.user_id -> Users.user_id
     * @param tableName
     */
    getForwardRelations(tableName: string): Promise<RelationDefinition[]>;
    /**
     * Get all relations where the given table does not hold the constraint (1 - N or 1 - 1) i.e. Users.user_id <- Posts.author_id
     * @param tableName
     */
    getBackwardRelations(tableName: string): Promise<RelationDefinition[]>;
    /**
     * Get a list of all table names in schema
     */
    getSchemaTables(): Promise<string[]>;
}
