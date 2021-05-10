import {
    ColumnDefinition,
    Comparable,
    ConstraintDefinition,
    EnumDefinitions,
    RelationDefinition,
    TableColumnsDefinition,
    TableMap,
    TableSchemaDefinition,
} from '../types';
import { CardinalityResolver } from './cardinality-resolver';

/**
 * Build a js schema that describes the table and relationships
 */
export class TableSchemaBuilder {
    public constructor(
        private tableName: string,
        private enums: TableMap<EnumDefinitions>,
        private tableDefinitions: TableMap<TableColumnsDefinition>,
        private constraints: TableMap<ConstraintDefinition[]>,
        private forwardRelations: TableMap<RelationDefinition[]>,
        private backwardRelations: TableMap<RelationDefinition[]>,
    ) {}

    /**
     * Format a forward relation (N - 1)
     * Alias the name on relations to ensure unique keys even when the same table is joined multiple times
     * Also remove plural on related tables to match cardinality i.e. posts -> users would be 'post.author'
     * Also handle any conflicts for columns:related-tables with the same name.
     * @param relation
     * @param columns
     * @param uniqueRelations - one to one relations
     */
    private formatForwardRelation(
        relation: RelationDefinition,
        columns: TableColumnsDefinition,
        uniqueRelations: RelationDefinition[],
    ): RelationDefinition {
        // multiple columns so use the table-name instead
        if (relation.joins.length > 1) {
            relation.alias = relation.toTable.replace(/s+$/, '');
        }
        // single column so just remove suffix etc
        else {
            relation.alias = relation.joins[0].fromColumn.replace('_id', '');
        }
        if (columns[relation.alias]) relation.alias += '_'; // handle any naming conflicts

        // check if  it is 1 - 1;
        if (uniqueRelations.find((r) => r.constraintName === relation.constraintName)) relation.type = 'hasOne';

        return relation;
    }

    /**
     * Format a backwards relation (1 - N or 1 - 1) (other table holds to key)
     * Alias the name on relations in the case that the table is joined from another table multiple times
     * Normal case:  posts -> users would be 'user.posts'
     * Special case:  posts.author -> users, posts.co_author -> users would be 'user.author_posts' 'user.co_author_posts'
     * Also add plural on joins to match cardinality i.e. users => posts would be 'user.posts'
     * @param relation
     * @param columns
     * @param relations, other relations
     * @param uniqueRelations, unique relations for the table (one-to-one)
     */
    private formatBackwardRelationship(
        relation: RelationDefinition,
        columns: TableColumnsDefinition,
        tableRelations: RelationDefinition[],
        uniqueRelations: RelationDefinition[],
    ): RelationDefinition {
        // check if table name will conflict with other relations on the same table
        let relationCount = 0;
        for (const other_relation of tableRelations) {
            if (other_relation.toTable === relation.toTable) relationCount += 1;
        }

        if (relationCount > 1) {
            // alias with the foreign key name and the table
            relation.alias = `${relation.joins[0].toColumn.replace('_id', '')}_${relation.toTable}`;
        }

        // check if it is (1 - 1);
        if (uniqueRelations.find((r) => r.constraintName === relation.constraintName)) {
            relation.type = 'hasOne';
            relation.alias = relation.alias.replace(/s+$/, ''); // remove trailing s
        }

        // add trailing s for (1 - N)
        if (relation.type === 'hasMany' && relation.alias[relation.alias.length - 1] !== 's') {
            relation.alias += `s`;
        }
        // handle any column conflicts
        if (columns[relation.alias]) relation.alias += '_';

        return relation;
    }

    /**
     * Get a column to use for soft deletes if it exists
     * @param columns
     */
    private static getSoftDeleteColumn(columns: TableColumnsDefinition): ColumnDefinition | null {
        let candidate: ColumnDefinition | undefined;
        for (const column of Object.values(columns)) {
            if (['deleted', 'deleted_at', 'deletedAt', 'soft_deleted', 'softDeleted'].includes(column.columnName)) {
                candidate = column;
            }
        }
        if (candidate?.tsType === Comparable.boolean || candidate?.tsType === Comparable.Date) return candidate;
        return null;
    }

    /**
     * Get the unique (one-to-one) relations for the table
     * @param tableForwardRelations
     * @param tableBackwardRelations
     * @returns
     */
    private getTableOneToOneRelationships(
        tableForwardRelations: RelationDefinition[],
        tableBackwardRelations: RelationDefinition[],
    ): RelationDefinition[] {
        const uniqueRelations: RelationDefinition[] = [];

        tableForwardRelations.forEach((forwardRelation) => {
            const keys = this.constraints[this.tableName];
            if (CardinalityResolver.isOneToOneRelation({ forwardRelation, keys })) {
                uniqueRelations.push(forwardRelation);
            }
        });

        tableBackwardRelations.forEach((backwardRelation) => {
            // get the other (forward) side of the relation to check cardinalityu
            const keys = this.constraints[backwardRelation.toTable];
            const [forwardRelation] = this.forwardRelations[backwardRelation.toTable].filter(
                (r) => r.toTable === this.tableName,
            );

            if (CardinalityResolver.isOneToOneRelation({ forwardRelation, keys })) {
                uniqueRelations.push(backwardRelation);
            }
        });
        return uniqueRelations;
    }

    /**
     * Get the schema definition for a table
     */
    public buildTableDefinition(): TableSchemaDefinition {
        const tableConstraints = this.constraints[this.tableName];
        const tableEnums = this.enums[this.tableName];

        const tableColumns = this.tableDefinitions[this.tableName];
        const tableForwardRelations = this.forwardRelations[this.tableName] ?? [];
        const tableBackwardRelations = this.backwardRelations[this.tableName] ?? [];

        const tableUniqueRelations = this.getTableOneToOneRelationships(tableForwardRelations, tableBackwardRelations);

        const softDelete = TableSchemaBuilder.getSoftDeleteColumn(tableColumns);

        // constraints
        const uniqueKeyCombinations = CardinalityResolver.getUniqueKeyCombinations(tableConstraints);

        // relations
        const forwardRels = tableForwardRelations.map((r) =>
            this.formatForwardRelation(r, tableColumns, tableUniqueRelations),
        );

        const backwardRels = tableBackwardRelations.map((r) =>
            this.formatBackwardRelationship(r, tableColumns, tableBackwardRelations, tableUniqueRelations),
        );

        return {
            primaryKey: CardinalityResolver.primaryKey(tableConstraints),
            keys: tableConstraints,
            uniqueKeyCombinations,
            relations: [...forwardRels, ...backwardRels],
            columns: tableColumns,
            softDelete,
            enums: tableEnums,
        };
    }
}
