#! /usr/bin/env node
"use strict";
/**
 * Commandline interface
 * Created by Matt Goodson
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = require("yargs");
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
const clients = ['mysql', 'pg'];
const formats = [index_1.Format.json, index_1.Format.commonJS, index_1.Format.es6, index_1.Format.typescript];
const args = yargs_1.usage('Usage: $0 <command> [options]')
    .options({
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'number', default: 3306 },
    client: { choices: clients, default: clients[0] },
    user: { type: 'string', default: 'root' },
    password: { type: 'string', default: '' },
    database: { type: 'string', default: 'public' },
    outdir: { type: 'string', default: './gen' },
    format: { choices: formats, default: formats[0] },
})
    .global('config')
    .default('config', 'introspect-config.json')
    .config('config', 'Configure using a json file')
    .command('introspect', 'Generate schema from database')
    .example('$0 introspect', 'generate the schema using a introspect-config.json file in the current directory') //     .demand('o')
    .alias('h', 'help').argv;
const run = () => __awaiter(void 0, void 0, void 0, function* () {
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
        const outdir = args.outdir;
        const format = args.format;
        const CURRENT = process.cwd();
        const GENERATED_DIR = path_1.default.join(CURRENT, outdir);
        yield index_1.generate(conn, GENERATED_DIR, format);
    }
    catch (e) {
        console.error(e.message);
        console.log('Use: "relation -h" to see help');
        process.exit(1);
    }
});
run()
    .then(() => {
    process.exit();
})
    .catch((e) => {
    console.warn(e.message);
    console.log('Use: "relation -h" to see help');
    process.exit(1);
});
//# sourceMappingURL=entry.js.map