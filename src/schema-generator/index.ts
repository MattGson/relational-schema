import { Connection, introspectSchema } from './Introspection';
import { writeTypescriptFile } from './lib';

// **************************
// generate schema
// **************************

/**
 *
 * @param conn
 * @param outdir - write files to this dir
 */
export async function generate(conn: Connection, outdir: string) {
    console.log(`Generating schema for db: ${conn.connection.database}`);

    const schema = await introspectSchema({ conn });

    // write code to files
    await writeTypescriptFile(
        `
        import { DatabaseSchema } from 'relational-schema';

        export const schema: DatabaseSchema = ${JSON.stringify(schema)}`,
        outdir,
        `gybson.schema.ts`,
    );

    console.log(`Generated for ${Object.keys(schema).length} tables in ${outdir}`);
}
