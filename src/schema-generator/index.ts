import { Connection, introspectSchema } from './introspection';
import { writeFormattedFile } from './lib';

// **************************
// generate schema
// **************************

export const enum Format {
    json = 'json',
    es6 = 'es6',
    typescript = 'ts',
    commonJS = 'cjs',
}

/**
 * Generate the schema
 * @param args
 */
export async function generate(args: {
    conn: Connection;
    outdir: string;
    format: Format;
    prettierConfig?: string;
}): Promise<Connection> {
    const { conn, outdir, format, prettierConfig } = args;
    console.log(`Generating schema for db: ${conn.connection.database}`);

    const schema = await introspectSchema({ conn });

    switch (format) {
        case Format.es6:
            await writeFormattedFile({
                prettierConfig,
                content: `
                 export const schema = ${JSON.stringify(schema)}
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
                     export const schema = ${JSON.stringify(schema)}
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

    console.log(`Generated for ${Object.keys(schema).length} tables in ${outdir}`);
    return conn;
}
