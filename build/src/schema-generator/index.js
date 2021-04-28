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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.Format = void 0;
const introspection_1 = require("./introspection");
const lib_1 = require("./lib");
// **************************
// generate schema
// **************************
var Format;
(function (Format) {
    Format[Format["json"] = 0] = "json";
    Format[Format["es6"] = 1] = "es6";
    Format[Format["typescript"] = 2] = "typescript";
    Format[Format["commonJS"] = 3] = "commonJS";
})(Format = exports.Format || (exports.Format = {}));
/**
 *
 * @param conn
 * @param outdir - write files here
 * @param format - output format
 */
function generate(conn, outdir, format) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Generating schema for db: ${conn.connection.database}`);
        const schema = yield introspection_1.introspectSchema({ conn });
        switch (format) {
            case Format.es6:
                yield lib_1.writeJSFile(`
                 export const schema = ${JSON.stringify(schema)}\`
            `, outdir, 'relational-schema');
                break;
            case Format.commonJS:
                yield lib_1.writeJSFile(`
                 module.exports = ${JSON.stringify(schema)}\`
            `, outdir, 'relational-schema');
                break;
            case Format.typescript:
                yield lib_1.writeTypescriptFile(`
                     export const schema = ${JSON.stringify(schema)}`, outdir, `relational-schema`);
                break;
            case Format.json:
                yield lib_1.writeJSONFile(schema, outdir, 'relational-schema');
        }
        console.log(`Generated for ${Object.keys(schema).length} tables in ${outdir}`);
    });
}
exports.generate = generate;
//# sourceMappingURL=index.js.map