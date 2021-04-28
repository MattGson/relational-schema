import { Connection } from './introspection';
export declare enum Format {
    json = 0,
    es6 = 1,
    typescript = 2,
    commonJS = 3
}
/**
 *
 * @param conn
 * @param outdir - write files here
 * @param format - output format
 */
export declare function generate(conn: Connection, outdir: string, format: Format): Promise<void>;
