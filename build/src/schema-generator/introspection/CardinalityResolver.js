"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardinalityResolver = void 0;
const lodash_1 = __importDefault(require("lodash"));
class CardinalityResolver {
    /**
     * Check if a given relation is one-to-one (has a unique constraint)
     * @param joinColumns, columns in the join
     * @param uniqueKeys
     */
    static isOneToOneRelation(joinColumns, uniqueKeys) {
        // check if there is a unique constraint on the join. If so, it is 1 - 1;
        // TODO:- what if unique constraint is only on part of the join (would relation be over constrained?)
        for (let key of uniqueKeys) {
            if (lodash_1.default.isEqual(joinColumns, key))
                return true;
        }
        return false;
    }
    /**
     * Get the primary key from a tables keys
     * @param constraints in the table
     */
    static primaryKey(constraints) {
        const pks = constraints.filter((k) => k.constraintType === 'PRIMARY KEY');
        return pks[0] !== undefined ? pks[0] : undefined;
    }
    /**
     * Get the constraints that are unique in a table
     * @param constraints in the table
     */
    static uniqueConstraints(constraints) {
        return constraints.filter((k) => k.constraintType === 'UNIQUE');
    }
    /**
     * Returns a minimal list of key column combinations that are guaranteed to uniquely define a single row - PK and unique constraints
     * @param constraints
     */
    static getUniqueKeyCombinations(constraints) {
        var _a;
        const unique = this.uniqueConstraints(constraints).map((con) => con.columnNames.sort());
        const primary = (_a = this.primaryKey(constraints)) === null || _a === void 0 ? void 0 : _a.columnNames.sort();
        if (primary)
            unique.push(primary);
        return unique;
    }
    /**
     * Build permutations/combinations of two constraints
     * @param constraintA
     * @param constraintB
     */
    static buildPermutations(constraintA, constraintB) {
        let combos = [];
        if (constraintA.columnNames.length === 1) {
            const [a] = constraintA.columnNames;
            combos.push(new Set([a]));
            for (const column of constraintB.columnNames) {
                combos.push(new Set([a, column]));
            }
        }
        else if (constraintA.columnNames.length === 2) {
            const [a, b] = constraintA.columnNames;
            combos.push(new Set([a]), new Set([b]));
            for (const column of constraintB.columnNames) {
                combos.push(new Set([a, column]), new Set([b, column]));
            }
        }
        else if (constraintA.columnNames.length > 2) {
            // limited to 3 part PK for reasonable efficiency)
            const [a, b, c] = constraintA.columnNames;
            combos.push(new Set([a]), new Set([b]), new Set([c]), new Set([a, b]), new Set([a, c]), new Set([b, c]));
            for (const column of constraintB.columnNames) {
                combos.push(new Set([a, column]), new Set([b, column]), new Set([c, column]));
            }
        }
        return combos;
    }
    /**
     * Get all non-unique key combinations
     * @param constraints
     */
    static getNonUniqueKeyCombinations(constraints) {
        // permute key column combinations up to length 3.
        // use Set comparison to check if in unique constraints.
        const uniqueCombos = this.getUniqueKeyCombinations(constraints).map((combo) => new Set(combo));
        // build key permutations
        const permutations = [];
        for (const constraintA of constraints) {
            for (const constraintB of constraints) {
                if (constraintB.constraintName === constraintA.constraintName)
                    continue;
                permutations.push(...this.buildPermutations(constraintA, constraintB));
            }
        }
        const isSubset = (set, subset) => {
            return new Set([...set, ...subset]).size === set.size;
        };
        // filter out duplicates and unique keys
        let nonUnique = [];
        for (const perm of permutations) {
            let unique = false;
            for (const uniqueCombo of uniqueCombos) {
                if (isSubset(perm, uniqueCombo))
                    unique = true;
            }
            if (!unique) {
                nonUnique = lodash_1.default.unionWith(nonUnique, [perm], lodash_1.default.isEqual);
            }
        }
        return nonUnique.map((perm) => Array.from(perm).sort());
    }
}
exports.CardinalityResolver = CardinalityResolver;
//# sourceMappingURL=CardinalityResolver.js.map