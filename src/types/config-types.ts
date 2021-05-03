export const enum Format {
    json = 'json',
    es6 = 'es6',
    typescript = 'ts',
    commonJS = 'cjs',
}

export interface Connection {
    client: 'mysql' | 'pg';
    connection: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        schema?: string;
        multipleStatements?: boolean;
    };
    pool?: {
        min: number;
        max: number;
    };
}

export enum LogLevel {
    info = 'info',
    debug = 'debug',
}
