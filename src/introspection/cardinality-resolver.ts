import { ConstraintDefinition, RelationDefinition } from '../types';
import _ from 'lodash';

export class CardinalityResolver {
    /**
     * Returns true if the relation is one-to-one
     * Checks if there is a unique constraint on the forwards side of the relation
     * @param tableOne
     * @param tableTwo
     * @returns
     */
    public static isOneToOneRelation(table: {
        forwardRelation: RelationDefinition;
        keys: ConstraintDefinition[];
    }): boolean {
        if (table.forwardRelation.type !== 'belongsTo') throw new Error('Must give the forward relation');

        // check if there is a unique constraint on the join. If so, it is 1 - 1;
        const joinColumns = table.forwardRelation.joins.map((j) => j.fromColumn).sort();
        const uniqueKeys = CardinalityResolver.getUniqueKeyCombinations(table.keys);

        for (const key of uniqueKeys) {
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
