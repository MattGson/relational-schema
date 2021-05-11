#! /usr/bin/env node
/**
 * Commandline interface
 * Created by Matt Goodson
 */

import path from 'path';
import { logger } from '../lib/logger';
import yargs from 'yargs';
const { hideBin } = require('yargs/helpers');
import { generate } from '../index';
import { Format, LogLevel } from '../types';
import { printRelationTree } from '../schema-tools/print-relations';

type client = 'mysql' | 'pg';
const clients: ReadonlyArray<client> = ['mysql', 'pg'];

type format = Format;
const formats: ReadonlyArray<format> = [Format.json, Format.commonJS, Format.es6, Format.typescript];

type logLevel = LogLevel;
const logLevels: ReadonlyArray<logLevel> = [LogLevel.debug, LogLevel.info];

yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command(
        'introspect',
        'Generate schema from database',
        (yargs) => {
            yargs
                .options({
                    host: { type: 'string', default: '127.0.0.1' },
                    port: { type: 'number', default: 3306 },
                    client: { choices: clients, default: clients[0] },
                    user: { type: 'string', default: 'root' },
                    password: { type: 'string', default: '' },
                    database: { type: 'string', default: 'public' },
                    outdir: { type: 'string', default: './gen' },
                    format: { choices: formats, default: Format.json },
                    prettierConfig: { type: 'string', description: 'Path to a prettierrc file' },
                    logLevel: { choices: logLevels, default: LogLevel.info },
                    transitiveRelations: {
                        type: 'boolean',
                        default: true,
                        description: 'Include transitive (many-to-many) relations',
                    },
                })
                .global('config')
                .default('config', 'relation-config.json')
                .config('config', 'Configure using a json file')
                .example(
                    '$0 introspect',
                    'generate the schema using a introspect-config.json file in the current directory',
                );
        },
        async (argv) => {
            await introspect(argv);
        },
    )
    .command(
        'tree',
        'Print a relation tree from a table',
        (yargs) => {
            yargs
                .options({
                    table: { type: 'string' },
                    schemaFile: {
                        type: 'string',
                        description: 'The location of the relations schema file',
                    },
                    showBackwardRelations: {
                        type: 'boolean',
                        default: false,
                        description: 'Show incoming foreign keys as well as outgoing',
                    },
                    maxDepth: {
                        type: 'number',
                        default: 5,
                        description: 'The maximum tree depth',
                    },
                })
                .demandOption('table')
                .demandOption('schemaFile')
                .example('$0 tree users', 'Print a relation tree from the users table');
        },
        async (argv) => {
            await printRelationTree({
                root: argv.table as string,
                schemaPath: argv.schemaFile as string,
                maxDepth: argv.maxDepth as number,
                showBackwardRelations: argv.showBackwardRelations as boolean,
            });
        },
    )
    .alias('h', 'help').argv;

async function introspect(args: any) {
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
        logger.error(e);
        logger.info('Use: "relation -h" to see help');
        process.exit(1);
    }
}
