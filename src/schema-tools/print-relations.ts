import { TableSchemaDefinition } from 'src/types';
import { join } from 'path';
import { logger } from '../lib/logger';

/**
 * Print the relations tree for a table
 * @param options
 */
export function printRelationTree(options: {
    root: string;
    schemaPath: string;
    maxDepth: number;
    showBackwardRelations: boolean;
}): void {
    const { root, schemaPath, maxDepth, showBackwardRelations } = options;

    const schemaFullPath = join(process.cwd(), schemaPath);

    logger.debug('Loading schema from ', schemaFullPath);

    const schema = require(schemaFullPath);

    const REQUIRE_NULLABLE_RELATIONS = true;

    function printType(name: string, type: TableSchemaDefinition, depth: number, seen: Set<string>) {
        if (depth > maxDepth) return;

        depth += 1;
        let buffer = '|';
        for (let i = 0; i < depth; i++) {
            buffer += '  ';
        }

        console.log(buffer, '|');
        console.log(buffer, ' -->', name);

        for (const relation of type.relations) {
            if (relation.type === 'manyToMany') continue; // ignore many-to-many

            const relationName = relation.toTable;
            if (relation.type === 'hasMany' && !showBackwardRelations) continue; // only outward keys for now
            if (seen.has(relationName)) continue; // break loop

            if (!REQUIRE_NULLABLE_RELATIONS) {
                const col = relation.joins[0].fromColumn;
                if (type.columns[col].nullable) {
                    continue;
                }
            }

            seen.add(relationName);
            const newSeen = new Set(Array.from(seen));
            printType(relationName, schema.tables[relationName], depth, newSeen);
        }
    }

    function main() {
        const starting_relation = root;

        const structure = schema.tables[starting_relation];

        const depth = 0;
        const seen = new Set(starting_relation);
        printType(starting_relation, structure, depth, seen);
    }

    main();
}
