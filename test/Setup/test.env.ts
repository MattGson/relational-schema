import { PostgresIntrospection } from 'src/introspection';
import { Introspection, LogLevel } from 'src/types';

export const DB = (): 'mysql' | 'pg' => {
    const db = process.env.DB;
    if (db !== 'mysql' && db !== 'pg') throw new Error('DB must be pg or mysql');
    return db;
};

export const getIntrospection = (knex: any, schema?: string): Introspection => {
    if (DB() === 'mysql') {
        // return new MySQLIntrospection(knex, schema);
    }
    return new PostgresIntrospection({ knex, schemaName: schema, logLevel: LogLevel.info });
};
