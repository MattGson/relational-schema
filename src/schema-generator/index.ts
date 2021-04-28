import { Connection, introspectSchema } from './introspection';
import { writeJSFile, writeJSONFile, writeTypescriptFile } from './lib';

// **************************
// generate schema
// **************************

export enum Format {
    json,
    es6,
    typescript,
    commonJS,
}

/**
 *
 * @param conn
 * @param outdir - write files here
 * @param format - output format
 */
export async function generate(conn: Connection, outdir: string, format: Format) {
    console.log(`Generating schema for db: ${conn.connection.database}`);

    const schema = await introspectSchema({ conn });

    switch (format) {
        case Format.es6:
            await writeJSFile(
                `
                 export const schema = ${JSON.stringify(schema)}\`
            `,
                outdir,
                'relational-schema',
            );
            break;
        case Format.commonJS:
            await writeJSFile(
                `
                 module.exports = ${JSON.stringify(schema)}\`
            `,
                outdir,
                'relational-schema',
            );
            break;
        case Format.typescript:
            await writeTypescriptFile(
                `
                     export const schema = ${JSON.stringify(schema)}`,
                outdir,
                `relational-schema`,
            );
            break;
        case Format.json:
            await writeJSONFile(schema, outdir, 'relational-schema');
    }

    console.log(`Generated for ${Object.keys(schema).length} tables in ${outdir}`);
}
