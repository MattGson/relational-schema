import { ColumnDefinition, EnumDefinition } from './schema-types';

export interface TableMap<T> {
    [tableName: string]: T;
}

export interface TableColumnsDefinition {
    [columnName: string]: ColumnDefinition;
}

export interface EnumDefinitions {
    [enumName: string]: EnumDefinition;
}
