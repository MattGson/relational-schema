"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonComparable = exports.Comparable = void 0;
var Comparable;
(function (Comparable) {
    Comparable["string"] = "string";
    Comparable["number"] = "number";
    Comparable["bigint"] = "bigint";
    Comparable["boolean"] = "boolean";
    Comparable["Date"] = "Date";
})(Comparable = exports.Comparable || (exports.Comparable = {}));
var NonComparable;
(function (NonComparable) {
    NonComparable["Object"] = "Object";
    NonComparable["Array"] = "Array";
    NonComparable["ArrayStr"] = "Array<string>";
    NonComparable["ArrayBool"] = "Array<boolean>";
    NonComparable["ArrayNum"] = "Array<number>";
    NonComparable["ArrayObj"] = "Array<Object>";
    NonComparable["ArrayDate"] = "Array<Date>";
    NonComparable["Buffer"] = "Buffer";
    NonComparable["any"] = "any";
})(NonComparable = exports.NonComparable || (exports.NonComparable = {}));
//# sourceMappingURL=SchemaTypes.js.map