import Knex from 'knex';
import { PostgresIntrospection } from 'src/introspection';
import { Introspection } from 'src/introspection/introspection';
import { MySQLIntrospection } from 'src/introspection/mysql-introspection';
import { LogLevel } from 'src/types';

export const DB = (): 'mysql' | 'pg' => {
    const db = process.env.DB;
    if (db !== 'mysql' && db !== 'pg') throw new Error('DB must be pg or mysql');
    return db;
};

export const getIntrospection = (knex: Knex, schema: string): Introspection => {
    if (DB() === 'mysql') {
        return new MySQLIntrospection({ knex, schemaName: schema, logLevel: LogLevel.info });
    }
    return new PostgresIntrospection({ knex, schemaName: schema, logLevel: LogLevel.info });
};
