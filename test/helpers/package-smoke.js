const assert = require('assert').strict;
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const client = process.env.DB;
assert(['pg', 'mysql'].includes(client), 'Set DB to pg or mysql and run the database test suite first');
const consumer = fs.mkdtempSync(path.join(os.tmpdir(), 'relational-schema-package-'));

function run(command, args, cwd = consumer) {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 180000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
}

function readSchema(directory) {
    const schema = JSON.parse(fs.readFileSync(path.join(directory, 'relational-schema.json'), 'utf8'));
    assert(Number.isFinite(Date.parse(schema.generatedAt)), 'Expected a generation timestamp');
    delete schema.generatedAt;
    return schema;
}

try {
    const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', consumer], root));
    fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ private: true }));
    run('npm', [
        'install',
        '--omit=dev',
        '--no-audit',
        '--no-fund',
        path.join(consumer, packed[0].filename),
        `typescript@${require(path.join(root, 'node_modules/typescript/package.json')).version}`,
        `@types/node@${require(path.join(root, 'node_modules/@types/node/package.json')).version}`,
    ]);
    const cli = path.join(consumer, 'node_modules/.bin/relations');
    run(cli, ['--help']);
    const config = {
        client,
        host: 'localhost',
        port: client === 'pg' ? 5432 : 3306,
        user: client === 'pg' ? 'postgres' : 'root',
        password: '',
        database: 'tests',
        schema: 'public',
    };
    fs.writeFileSync(path.join(consumer, 'relation-config.json'), JSON.stringify(config));
    for (const [format, outdir] of [
        ['json', 'first'],
        ['json', 'second'],
        ['cjs', 'commonjs'],
        ['es6', 'esm'],
        ['ts', 'typescript'],
    ]) {
        fs.mkdirSync(path.join(consumer, outdir));
        run(cli, ['introspect', '--format', format, '--outdir', outdir]);
    }
    const actual = readSchema(path.join(consumer, 'first'));
    assert(Object.keys(actual.tables).length > 0, 'Expected fixture tables');
    assert.deepEqual(actual, { ...readSchema(path.join(root, 'test/generated')), schema: config.schema });
    assert.deepEqual(actual, readSchema(path.join(consumer, 'second')));
    run(process.execPath, [
        '-e',
        `
        const assert = require('assert').strict;
        assert.equal(typeof require('relational-schema').generate, 'function');
        const schema = require('./commonjs/relational-schema');
        delete schema.generatedAt;
        const expected = require('./first/relational-schema.json');
        delete expected.generatedAt;
        assert.deepEqual(schema, expected);
    `,
    ]);
    fs.writeFileSync(path.join(consumer, 'esm/package.json'), JSON.stringify({ type: 'module' }));
    run(process.execPath, [
        '--input-type=module',
        '-e',
        `
        import assert from 'assert';
        import schema from './esm/relational-schema.js';
        import fs from 'fs';
        const expected = JSON.parse(fs.readFileSync('./first/relational-schema.json', 'utf8'));
        delete expected.generatedAt;
        delete schema.generatedAt;
        assert.deepStrictEqual(schema, expected);
    `,
    ]);
    fs.writeFileSync(
        path.join(consumer, 'consumer.ts'),
        `
        import { generate } from 'relational-schema';
        import schema from './typescript/relational-schema';
        const generator: typeof generate = generate;
        void generator;
        void schema.tables;
    `,
    );
    run(process.execPath, [
        path.join(consumer, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--target',
        'es2019',
        '--module',
        'commonjs',
        'consumer.ts',
    ]);
    const invalid = spawnSync(cli, ['introspect', '--client', 'invalid'], {
        cwd: consumer,
        encoding: 'utf8',
        timeout: 10000,
    });
    assert.ifError(invalid.error);
    assert.equal(invalid.status, 1, 'Invalid CLI configuration must fail');
    const unavailable = spawnSync(cli, ['introspect', '--port', '1'], {
        cwd: consumer,
        encoding: 'utf8',
        timeout: 10000,
    });
    assert.ifError(unavailable.error);
    assert.equal(unavailable.status, 1, 'An unavailable database must fail');
    console.log(`Installed-package smoke test passed (${client})`);
} finally {
    fs.rmSync(consumer, { recursive: true, force: true });
}
