import { DatabaseSchema } from '../../types';
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
export declare const introspectSchema: (params: {
    conn: Connection;
}) => Promise<DatabaseSchema>;
