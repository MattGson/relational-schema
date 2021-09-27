import Knex from 'knex';
import { BuilderOptions, ConnectionConfig, DatabaseSchema, LogLevel } from '../types';
import { Introspection } from './introspection';
import { PostgresIntrospection } from './postgres-introspection';
import { MySQLIntrospection } from './mysql-introspection';
import { TableSchemaBuilder } from './table-schema-builder';
import { logger } from '../lib/logger';

/**
 * Build schema from database connection
 * @param params
 */
export const introspectSchema = async (params: {
    conn: ConnectionConfig;
    logLevel?: LogLevel;
    options: BuilderOptions;
}): Promise<DatabaseSchema> => {
    const { conn, logLevel, options } = params;

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

    logger.debug(`Introspecting ${JSON.stringify(relationalSchema)}`);

    try {
        const tables = await DB.getSchemaTables();
        logger.debug(`Found ${tables.length} tables`);
        const enums = await DB.getEnumTypesForTables(tables);
        logger.debug(`Introspected ${Object.entries(enums).length} enums`);
        const definitions = await DB.getTableTypes(tables, enums);
        logger.debug(`Introspected ${Object.entries(definitions).length} tables`);
        const constraints = await DB.getTableConstraints(tables);
        logger.debug(`Introspected ${Object.entries(constraints).length} constraints`);

        const forward = await DB.getForwardRelations(tables);
        const backwards = await DB.getBackwardRelations(tables);

        logger.debug(
            `Introspected ${Object.entries(forward).length + Object.entries(backwards).length} foreign key relations`,
        );

        tables.forEach((table) => {
            relationalSchema.tables[table] = new TableSchemaBuilder(
                table,
                enums,
                definitions,
                constraints,
                forward,
                backwards,
            ).buildTableDefinition(options);
        });

        logger.debug(`Built ${Object.entries(relationalSchema.tables).length} table schemas`);

        await knex.destroy();
    } catch (e) {
        await knex.destroy();
        throw e;
    }

    return relationalSchema;
};
