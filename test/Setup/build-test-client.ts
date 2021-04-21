import { generate } from '../../src/schema-generator';
import { buildDBSchemas, closeConnection } from './build-test-db';
import path from 'path';

const out = path.join(__dirname, '../Gen');

// build a db and gybson client for testing
buildDBSchemas()
    .then((connection) => generate(connection, out))
    .then(() => closeConnection())
    .catch((e) => console.log(e));
