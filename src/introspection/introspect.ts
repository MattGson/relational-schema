import Knex from 'knex';
import { ConnectionConfig, DatabaseSchema, LogLevel } from '../types';
import { Introspection } from './introspection';
import { PostgresIntrospection } from './postgres-introspection';
import { MySQLIntrospection } from './mysql-introspection';
import { TableSchemaBuilder } from './table-schema-builder';

/**
 * Build schema from database connection
 * @param params
 */
export const introspectSchema = async (params: {
    conn: ConnectionConfig;
    logLevel?: LogLevel;
}): Promise<DatabaseSchema> => {
    const { conn, logLevel } = params;

    const { host, port, user, database, schema } = conn.connection;

    const knex = Knex(conn);
    let DB: Introspection;

    if (conn.client === 'mysql') {
        DB = new MySQLIntrospection({ knex, databaseName: database, logLevel: logLevel ?? LogLevel.info });
    } else if (conn.client === 'pg') {
        DB = new PostgresIntrospection({ knex, schemaName: schema, logLevel: logLevel ?? LogLevel.info });
    } else {
        throw new Error('Unrecognised client ' + conn.client);
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

        tables.forEach((table) => {
            relationalSchema.tables[table] = new TableSchemaBuilder(
                table,
                enums,
                definitions,
                constraints,
                forward,
                backwards,
            ).buildTableDefinition();
        });

        await knex.destroy();
    } catch (e) {
        await knex.destroy();
        throw e;
    }

    return relationalSchema;
};
