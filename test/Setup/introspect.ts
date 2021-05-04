import { generate } from 'src/index';
import { Format, LogLevel } from 'src/types';
import { buildDBSchemas, closeConnection } from './build-test-db';
import path from 'path';

const outdir = path.join(__dirname, '../Gen');

// Warning - this executes immediately - do not import elsewhere
// build a db and relational-schema output for testing in every format
buildDBSchemas()
    .then((conn) => generate({ conn, outdir, format: Format.json, logLevel: LogLevel.info }))
    .then((conn) =>
        generate({
            conn,
            outdir,
            format: Format.typescript,
            logLevel: LogLevel.info,
            // test custom prettier
            prettierConfig: path.join(__dirname, '../../.prettierrc.js'),
        }),
    )
    .then((conn) => generate({ conn, outdir, format: Format.commonJS, logLevel: LogLevel.info }))
    .then((conn) => generate({ conn, outdir, format: Format.es6, logLevel: LogLevel.info }))
    .then(() => closeConnection())
    .catch((e) => {
        console.log(e);
        return closeConnection();
    });
