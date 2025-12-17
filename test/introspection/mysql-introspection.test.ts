import 'jest-extended';
import { Introspection } from 'src/introspection/introspection';
import { MySQLIntrospection } from 'src/introspection/mysql-introspection';
import { LogLevel } from 'src/types';
import { buildDBSchemas, closeConnection, DB, describeif, knex, databaseName } from 'test/helpers';

describeif(DB() === 'mysql')('MySQLIntrospection', () => {
    let intro: Introspection;

    beforeAll(
        async (): Promise<void> => {
            await buildDBSchemas();
            intro = new MySQLIntrospection({ knex: knex(), databaseName, logLevel: LogLevel.info });
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
            const { users } = await intro.getEnumTypesForTables(['users', 'teams']);
            expect(Object.keys(users)).toHaveLength(2);
        });
        it('Names enums with table prefix', async (): Promise<void> => {
            const { users } = await intro.getEnumTypesForTables(['users', 'teams']);
            expect(Object.keys(users)).toIncludeAllMembers(['users_subscription_level', 'users_permissions']);
        });
        it('Returns the correct column and values for each enum', async (): Promise<void> => {
            const { users } = await intro.getEnumTypesForTables(['users', 'teams']);
            expect(Object.values(users)).toIncludeAllMembers([
                {
                    columnName: 'permissions',
                    enumName: 'users_permissions',
                    values: ['ADMIN', 'USER'],
                },
                {
                    columnName: 'subscription_level',
                    enumName: 'users_subscription_level',
                    values: ['BRONZE', 'GOLD', 'SILVER'],
                },
            ]);
        });
    });
    describe('getTableTypes', () => {
        it('Loads all columns for a table', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTables(['users', 'teams']);
            const { users } = await intro.getTableTypes(['users', 'teams'], enums);
            expect(Object.keys(users)).toHaveLength(11);
        });
        it('Maps types correctly from db to typescript including enums', async (): Promise<void> => {
            const enums = await intro.getEnumTypesForTables(['users', 'teams']);
            const { users: types } = await intro.getTableTypes(['users', 'teams'], enums);

            expect(types['user_id']).toEqual({
                dbType: 'int',
                nullable: false,
                generated: false,
                tsType: 'number',
                columnName: 'user_id',
                columnDefault: 'auto_increment',
                characterMaximumLength: null,
            });
            expect(types['email']).toEqual({
                dbType: 'varchar',
                nullable: false,
                generated: false,
                tsType: 'string',
                columnName: 'email',
                columnDefault: null,
                characterMaximumLength: null,
            });
            expect(types['first_name']).toEqual({
                dbType: 'varchar',
                nullable: true,
                generated: false,
                tsType: 'string',
                columnName: 'first_name',
                columnDefault: null,
                characterMaximumLength: null,
            });
            expect(types['full_name']).toEqual({
                dbType: 'varchar',
                nullable: true,
                generated: true,
                tsType: 'string',
                columnName: 'full_name',
                columnDefault: 'STORED GENERATED', // this is the 'extra' value
                characterMaximumLength: null,
            });
            expect(types['permissions']).toEqual({
                dbType: 'enum',
                nullable: true,
                generated: false,
                tsType: 'users_permissions',
                columnName: 'permissions',
                columnDefault: 'USER',
                characterMaximumLength: null,
            });
            expect(types['deleted_at']).toEqual({
                dbType: 'datetime',
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
                    constraintName: 'PRIMARY',
                    constraintType: 'PRIMARY KEY',
                }),
            ]);
            // check compound key
            const { team_members } = await intro.getTableConstraints(['team_members']);
            expect(team_members).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['team_id', 'user_id'],
                    constraintName: 'PRIMARY',
                    constraintType: 'PRIMARY KEY',
                }),
            ]);
        });
        it('Loads all foreign key columns for table', async (): Promise<void> => {
            const { posts } = await intro.getTableConstraints(['posts', 'users']);
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
            const { users } = await intro.getTableConstraints(['users', 'teams']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    columnNames: ['best_friend_id'],
                    constraintType: 'FOREIGN KEY',
                }),
            ]);
        });
        it('loads unique keys', async () => {
            const { users } = await intro.getTableConstraints(['users', 'teams']);
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
            const { team_members } = await intro.getForwardRelations(['team_members', 'teams']);
            expect(team_members).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            fromColumn: 'user_id',
                            toColumn: 'user_id',
                        },
                    ],
                }),
                expect.objectContaining({
                    toTable: 'teams',
                    alias: 'teams',
                    joins: [
                        {
                            fromColumn: 'team_id',
                            toColumn: 'team_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads multiple relations to the same table', async (): Promise<void> => {
            const { posts } = await intro.getForwardRelations(['posts']);
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
            const { team_members_positions } = await intro.getForwardRelations(['team_members_positions']);
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
            const { users } = await intro.getForwardRelations(['users', 'teams']);
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
            const { teams } = await intro.getBackwardRelations(['teams', 'posts']);
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
                }),
            ]);
        });
        it('Loads multiple relations from the same table', async (): Promise<void> => {
            const { users } = await intro.getBackwardRelations(['users', 'teams']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'posts',
                    alias: 'posts',
                    joins: [
                        {
                            toColumn: 'author_id',
                            fromColumn: 'user_id',
                        },
                    ],
                }),
                expect.objectContaining({
                    toTable: 'posts',
                    alias: 'posts',
                    joins: [
                        {
                            toColumn: 'co_author',
                            fromColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
        it('Loads all joins on compound foreign relations to the table', async (): Promise<void> => {
            const { team_members } = await intro.getBackwardRelations(['team_members']);
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
            const { users } = await intro.getBackwardRelations(['users', 'teams']);
            expect(users).toIncludeAllMembers([
                expect.objectContaining({
                    toTable: 'users',
                    alias: 'users',
                    joins: [
                        {
                            toColumn: 'best_friend_id',
                            fromColumn: 'user_id',
                        },
                    ],
                }),
            ]);
        });
    });
});
