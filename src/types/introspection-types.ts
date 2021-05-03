import { ColumnDefinition, ColumnType, ConstraintDefinition, EnumDefinition, RelationDefinition } from './schema-types';

export interface TableMap<T> {
    [tableName: string]: T;
}

export interface TableColumnsDefinition {
    [columnName: string]: ColumnDefinition;
}

export interface EnumDefinitions {
    [enumName: string]: EnumDefinition;
}

export interface Introspection {
    getSchemaTables(): Promise<string[]>;
    getEnumTypesForTables(tables: string[]): Promise<TableMap<EnumDefinitions>>;
    getTableTypes(tables: string[], enumTypes: TableMap<EnumDefinitions>): Promise<TableMap<TableColumnsDefinition>>;
    getTableConstraints(tables: string[]): Promise<TableMap<ConstraintDefinition[]>>;
    getForwardRelations(tables: string[]): Promise<TableMap<RelationDefinition[]>>;
    getBackwardRelations(tables: string[]): Promise<TableMap<RelationDefinition[]>>;
    getTsTypeForColumn(tableName: string, columnName: string, dbType: string, customTypes: EnumDefinitions): ColumnType;
}
