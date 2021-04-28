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
exports.MySQLIntrospection = void 0;
const types_1 = require("../../types");
const lodash_1 = __importDefault(require("lodash"));
class MySQLIntrospection {
    constructor(knex, schemaName) {
        this.knex = knex;
        if (schemaName)
            this.schemaName = schemaName;
        else
            this.schemaName = 'public';
    }
    /**
     * Map the MySQL schema to a typescript schema
     * @param tableName
     * @param columnName
     * @param dbType
     * @param customTypes - enum and set types
     */
    getTsTypeForColumn(tableName, columnName, dbType, customTypes) {
        switch (dbType) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'tinytext':
            case 'mediumtext':
            case 'longtext':
            case 'time':
            case 'geometry':
                // case 'set':
                // case 'enum': - these are handled in the default case
                return types_1.Comparable.string;
            case 'integer':
            case 'int':
            case 'smallint':
            case 'mediumint':
            case 'bigint':
            case 'double':
            case 'decimal':
            case 'numeric':
            case 'float':
            case 'year':
                return types_1.Comparable.number;
            case 'tinyint':
                return types_1.Comparable.boolean;
            case 'json':
                return types_1.NonComparable.Object;
            case 'date':
            case 'datetime':
            case 'timestamp':
                return types_1.Comparable.Date;
            case 'tinyblob':
            case 'mediumblob':
            case 'longblob':
            case 'blob':
            case 'binary':
            case 'varbinary':
            case 'bit':
                return types_1.NonComparable.Buffer;
            default: {
                const possibleEnum = MySQLIntrospection.getEnumName(tableName, columnName);
                if (customTypes[possibleEnum]) {
                    return possibleEnum;
                }
                else {
                    console.log(`Type [${columnName}] has been mapped to [any] because no specific type has been found.`);
                    return types_1.NonComparable.any;
                }
            }
        }
    }
    /**
     * Get possible values from enum
     * @param mysqlEnum
     */
    static parseMysqlEnumeration(mysqlEnum) {
        return mysqlEnum.replace(/(^(enum|set)\('|'\)$)/gi, '').split(`','`);
    }
    /**
     * Get name of enum
     * @param tableName
     * @param columnName
     */
    static getEnumName(tableName, columnName) {
        return `${tableName}_${columnName}`;
    }
    /**
     * Get the enum types for a table
     * Note: - SET type is supported as well as ENUM but should rarely be used
     */
    getEnumTypesForTable(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            let enums = {};
            const rawEnumRecords = yield this.knex('information_schema.columns')
                .select('table_name', 'column_name', 'column_type')
                .whereIn('data_type', ['enum', 'set'])
                .where({ table_schema: this.schemaName, table_name: tableName });
            rawEnumRecords.forEach((enumItem) => {
                const enumName = MySQLIntrospection.getEnumName(enumItem.table_name, enumItem.column_name);
                enums[enumName] = {
                    columnName: enumItem.column_name,
                    enumName,
                    values: MySQLIntrospection.parseMysqlEnumeration(enumItem.column_type).sort(),
                };
            });
            return enums;
        });
    }
    /**
     * Get the type definition for a table
     * @param tableName
     * @param enumTypes
     */
    getTableTypes(tableName, enumTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            let tableDefinition = {};
            const tableColumns = yield this.knex('information_schema.columns')
                .select('column_name', 'data_type', 'is_nullable', 'column_default', 'extra')
                .where({ table_name: tableName, table_schema: this.schemaName });
            tableColumns.map((schemaItem) => {
                const columnName = schemaItem.column_name;
                const dbType = schemaItem.data_type;
                const extra = schemaItem.extra === '' ? null : schemaItem.extra;
                tableDefinition[columnName] = {
                    dbType,
                    columnDefault: schemaItem.column_default || extra,
                    nullable: schemaItem.is_nullable === 'YES',
                    columnName,
                    tsType: this.getTsTypeForColumn(tableName, columnName, dbType, enumTypes),
                };
            });
            return tableDefinition;
        });
    }
    getTableConstraints(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.knex('information_schema.key_column_usage as key_usage')
                .select('key_usage.table_name', 'key_usage.column_name', 'key_usage.constraint_name', 'constraints.constraint_type')
                .distinct()
                .leftJoin('information_schema.table_constraints as constraints', function () {
                this.on('key_usage.constraint_name', '=', 'constraints.constraint_name');
                this.andOn('key_usage.constraint_schema', '=', 'constraints.constraint_schema');
                this.andOn('key_usage.table_name', '=', 'constraints.table_name');
            })
                .where({ 'key_usage.table_name': tableName, 'key_usage.table_schema': this.schemaName });
            // group by constraint name
            const columnMap = lodash_1.default.groupBy(rows, (k) => k.constraint_name);
            const constraintMap = lodash_1.default.keyBy(rows, (k) => k.constraint_name);
            const constraintDefinitions = [];
            Object.values(constraintMap).forEach((constraint) => {
                const { constraint_type, constraint_name } = constraint;
                const columns = columnMap[constraint_name];
                constraintDefinitions.push({
                    constraintName: constraint_name,
                    constraintType: constraint_type,
                    columnNames: columns.map((c) => c.column_name).sort(),
                });
            });
            return constraintDefinitions;
        });
    }
    /**
     * Get all relations where the given table holds the constraint (N - 1 or 1 - 1) i.e. Posts.user_id -> Users.user_id
     * @param tableName
     */
    getForwardRelations(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.knex('information_schema.key_column_usage')
                .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
                .where({ table_name: tableName, table_schema: this.schemaName });
            // group by constraint name to capture multiple relations to same table
            let relations = {};
            rows.forEach((row) => {
                const { column_name, referenced_table_name, referenced_column_name, constraint_name } = row;
                if (referenced_table_name == null || referenced_column_name == null)
                    return;
                if (!relations[constraint_name])
                    relations[constraint_name] = {
                        toTable: referenced_table_name,
                        alias: referenced_table_name,
                        joins: [],
                        type: 'belongsTo',
                    };
                relations[constraint_name].joins.push({
                    fromColumn: column_name,
                    toColumn: referenced_column_name,
                });
            });
            return Object.values(relations);
        });
    }
    /**
     * Get all relations where the given table does not hold the constraint (1 - N or 1 - 1) i.e. Users.user_id <- Posts.author_id
     * @param tableName
     */
    getBackwardRelations(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.knex('information_schema.key_column_usage')
                .select('table_name', 'column_name', 'constraint_name', 'referenced_table_name', 'referenced_column_name')
                .where({ referenced_table_name: tableName, table_schema: this.schemaName });
            // group by constraint name to capture multiple relations to same table
            let relations = {};
            rows.forEach((row) => {
                const { column_name, table_name, referenced_column_name, constraint_name } = row;
                if (table_name == null || column_name == null)
                    return;
                if (!relations[constraint_name])
                    relations[constraint_name] = {
                        toTable: table_name,
                        alias: table_name,
                        joins: [],
                        type: 'hasMany',
                    };
                relations[constraint_name].joins.push({
                    fromColumn: referenced_column_name,
                    toColumn: column_name,
                });
            });
            return Object.values(relations);
        });
    }
    /**
     * Get a list of all table names in schema
     */
    getSchemaTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const schemaTables = yield this.knex('information_schema.columns')
                .select('table_name')
                .where({ table_schema: this.schemaName })
                .groupBy('table_name');
            return schemaTables.map((schemaItem) => schemaItem.table_name);
        });
    }
}
exports.MySQLIntrospection = MySQLIntrospection;
//# sourceMappingURL=MySQLIntrospection.js.map