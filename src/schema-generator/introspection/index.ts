import Knex from 'knex';
import { Introspection } from './IntrospectionTypes';
// import { MySQLIntrospection } from './MySQLIntrospection';
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

    const { host, port, user, database, schema } = conn.connection;

    console.log(`Introspecting schema: ${schema ?? database}`);

    const knex = Knex(conn);
    let DB: Introspection;

    if (conn.client === 'mysql') {
        // DB = new MySQLIntrospection(knex, database);
        DB = new PostgresIntrospection(knex);
        // TODO:
    } else {
        DB = new PostgresIntrospection(knex);
    }

    const relationalSchema: DatabaseSchema = {
        database: database,
        schema: schema ?? database,
        connection: {
            host,
            port,
            user,
        },
        generatedAt: new Date(),
        tables: {},
    };

    try {
        const tables = await DB.getSchemaTables();

        const enums = await DB.getEnumTypesForTables(tables);
        const definitions = await DB.getTableTypes(tables, enums);
        const constraints = await DB.getTableConstraints(tables);
        const forward = await DB.getForwardRelations(tables);
        const backwards = await DB.getBackwardRelations(tables);

        for (const table of tables) {
            relationalSchema.tables[table] = await new TableSchemaBuilder(
                table,
                enums,
                definitions,
                constraints,
                forward,
                backwards,
            ).buildTableDefinition();
        }
        await knex.destroy();
    } catch (e) {
        await knex.destroy();
        throw e;
    }

    return relationalSchema;
};
