export type EnumType = string;

export enum Comparable {
    string = 'string',
    number = 'number',
    bigint = 'bigint',
    boolean = 'boolean',
    Date = 'Date',
}

export enum NonComparable {
    Object = 'Object',
    Array = 'Array',
    ArrayStr = 'Array<string>',
    ArrayBool = 'Array<boolean>',
    ArrayNum = 'Array<number>',
    ArrayObj = 'Array<Object>',
    ArrayDate = 'Array<Date>',
    Buffer = 'Buffer',
    any = 'any',
}

export type ColumnType = NonComparable | Comparable | EnumType;

// relations map
export interface JoinDefinition {
    // name of column to join from
    fromColumn: string;
    // name of column to join to
    toColumn: string;
}

export type JoinType = 'hasMany' | 'belongsTo' | 'hasOne'; // 1-n OR n-1 OR 1-1

export interface RelationDefinition {
    // name of table to join to
    toTable: string;
    // name of relation i.e. posts -> users would be 'author'
    alias: string;
    // columns to complete the join
    joins: JoinDefinition[];
    // direction of key / cardinality of join
    type: JoinType;
    // name of the constraint the relation is derived from
    constraintName: string;
}

export interface TransitiveRelationDefinition {
    // name of table to join to
    toTable: string;
    // name of the intermediate table
    joinTable: string;
    // name of relation i.e. posts -> users would be 'author'
    alias: string;
    // direction of key / cardinality of join
    type: 'manyToMany';

    joinFrom: {
        joins: JoinDefinition[];
        toTable: string;
        constraintName: string;
    };

    joinTo: {
        joins: JoinDefinition[];
        toTable: string;
        constraintName: string;
    };
}

export interface ColumnDefinition {
    dbType: string;
    nullable: boolean;
    generated: boolean;
    columnDefault: string | null;
    characterMaximumLength: number | null;
    tsType?: ColumnType;
    columnName: string;
}

export interface EnumDefinition {
    id?: string;
    columnName?: string;
    enumName: string;
    values: string[];
}

export type ConstraintType = 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE';
export interface ConstraintDefinition {
    columnNames: string[];
    constraintName: string;
    constraintType: ConstraintType;
    on_update?: string;
    on_delete?: string;
}

export interface TableSchemaDefinition {
    primaryKey?: ConstraintDefinition;
    keys: ConstraintDefinition[];
    uniqueKeyCombinations: string[][];
    columns: {
        [columnName: string]: ColumnDefinition;
    };
    softDelete: ColumnDefinition | null;
    enums: {
        [enumName: string]: EnumDefinition;
    };
    relations: (RelationDefinition | TransitiveRelationDefinition)[];
}

export interface DatabaseSchema {
    database: string;
    schema?: string;
    connection: {
        host: string;
        port: string | number;
        user: string;
    };
    generatedAt: Date;
    tables: {
        [tableName: string]: TableSchemaDefinition;
    };
}
