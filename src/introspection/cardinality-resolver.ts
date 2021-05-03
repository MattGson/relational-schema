import { ConstraintDefinition } from '../types';
import _ from 'lodash';

export class CardinalityResolver {
    /**
     * Check if a given relation is one-to-one (has a unique constraint)
     * @param joinColumns, columns in the join
     * @param uniqueKeys
     */
    public static isOneToOneRelation(joinColumns: string[], uniqueKeys: string[][]): boolean {
        // check if there is a unique constraint on the join. If so, it is 1 - 1;
        // TODO:- what if unique constraint is only on part of the join (would relation be over constrained?)
        for (let key of uniqueKeys) {
            if (_.isEqual(joinColumns, key)) return true;
        }
        return false;
    }

    /**
     * Get the primary key from a tables keys
     * @param constraints in the table
     */
    public static primaryKey(constraints: ConstraintDefinition[]): ConstraintDefinition | undefined {
        const pks = constraints.filter((k) => k.constraintType === 'PRIMARY KEY');
        return pks[0] !== undefined ? pks[0] : undefined;
    }

    /**
     * Get the constraints that are unique in a table
     * @param constraints in the table
     */
    public static uniqueConstraints(constraints: ConstraintDefinition[]): ConstraintDefinition[] {
        return constraints.filter((k) => k.constraintType === 'UNIQUE');
    }

    /**
     * Returns a minimal list of key column combinations that are guaranteed to uniquely define a single row - PK and unique constraints
     * @param constraints
     */
    public static getUniqueKeyCombinations(constraints: ConstraintDefinition[]): string[][] {
        const unique = this.uniqueConstraints(constraints).map((con) => con.columnNames.sort());
        const primary = this.primaryKey(constraints)?.columnNames.sort();
        if (primary) unique.push(primary);

        return unique;
    }
}
