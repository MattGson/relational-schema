import 'jest-extended';
import { CardinalityResolver } from 'src/introspection';
import { Introspection } from 'src/introspection/introspection';
import { closeConnection, getIntrospection, knex, openConnection, databaseName } from 'test/helpers';

describe('CardinalityResolver', () => {
    let intro: Introspection;
    beforeAll(async () => {
        await openConnection();
        intro = getIntrospection(knex(), databaseName);
    });
    afterAll(async () => {
        await closeConnection();
    });
    describe('isOneToOneRelation', () => {
        it('Returns false for a non-uniquely constrained forward relation', async () => {
            const { users: keys } = await intro.getTableConstraints(['users']);
            const { users: rels } = await intro.getForwardRelations(['users']);
            const oneToOne = CardinalityResolver.isOneToOneRelation({ forwardRelation: rels[0], keys });
            expect(oneToOne).toEqual(false);
        });
        it('Returns true for a uniquely constrained forward relation', async () => {
            const { team_members_positions: keys } = await intro.getTableConstraints(['team_members_positions']);
            const { team_members_positions: rels } = await intro.getForwardRelations(['team_members_positions']);
            const oneToOne = CardinalityResolver.isOneToOneRelation({
                forwardRelation: rels.find((r) => r.toTable === 'team_members')!,
                keys,
            });
            expect(oneToOne).toEqual(true);
        });
        it('Throws on non-forward relation', async () => {
            const { users: keys } = await intro.getTableConstraints(['users']);
            const { users: rels } = await intro.getBackwardRelations(['users']);
            expect(() => CardinalityResolver.isOneToOneRelation({ forwardRelation: rels[0], keys })).toThrow(Error);
        });
    });
    describe('primaryKeys', () => {
        it('Returns the primary key from a set of constraints', async () => {
            const keys = await intro.getTableConstraints(['users']);
            const primary = CardinalityResolver.primaryKey(keys['users']);
            expect(primary).toEqual(expect.objectContaining({ columnNames: ['user_id'] }));
        });
        it('Returns the compound primary key from a set of keys', async () => {
            const { team_members: constraints } = await intro.getTableConstraints(['team_members']);
            const primary = CardinalityResolver.primaryKey(constraints);
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
