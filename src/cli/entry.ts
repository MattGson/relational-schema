#! /usr/bin/env node
/**
 * Commandline interface
 * Created by Matt Goodson
 */

import path from 'path';
import { usage } from 'yargs';
import { generate } from '../index';
import { Format, LogLevel } from '../types';

type client = 'mysql' | 'pg';
const clients: ReadonlyArray<client> = ['mysql', 'pg'];

type format = Format;
const formats: ReadonlyArray<format> = [Format.json, Format.commonJS, Format.es6, Format.typescript];

type logLevel = LogLevel;
const logLevels: ReadonlyArray<logLevel> = [LogLevel.debug, LogLevel.info];

const args = usage('Usage: $0 <command> [options]')
    .options({
        host: { type: 'string', default: '127.0.0.1' },
        port: { type: 'number', default: 3306 },
        client: { choices: clients, default: clients[0] },
        user: { type: 'string', default: 'root' },
        password: { type: 'string', default: '' },
        database: { type: 'string', default: 'public' },
        outdir: { type: 'string', default: './gen' },
        format: { choices: formats, default: Format.json },
        prettierConfig: { type: 'string' },
        logLevel: { choices: logLevels, default: LogLevel.info },
        transitiveRelations: { type: 'boolean', default: true },
    })
    .global('config')
    .default('config', 'introspect-config.json')
    .config('config', 'Configure using a json file')
    .command('introspect', 'Generate schema from database')
    .example('$0 introspect', 'generate the schema using a introspect-config.json file in the current directory') //     .demand('o')
    .alias('h', 'help').argv;

const run = async () => {
    try {
        const conn = {
            client: args.client,
            connection: {
                host: args.host,
                port: args.port,
                user: args.user,
                password: args.password,
                database: args.database,
            },
        };

        const options = {
            transitiveRelations: args.transitiveRelations,
        };

        const outdir = args.outdir;
        const format = args.format;
        const prettierConfig = args.prettierConfig;
        const logs = args.logLevel;

        const CURRENT = process.cwd();
        const GENERATED_DIR = path.join(CURRENT, outdir);

        await generate({ conn, outdir: GENERATED_DIR, format, prettierConfig, logLevel: logs, options });
    } catch (e) {
        console.error(e);
        console.log('Use: "relation -h" to see help');
        process.exit(1);
    }
};

run()
    .then(() => {
        process.exit();
    })
    .catch((e: any) => {
        console.warn(e.message);
        console.log('Use: "relation -h" to see help');
        process.exit(1);
    });
