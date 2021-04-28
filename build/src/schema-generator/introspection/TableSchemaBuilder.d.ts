import { Introspection } from './IntrospectionTypes';
import { TableSchemaDefinition } from '../../types';
/**
 * Build a js schema that describes the table and relationships
 */
export declare class TableSchemaBuilder {
    private readonly tableName;
    private introspection;
    constructor(tableName: string, introspection: Introspection);
    /**
     * Format a forward relation (N - 1)
     * Alias the name on relations to ensure unique keys even when the same table is joined multiple times
     * Also remove plural on related tables to match cardinality i.e. posts -> users would be 'post.author'
     * Also handle any conflicts for columns:related-tables with the same name.
     * @param relation
     * @param columns
     * @param uniqueKeys
     */
    private formatForwardRelation;
    /**
     * Format a backwards relation (1 - N or 1 - 1) (other table holds to key)
     * Alias the name on relations in the case that the table is joined from another table multiple times
     * Normal case:  posts -> users would be 'user.posts'
     * Special case:  posts.author -> users, posts.co_author -> users would be 'user.author_posts' 'user.co_author_posts'
     * Also add plural on joins to match cardinality i.e. users => posts would be 'user.posts'
     * @param relation
     * @param columns
     * @param relations, other relations
     */
    private formatBackwardRelationship;
    /**
     * Get a column to use for soft deletes if it exists
     * @param columns
     */
    private static getSoftDeleteColumn;
    /**
     * Get the schema definition for a table
     */
    buildTableDefinition(): Promise<TableSchemaDefinition>;
}
