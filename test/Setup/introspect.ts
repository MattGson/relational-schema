import { Format, generate } from '../../src/schema-generator';
import { buildDBSchemas, closeConnection } from './build-test-db';
import path from 'path';

const outdir = path.join(__dirname, '../Gen');

// build a db and relational-schema output for testing in every format
buildDBSchemas()
    .then((conn) => generate({ conn, outdir, format: Format.json }))
    .then((conn) =>
        generate({
            conn,
            outdir,
            format: Format.typescript,
            // test custom prettier
            prettierConfig: path.join(__dirname, '../../.prettierrc.js'),
        }),
    )
    .then((conn) => generate({ conn, outdir, format: Format.commonJS }))
    .then((conn) => generate({ conn, outdir, format: Format.es6 }))
    .then(() => closeConnection())
    .catch((e) => console.log(e));
