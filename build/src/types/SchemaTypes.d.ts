export declare type EnumType = string;
export declare enum Comparable {
    string = "string",
    number = "number",
    bigint = "bigint",
    boolean = "boolean",
    Date = "Date"
}
export declare enum NonComparable {
    Object = "Object",
    Array = "Array",
    ArrayStr = "Array<string>",
    ArrayBool = "Array<boolean>",
    ArrayNum = "Array<number>",
    ArrayObj = "Array<Object>",
    ArrayDate = "Array<Date>",
    Buffer = "Buffer",
    any = "any"
}
export declare type ColumnType = NonComparable | Comparable | EnumType;
export interface JoinDefinition {
    fromColumn: string;
    toColumn: string;
}
export declare type JoinType = 'hasMany' | 'belongsTo' | 'hasOne';
export interface RelationDefinition {
    toTable: string;
    alias: string;
    joins: JoinDefinition[];
    type: JoinType;
}
export interface ColumnDefinition {
    dbType: string;
    nullable: boolean;
    columnDefault: string | null;
    tsType?: ColumnType;
    columnName: string;
}
export interface EnumDefinition {
    columnName: string;
    enumName: string;
    values: string[];
}
export declare type ConstraintType = 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE';
export interface ConstraintDefinition {
    columnNames: string[];
    constraintName: string;
    constraintType: ConstraintType;
}
export interface TableSchemaDefinition {
    primaryKey?: ConstraintDefinition;
    keys: ConstraintDefinition[];
    uniqueKeyCombinations: string[][];
    nonUniqueKeyCombinations: string[][];
    columns: {
        [columnName: string]: ColumnDefinition;
    };
    softDelete: ColumnDefinition | null;
    enums: {
        [enumName: string]: EnumDefinition;
    };
    relations: RelationDefinition[];
}
export interface DatabaseSchema {
    database: string;
    schema: string;
    generatedAt: Date;
    tables: {
        [tableName: string]: TableSchemaDefinition;
    };
}
