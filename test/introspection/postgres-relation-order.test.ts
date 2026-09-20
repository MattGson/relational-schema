import { Knex, knex } from 'knex';
import { PostgresIntrospection } from 'src/introspection';
import { LogLevel } from 'src/types';

class QueryCapture extends PostgresIntrospection {
    readonly queries: string[] = [];

    protected async query<T extends Record<string, unknown>>(builder: Knex.QueryBuilder<T>): Promise<T> {
        this.queries.push(builder.toSQL().sql);
        return ([] as unknown) as T;
    }
}

describe('PostgreSQL relation query ordering', () => {
    const db = knex({ client: 'pg' });

    afterAll(async () => db.destroy());

    it.each(['getForwardRelations', 'getBackwardRelations'] as const)(
        '%s orders by constraint and foreign-key ordinal position',
        async (method) => {
            const introspection = new QueryCapture({ knex: db, logLevel: LogLevel.info });
            await introspection[method](['children']);

            expect(introspection.queries[0]).toMatch(
                /order by "c"\."constraint_name" asc, "x"\."ordinal_position" asc$/,
            );
        },
    );
});
