import { EnumDefinitions, Introspection, TableColumnsDefinition } from './IntrospectionTypes';
import { ColumnType, ConstraintDefinition, RelationDefinition } from '../../types';
import Knex = require('knex');
export declare class PostgresIntrospection implements Introspection {
    private readonly schemaName;
    private knex;
    constructor(knex: Knex, schemaName?: string);
    getTsTypeForColumn(tableName: string, columnName: string, dbType: string, customTypes: EnumDefinitions): ColumnType;
    /**
     * Get name of enum
     * @param tableName
     * @param enumName
     */
    private static getEnumName;
    /**
     * Get the enum types used by a table
     * @param tableName
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
