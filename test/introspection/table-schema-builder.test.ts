import 'jest-extended';
import { TableSchemaBuilder } from 'src/introspection';
import { Introspection } from 'src/introspection/introspection';
import { ConstraintDefinition, EnumDefinitions, RelationDefinition, TableColumnsDefinition, TableMap } from 'src/types';
import { closeConnection, DB, getIntrospection, itif, knex, openConnection, databaseName } from 'test/helpers';

describe('TableSchemaBuilder', () => {
    let tables;
    let enums: TableMap<EnumDefinitions>;
    let definitions: TableMap<TableColumnsDefinition>;
    let constraints: TableMap<ConstraintDefinition[]>;
    let forward: TableMap<RelationDefinition[]>;
    let backwards: TableMap<RelationDefinition[]>;
    let intro: Introspection;
    beforeAll(
        async (): Promise<void> => {
            await openConnection();
        },
    );
    afterAll(async () => {
        await closeConnection();
    });
    beforeEach(
        async (): Promise<void> => {
            intro = getIntrospection(knex(), databaseName);
            tables = await intro.getSchemaTables();
            enums = await intro.getEnumTypesForTables(tables);
            definitions = await intro.getTableTypes(tables, enums);
            constraints = await intro.getTableConstraints(tables);
            forward = await intro.getForwardRelations(tables);
            backwards = await intro.getBackwardRelations(tables);
        },
    );
    describe('buildTableDefinition', () => {
        describe('key constraints', () => {
            describe('Primary key', () => {
                it('Gets the primary key for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.primaryKey).toEqual(
                        expect.objectContaining({
                            columnNames: ['user_id'],
                        }),
                    );
                });
                it('Gets a compound primary key for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.primaryKey).toEqual(
                        expect.objectContaining({
                            columnNames: ['team_id', 'user_id'],
                        }),
                    );
                });
            });
            describe('Unique keys', () => {
                it('Gets unique key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['email'],
                            constraintType: 'UNIQUE',
                        }),
                        expect.objectContaining({
                            columnNames: ['token'],
                            constraintType: 'UNIQUE',
                        }),
                    ]);
                });

                it('Gets compound unique key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members_positions',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();
                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['manager', 'position'],
                            constraintType: 'UNIQUE',
                        }),
                    ]);
                });
            });
            describe('Foreign keys', () => {
                it('Gets foreign key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['team_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                        expect.objectContaining({
                            columnNames: ['user_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                        expect.objectContaining({
                            columnNames: ['member_post_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                    ]);
                });
                it('Gets compound foreign key constraints for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members_positions',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.keys).toIncludeAllMembers([
                        expect.objectContaining({
                            columnNames: ['team_id', 'user_id'],
                            constraintType: 'FOREIGN KEY',
                        }),
                    ]);
                });
            });
        });

        describe('key combinations', () => {
            describe('uniqueKeyCombinations', () => {
                it('Gets minimal key column combinations that uniquely define a row for a table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.uniqueKeyCombinations).toIncludeAllMembers([['email'], ['token'], ['user_id']]);

                    // with compound keys
                    const schemaBuilder2 = new TableSchemaBuilder(
                        'team_members_positions',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema2 = await schemaBuilder2.buildTableDefinition();

                    expect(schema2.uniqueKeyCombinations).toIncludeAllMembers([
                        ['manager', 'position'],
                        ['team_id', 'user_id'],
                    ]);
                });
            });
        });
        describe('Columns', () => {
            itif(DB() === 'mysql')(
                'Gets the columns for a table',
                async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    // just smoke test as the introspection takes care of this
                    expect(schema.columns).toEqual(
                        expect.objectContaining({
                            user_id: {
                                dbType: 'int',
                                nullable: false,
                                tsType: 'number',
                                columnName: 'user_id',
                                columnDefault: 'auto_increment',
                            },
                        }),
                    );
                },
            );
            itif(DB() === 'pg')(
                'Gets the columns for a table',
                async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    // just smoke test as the introspection takes care of this
                    expect(schema.columns).toEqual(
                        expect.objectContaining({
                            user_id: {
                                dbType: 'int4',
                                nullable: false,
                                tsType: 'number',
                                columnName: 'user_id',
                                columnDefault: `nextval('users_user_id_seq'::regclass)`,
                            },
                        }),
                    );
                },
            );
        });
        describe('Enums', () => {
            itif(DB() == 'mysql')(
                'Gets the enums for a table',
                async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    // just smoke test as the introspection takes care of this
                    expect(schema.enums).toEqual(
                        expect.objectContaining({
                            users_permissions: {
                                columnName: 'permissions',
                                enumName: 'users_permissions',
                                values: ['ADMIN', 'USER'],
                            },
                            users_subscription_level: {
                                columnName: 'subscription_level',
                                enumName: 'users_subscription_level',
                                values: ['BRONZE', 'GOLD', 'SILVER'],
                            },
                        }),
                    );
                },
            );
            itif(DB() == 'pg')(
                'Gets the enums for a table',
                async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    // just smoke test as the introspection takes care of this
                    expect(schema.enums).toEqual(
                        expect.objectContaining({
                            permissions: {
                                id: expect.any(String),
                                enumName: 'permissions',
                                values: ['ADMIN', 'USER'],
                            },
                        }),
                    );
                },
            );
        });
        describe('Relations', () => {
            describe('forward relations', () => {
                it('Forwards relations on a unique key are "hasOne"', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members_positions',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'team_members',
                            type: 'hasOne',
                        }),
                    ]);
                });
                it('Forwards relations on a non-unique key are "belongsTo"', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'posts',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'users',
                            type: 'belongsTo',
                        }),
                    ]);
                });
                it('Forwards relations are aliased by column name with `id` stripped', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'users',
                            alias: 'best_friend',
                            joins: expect.arrayContaining([
                                {
                                    fromColumn: 'best_friend_id',
                                    toColumn: 'user_id',
                                },
                            ]),
                            type: 'belongsTo',
                        }),
                    ]);
                });
                it('Compound forwards relations are aliased with the joined table name', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members_positions',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'team_members',
                            alias: 'team_member',
                            joins: expect.arrayContaining([
                                { fromColumn: 'user_id', toColumn: 'user_id' },
                                { fromColumn: 'team_id', toColumn: 'team_id' },
                            ]),
                            type: 'hasOne',
                        }),
                    ]);
                });
                it('Forwards relations have trailing "s" stripped', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members_positions',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'team_members',
                            alias: 'team_member',
                            joins: expect.arrayContaining([
                                { fromColumn: 'user_id', toColumn: 'user_id' },
                                { fromColumn: 'team_id', toColumn: 'team_id' },
                            ]),
                            type: 'hasOne',
                        }),
                    ]);
                });
            });
            describe('Backwards relations', () => {
                it('Backwards relations on a unique key are "hasOne"', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'team_members',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'team_members_positions',
                            type: 'hasOne',
                        }),
                    ]);
                });
                it('Backwards relations on a non-unique key are "hasMany"', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'posts',
                            type: 'hasMany',
                        }),
                    ]);
                });
                it('Backwards relations are aliased as the table name by default', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'posts',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'team_members',
                            alias: 'team_members',
                            joins: [{ toColumn: 'member_post_id', fromColumn: 'post_id' }],
                            type: 'hasMany',
                        }),
                    ]);
                });
                it('Backwards relations of type hasMany are aliased with a trailing "s"', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'posts',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'team_members',
                            alias: 'team_members',
                            joins: [{ toColumn: 'member_post_id', fromColumn: 'post_id' }],
                            type: 'hasMany',
                        }),
                    ]);
                });
                it('Backwards relations are aliased with columnName_tableName if there are multiple relations of the table', async (): Promise<void> => {
                    const schemaBuilder = new TableSchemaBuilder(
                        'users',
                        enums,
                        definitions,
                        constraints,
                        forward,
                        backwards,
                    );
                    const schema = await schemaBuilder.buildTableDefinition();

                    expect(schema.relations).toIncludeAllMembers([
                        expect.objectContaining({
                            toTable: 'posts',
                            alias: 'author_posts',
                            joins: [
                                {
                                    fromColumn: 'user_id',
                                    toColumn: 'author_id',
                                },
                            ],
                            type: 'hasMany',
                        }),
                        expect.objectContaining({
                            toTable: 'posts',
                            alias: 'co_author_posts',
                            joins: [
                                {
                                    fromColumn: 'user_id',
                                    toColumn: 'co_author',
                                },
                            ],
                            type: 'hasMany',
                        }),
                        expect.objectContaining({
                            toTable: 'team_members',
                            alias: 'team_members',
                            joins: [{ fromColumn: 'user_id', toColumn: 'user_id' }],
                            type: 'hasMany',
                        }),
                    ]);
                });
            });
            it('Relation alias that conflicts with column name is aliased with _', async (): Promise<void> => {
                const schemaBuilder = new TableSchemaBuilder(
                    'posts',
                    enums,
                    definitions,
                    constraints,
                    forward,
                    backwards,
                );
                const schema = await schemaBuilder.buildTableDefinition();

                expect(schema.relations).toIncludeAllMembers([
                    expect.objectContaining({
                        toTable: 'users',
                        alias: 'author_',
                        joins: [
                            {
                                fromColumn: 'author_id',
                                toColumn: 'user_id',
                            },
                        ],
                    }),
                ]);

                const schemaBuilder2 = new TableSchemaBuilder(
                    'posts',
                    enums,
                    definitions,
                    constraints,
                    forward,
                    backwards,
                );
                const schema2 = await schemaBuilder2.buildTableDefinition();

                expect(schema2.relations).toIncludeAllMembers([
                    expect.objectContaining({
                        toTable: 'users',
                        alias: 'co_author_',
                        joins: [
                            {
                                fromColumn: 'co_author',
                                toColumn: 'user_id',
                            },
                        ],
                    }),
                ]);
            });
        });
    });
});
