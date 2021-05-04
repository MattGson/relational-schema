import Knex from 'knex';
import { migrateDb } from './migrate-db';
import { ConnectionConfig } from 'src/types';
import { Connection as PGConn } from 'pg';
import { Connection as MySQLConn } from 'promise-mysql';
import { DB } from './test.env';
type PoolConnection = PGConn | MySQLConn;

export const schemaName = 'tests';
export const mysqlConnection: ConnectionConfig = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: schemaName,
        multipleStatements: true,
    },
};

export const pgConnection: ConnectionConfig = {
    client: 'pg',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: schemaName,
        schema: 'public',
    },
    pool: {
        min: 2,
        max: 50,
    },
};

const state: any = {
    knex: undefined,
};

// helpers for testing manual connection handling
export const closePoolConnection = async (connection: PoolConnection): Promise<void> =>
    state.knex.client.releaseConnection(connection);

export const knex = (): Knex => state.knex;
export const closeConnection = async (): Promise<void> => state.knex.destroy();

export const openConnection = async (): Promise<Knex> => {
    if (DB() === 'pg') {
        state.knex = Knex(pgConnection);
        return state.knex;
    }
    if (DB() === 'mysql') {
        state.knex = Knex(mysqlConnection);
        return state.knex;
    }
    throw new Error('No db specified while opening connection');
};

export const buildDBSchemas = async (): Promise<ConnectionConfig> => {
    if (!knex()) {
        await openConnection();
    }

    await migrateDb(state.knex, DB() === 'pg');
    return pgConnection;

    throw new Error('No db specified');
};
