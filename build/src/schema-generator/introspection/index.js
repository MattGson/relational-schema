"use strict";
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
exports.introspectSchema = void 0;
const knex_1 = __importDefault(require("knex"));
const MySQLIntrospection_1 = require("./MySQLIntrospection");
const TableSchemaBuilder_1 = require("./TableSchemaBuilder");
const PostgresIntrospection_1 = require("./PostgresIntrospection");
/**
 * Build schema from database connection
 * @param params
 */
exports.introspectSchema = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { conn } = params;
    console.log(`Introspecting schema: ${conn.connection.database}`);
    const knex = knex_1.default(conn);
    let DB;
    if (conn.client === 'mysql') {
        DB = new MySQLIntrospection_1.MySQLIntrospection(knex, conn.connection.database);
    }
    else {
        DB = new PostgresIntrospection_1.PostgresIntrospection(knex);
    }
    const schema = {
        database: conn.connection.database,
        schema: (_a = conn.connection.schema) !== null && _a !== void 0 ? _a : conn.connection.database,
        generatedAt: new Date(),
        tables: {},
    };
    const tables = yield DB.getSchemaTables();
    for (const table of tables) {
        schema.tables[table] = yield new TableSchemaBuilder_1.TableSchemaBuilder(table, DB).buildTableDefinition();
    }
    yield knex.destroy();
    return schema;
});
//# sourceMappingURL=index.js.map