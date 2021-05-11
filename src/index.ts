import { BuilderOptions, ConnectionConfig, Format, LogLevel } from './types';
import { introspectSchema } from './introspection/introspect';
import { writeFormattedFile } from './printer';
import { logger } from './lib/logger';

export * from './types';

// **************************
// generate schema
// **************************

/**
 * Generate the schema
 * @param args
 */
export async function generate(args: {
    conn: ConnectionConfig;
    outdir: string;
    format: Format;
    prettierConfig?: string;
    logLevel: LogLevel;
    options: BuilderOptions;
}): Promise<ConnectionConfig> {
    const { conn, outdir, format, prettierConfig, logLevel, options } = args;
    logger.info(`Generating for db: ${conn.client} - ${conn.connection.database}`);

    const schema = await introspectSchema({ conn, logLevel, options });

    switch (format) {
        case Format.es6:
            await writeFormattedFile({
                prettierConfig,
                content: `
                 export default ${JSON.stringify(schema)}
            `,
                directory: outdir,
                filename: 'relational-schema',
                format: Format.es6,
            });
            break;
        case Format.commonJS:
            await writeFormattedFile({
                prettierConfig,
                content: `
                 module.exports = ${JSON.stringify(schema)}
            `,
                directory: outdir,
                filename: 'relational-schema',
                format: Format.commonJS,
            });
            break;
        case Format.typescript:
            await writeFormattedFile({
                prettierConfig,
                content: `
                     export default ${JSON.stringify(schema)}
                     `,
                directory: outdir,
                filename: 'relational-schema',
                format: Format.typescript,
            });

            break;
        case Format.json:
            await writeFormattedFile({
                prettierConfig,
                content: JSON.stringify(schema),
                directory: outdir,
                filename: 'relational-schema',
                format: Format.json,
            });
    }

    logger.info(`Generated for ${Object.keys(schema.tables).length} tables in ${outdir}`);
    return conn;
}
