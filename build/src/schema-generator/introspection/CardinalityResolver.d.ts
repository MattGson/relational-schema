import { ConstraintDefinition } from '../../types';
export declare class CardinalityResolver {
    /**
     * Check if a given relation is one-to-one (has a unique constraint)
     * @param joinColumns, columns in the join
     * @param uniqueKeys
     */
    static isOneToOneRelation(joinColumns: string[], uniqueKeys: string[][]): boolean;
    /**
     * Get the primary key from a tables keys
     * @param constraints in the table
     */
    static primaryKey(constraints: ConstraintDefinition[]): ConstraintDefinition | undefined;
    /**
     * Get the constraints that are unique in a table
     * @param constraints in the table
     */
    static uniqueConstraints(constraints: ConstraintDefinition[]): ConstraintDefinition[];
    /**
     * Returns a minimal list of key column combinations that are guaranteed to uniquely define a single row - PK and unique constraints
     * @param constraints
     */
    static getUniqueKeyCombinations(constraints: ConstraintDefinition[]): string[][];
    /**
     * Build permutations/combinations of two constraints
     * @param constraintA
     * @param constraintB
     */
    private static buildPermutations;
    /**
     * Get all non-unique key combinations
     * @param constraints
     */
    static getNonUniqueKeyCombinations(constraints: ConstraintDefinition[]): string[][];
}
