import 'jest-extended';
import { CardinalityResolver } from 'src/introspection';
import { Introspection } from 'src/types';
import { buildDBSchemas, closeConnection, getIntrospection, knex, schemaName } from 'test/setup';

describe('CardinalityResolver', () => {
    let intro: Introspection;
    beforeAll(async () => {
        await buildDBSchemas();
        intro = getIntrospection(knex(), schemaName);
    });
    afterAll(async () => {
        await closeConnection();
    });
    describe('primaryKeys', () => {
        it('Returns the primary key from a set of constraints', async () => {
            const keys = await intro.getTableConstraints(['users']);
            const primary = CardinalityResolver.primaryKey(keys['users']);
            expect(primary).toEqual(expect.objectContaining({ columnNames: ['user_id'] }));
        });
        it('Returns the compound primary key from a set of keys', async () => {
            const keys = await intro.getTableConstraints(['team_members']);
            const primary = CardinalityResolver.primaryKey(keys['users']);
            expect(primary).toEqual(expect.objectContaining({ columnNames: ['team_id', 'user_id'] }));
        });
    });
    describe('uniqueColumns', () => {
        it('Returns the columns that have a UNIQUE constraint', async () => {
            const keys = await intro.getTableConstraints(['users']);
            const unique = CardinalityResolver.uniqueConstraints(keys['users']);
            expect(unique).toHaveLength(2);
            expect(unique).toIncludeAllMembers([
                expect.objectContaining({ columnNames: ['email'] }),
                expect.objectContaining({ columnNames: ['token'] }),
            ]);
        });
        it('Returns all columns from a multipart UNIQUE constraint', async () => {
            const keys = await intro.getTableConstraints(['team_members_positions']);
            const unique = CardinalityResolver.uniqueConstraints(keys['team_members_positions']);
            expect(unique).toHaveLength(1);
            expect(unique).toIncludeAllMembers([expect.objectContaining({ columnNames: ['manager', 'position'] })]);
        });
    });
    describe('getUniqueKeyCombinations', () => {
        it('Returns the UNIQUE key constraints', async () => {
            const keys = await intro.getTableConstraints(['team_members_positions']);
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys['team_members_positions']);
            expect(combos).toIncludeAllMembers([['manager', 'position']]);
        });
        it('Returns a primary key', async () => {
            const keys = await intro.getTableConstraints(['users']);
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys['users']);
            expect(combos).toIncludeAllMembers([['user_id']]);
        });
        it('Returns a compound primary key', async () => {
            const keys = await intro.getTableConstraints(['team_members_positions']);
            const combos = CardinalityResolver.getUniqueKeyCombinations(keys['team_members_positions']);
            expect(combos).toContainEqual(['team_id', 'user_id']);
        });
    });
});
