import {Format, generate} from '../../src/schema-generator';
import {buildDBSchemas, closeConnection} from './build-test-db';
import path from 'path';

const out = path.join(__dirname, '../Gen');

// build a db and relational-schema client for testing
buildDBSchemas()
    .then((connection) => generate(connection, out, Format.json))
    .then(() => closeConnection())
    .catch((e) => console.log(e));
