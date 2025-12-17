import 'jest-extended';
import { PostgresIntrospection } from 'src/introspection';
import { Introspection } from 'src/introspection/introspection';
import { LogLevel } from 'src/types';
import { closeConnection, DB, describeif, knex, openConnection } from 'test/helpers';

describeif(DB() === 'pg')('PostgresIntrospection', () => {
    let intro: Introspection;

    beforeAll(
        async (): Promise<void> => {
            await openConnection();
            intro = new PostgresIntrospection({ knex: knex(), logLevel: LogLevel.info });
        },
    );
    afterAll(async () => {
        await closeConnection();
    });
    describe('getSchemaTables', () => {
        it('Loads all tables in a schema', async (): Promise<void> => {
            const tables = await intro.getSchemaTables();
            expect(tables).toHaveLength(5);
            expect(tables).toIncludeAllMembers(['users', 'teams', 'team_members', 'posts', 'team_members_positions']);
        });
    });
    describe('getEnumTypesForTable', () => {
        it('Loads all enums for a table', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTables(['users']);
            expect(Object.keys(enums['users'])).toHaveLength(2);
        });
        it('Returns the correct column and values for each enum', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTables(['users']);
            expect(Object.values(enums['users'])).toIncludeAllMembers([
                {
                    id: expect.any(String),
                    enumName: 'permissions',
                    values: ['ADMIN', 'USER'],
                },
                {
                    id: expect.any(String),
                    enumName: 'subscription_level',
                    values: ['BRONZE', 'GOLD', 'SILVER'],
                },
            ]);
        });
    });
    describe('getTableTypes', () => {
        it('Loads all columns for a table', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTables(['users']);
            const { users } = await intro.getTableTypes(['users', 'teams'], enums);
            expect(Object.keys(users)).toHaveLength(11);
        });
        it('Maps types correctly from db to typescript including enums', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTables(['users']);
            const { users: types } = await intro.getTableTypes(['users'], enums);

            expect(types['user_id']).toEqual({
                dbType: 'int4',
                nullable: false,
                generated: false,
                tsType: 'number',
                columnName: 'user_id',
                columnDefault: `nextval('users_user_id_seq'::regclass)`,
                characterMaximumLength: null,
            });
            expect(types['email']).toEqual({
                dbType: 'varchar',
                nullable: false,
                generated: false,
                tsType: 'string',
                columnName: 'email',
                columnDefault: null,
                characterMaximumLength: 400,
            });
            expect(types['first_name']).toEqual({
                dbType: 'varchar',
                nullable: true,
                generated: false,
                tsType: 'string',
                columnName: 'first_name',
                columnDefault: null,
                characterMaximumLength: 200,
            });
            expect(types['full_name']).toEqual({
                dbType: 'varchar',
                nullable: true,
                generated: true,
                tsType: 'string',
                columnName: 'full_name',
                columnDefault: null,
                characterMaximumLength: 401,
            });
            expect(types['permissions']).toEqual({
                dbType: 'permissions',
                nullable: true,
                generated: false,
                tsType: 'permissions',
                columnName: 'permissions',
                columnDefault: `'USER'::permissions`,
                characterMaximumLength: null,
            });
            expect(types['deleted_at']).toEqual({
                dbType: 'timestamptz',
                nullable: true,
                generated: false,
                tsType: 'Date',
                columnName: 'deleted_at',
                columnDefault: null,
                characterMaximumLength: null,
            });
        });
    });
    describe('getTableConstraints', () => {
        it('Loads all primary key columns for table', async (): Promise<void> => {
            const { users } = await intro.getTableConstraints(['users', 'teams']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['user_id'],
                    constraintName: 'users_pkey',
                    constraintType: 'PRIMARY KEY',
                }),
            ]);
            // check compound key
            const { team_members } = await intro.getTableConstraints(['team_members', 'users']);
            expect(team_members).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['team_id', 'user_id'],
                    constraintName: 'team_members_pkey',
                    constraintType: 'PRIMARY KEY',
                }),
            ]);
        });
        it('Loads all foreign key columns for table', async (): Promise<void> => {
            const { posts } = await intro.getTableConstraints(['users', 'posts']);
            expect(posts).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['author_id'],
                    constraintType: 'FOREIGN KEY',
                }),
                expect.objectContaining({
                    columnNames: ['co_author'],
                    constraintType: 'FOREIGN KEY',
                }),
            ]);
        });
        it('loads self relation keys', async () => {
            const { users } = await intro.getTableConstraints(['users', 'posts']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['best_friend_id'],
                    constraintType: 'FOREIGN KEY',
                }),
            ]);
        });
        it('loads unique keys', async () => {
            const { users } = await intro.getTableConstraints(['users', 'posts']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['email'],
                    constraintType: 'UNIQUE',
                }),
            ]);
        });
    });
    describe('getForwardRelations', () => {
        it('Loads all relations on foreign keys for a table', async (): Promise<void> => {
            const { team_members } = await intro.getForwardRelations(['users', 'team_members']);
            expect(team_members).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    joins: [
                        {
                            fromColumn: 'user_id',
                            toColumn: 'user_id',
                        },
                    ],
                    type: 'belongsTo',
                }),
                expect.objectContaining({
                    toTable: 'teams',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                    ],
                    type: 'belongsTo',
                }),
                expect.objectContaining({
                    toTable: 'posts',
                    joins: [
                        {
                            fromColumn: 'member_post_id',
                            toColumn: 'post_id',
                        },
                    ],
                    type: 'belongsTo',
                }),
            ]);
        });
        it('Loads multiple relations to the same table', async (): Promise<void> => {
            const { posts } = await intro.getForwardRelations(['posts', 'teams']);
            expect(posts).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'author_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'co_author',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all joins on compound foreign keys for a table', async (): Promise<void> => {
            const { team_members_positions } = await intro.getForwardRelations([
                'team_members_positions',
                'teams',
                'users',
            ]);
            expect(team_members_positions).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'team_members',
                    alias: 'team_members',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                        {
                            fromColumn: 'user_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all relations on self-referencing keys for table', async (): Promise<void> => {
            const { users } = await intro.getForwardRelations(['users', 'posts']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'best_friend_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
    });
    describe('getBackwardRelations', () => {
        it('Loads all relations on foreign keys referencing the table', async (): Promise<void> => {
            const { teams, posts } = await intro.getBackwardRelations(['teams', 'users', 'posts']);
            expect(teams).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'team_members',
                    alias: 'team_members',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                    ],
                    type: 'hasMany',
                }),
            ]);

            expect(posts).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'team_members',
                    alias: 'team_members',
                    joins: [{ toColumn: 'member_post_id', fromColumn: 'post_id' }],
                    type: 'hasMany',
                }),
            ]);
        });
        it('Loads multiple relations from the same table', async (): Promise<void> => {
            const { users } = await intro.getBackwardRelations(['users', 'posts']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'posts',
                    alias: 'posts',
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
                    alias: 'posts',
                    joins: [
                        {
                            fromColumn: 'user_id',
                            toColumn: 'co_author',
                        },
                    ],
                    type: 'hasMany',
                }),
            ]);
        });
        it('Loads all joins on compound foreign relations to the table', async (): Promise<void> => {
            const { team_members } = await intro.getBackwardRelations(['users', 'team_members']);
            expect(team_members).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'team_members_positions',
                    alias: 'team_members_positions',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                        {
                            fromColumn: 'user_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all relations on self-referencing keys for table', async (): Promise<void> => {
            const { users } = await intro.getBackwardRelations(['users', 'posts']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'user_id',
                            toColumn: 'best_friend_id',
                        },
                    ],
                }),
            ]);
        });
    });
});
