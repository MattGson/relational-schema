import Knex from 'knex';
import _ from 'lodash';
import { logger } from '../lib/logger';
import {
    ColumnType,
    ConstraintDefinition,
    EnumDefinitions,
    LogLevel,
    RelationDefinition,
    TableColumnsDefinition,
    TableMap,
} from '../types';

export abstract class Introspection {
    protected abstract logLevel: LogLevel;
    abstract getSchemaTables(): Promise<string[]>;
    abstract getEnumTypesForTables(tables: string[]): Promise<TableMap<EnumDefinitions>>;
    abstract getTableTypes(
        tables: string[],
        enumTypes: TableMap<EnumDefinitions>,
    ): Promise<TableMap<TableColumnsDefinition>>;
    abstract getTableConstraints(tables: string[]): Promise<TableMap<ConstraintDefinition[]>>;
    abstract getForwardRelations(tables: string[]): Promise<TableMap<RelationDefinition[]>>;
    abstract getBackwardRelations(tables: string[]): Promise<TableMap<RelationDefinition[]>>;
    abstract getTsTypeForColumn(
        tableName: string,
        columnName: string,
        dbType: string,
        customTypes: EnumDefinitions,
    ): ColumnType;

    /**
     * Execute a knex query
     * @param query
     * @returns
     */
    protected async query<T>(query: Knex.QueryBuilder<T>): Promise<T> {
        if (this.logLevel === LogLevel.debug) {
            logger.debug('Executing query: ', query.toSQL());
        }
        return await query;
    }

    /**
     * Helper to group and map over rows by table_name
     * @param rows
     * @param iterate
     */
    protected tableMap<T extends { table_name: string }>(
        rows: T[],
        iterate: (table_name: string, rows: T[]) => void,
    ): void {
        const reconciled = _.groupBy(rows, (r) => r.table_name);
        Object.entries(reconciled).forEach(([table, rows]) => iterate(table, rows));
    }
}
