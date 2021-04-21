import Knex from 'knex';
import { Introspection } from './IntrospectionTypes';
import { MySQLIntrospection } from './MySQLIntrospection';
import { TableSchemaBuilder } from './TableSchemaBuilder';
import { DatabaseSchema } from '../../types';
import { PostgresIntrospection } from './PostgresIntrospection';

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

/**
 * Build schema from database connection
 * @param params
 */
export const introspectSchema = async (params: { conn: Connection }): Promise<DatabaseSchema> => {
    const { conn } = params;
    console.log(`Introspecting schema: ${conn.connection.database}`);

    const knex = Knex(conn);
    let DB: Introspection;

    if (conn.client === 'mysql') {
        DB = new MySQLIntrospection(knex, conn.connection.database);
    } else {
        DB = new PostgresIntrospection(knex);
    }

    const schema: DatabaseSchema = {
        database: conn.connection.database,
        schema: conn.connection.schema ?? conn.connection.database,
        generatedAt: new Date(),
        tables: {},
    };
    const tables = await DB.getSchemaTables();

    for (const table of tables) {
        schema.tables[table] = await new TableSchemaBuilder(table, DB).buildTableDefinition();
    }
    await knex.destroy();

    return schema;
};
