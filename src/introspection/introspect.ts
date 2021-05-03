import Knex from 'knex';
import { Connection, DatabaseSchema, Introspection, LogLevel } from '../types';
import { PostgresIntrospection } from './postgres-introspection';
// import { MySQLIntrospection } from './MySQLIntrospection';
import { TableSchemaBuilder } from './table-schema-builder';

/**
 * Build schema from database connection
 * @param params
 */
export const introspectSchema = async (params: { conn: Connection; logLevel?: LogLevel }): Promise<DatabaseSchema> => {
    const { conn, logLevel } = params;

    const { host, port, user, database, schema } = conn.connection;

    console.log(`Introspecting schema: ${schema ?? database}`);

    const knex = Knex(conn);
    let DB: Introspection;

    if (conn.client === 'mysql') {
        // DB = new MySQLIntrospection(knex, database);
        DB = new PostgresIntrospection({ knex, schemaName: schema, logLevel: logLevel ?? LogLevel.info });
        // TODO:
    } else {
        DB = new PostgresIntrospection({ knex, schemaName: schema, logLevel: logLevel ?? LogLevel.info });
    }

    const relationalSchema: DatabaseSchema = {
        database: database,
        schema: schema ?? undefined,
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
