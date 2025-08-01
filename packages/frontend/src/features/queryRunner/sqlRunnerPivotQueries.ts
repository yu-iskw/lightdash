import {
    VIZ_DEFAULT_AGGREGATION,
    type DashboardFilters,
    type ParametersValuesMap,
    type PivotChartData,
    type QueryExecutionContext,
    type ResultColumns,
    type RunPivotQuery,
    type SortField,
    type SqlRunnerField,
    type SqlRunnerPivotQueryBody,
    type SqlRunnerQuery,
    type VizColumn,
    type VizSortBy,
} from '@lightdash/common';
import { getVizIndexTypeFromSqlRunnerFieldType } from './BaseResultsRunner';
import {
    executeDashboardSqlChartPivotQuery,
    executeSqlChartPivotQuery,
    executeSqlPivotQuery,
} from './executeQuery';

// TODO: REMOVE THIS - temporary mapping logic - also needs access to fields :(
const convertSqlRunnerQueryToSqlRunnerPivotQuery = (
    query: SqlRunnerQuery,
    fields: SqlRunnerField[],
): Pick<
    SqlRunnerPivotQueryBody,
    'indexColumn' | 'groupByColumns' | 'valuesColumns'
> => {
    const index = fields.find((field) => field.name === query.pivot?.index[0]);
    const values = query.pivot?.values.map((value) => {
        const customMetric = query.customMetrics?.find(
            (metric) => metric.name === value,
        );

        // This should never be true
        if (!customMetric || customMetric.baseDimension === undefined) {
            throw new Error(
                'Unexpected error: incorrect pivot configuration, no metric',
            );
        }
        return {
            name: customMetric.baseDimension,
            aggregation: customMetric.aggType,
        };
    });
    const groupBy = query.pivot?.on.map((on) => {
        const f = fields.find((field) => field.name === on);
        if (!f) {
            throw new Error(
                'Unexpected error: incorrect pivot configuration, invalid groupBy',
            );
        }
        return f;
    });

    if (index === undefined || values === undefined || values.length === 0) {
        throw new Error('Unexpected error: incorrect pivot configuration');
    }
    return {
        indexColumn: {
            reference: index.name,
            type: getVizIndexTypeFromSqlRunnerFieldType(index.type),
        },
        valuesColumns: values.map((value) => ({
            reference: value.name,
            aggregation: value.aggregation ?? VIZ_DEFAULT_AGGREGATION,
        })),
        groupByColumns: groupBy?.map((f) => ({ reference: f.name })),
    };
};
// TEMPORARY
export const getPivotQueryFunctionForSqlQuery = ({
    projectUuid,
    limit,
    sortBy,
    sql,
    fields,
    context,
    parameters,
}: {
    projectUuid: string;
    limit?: number;
    sql: string;
    sortBy?: VizSortBy[];
    fields: SqlRunnerField[];
    context?: QueryExecutionContext;
    parameters: ParametersValuesMap;
}): RunPivotQuery => {
    return async (query: SqlRunnerQuery) => {
        const index = query.pivot?.index[0];

        if (index === undefined) {
            return {
                queryUuid: undefined,
                results: [],
                indexColumn: undefined,
                valuesColumns: [],
                columns: [],
                fileUrl: undefined,
                columnCount: undefined,
            };
        }

        const { indexColumn, valuesColumns, groupByColumns } =
            convertSqlRunnerQueryToSqlRunnerPivotQuery(query, fields);

        const pivotResults = await executeSqlPivotQuery(projectUuid, {
            context,
            limit,
            sql,
            pivotConfiguration: {
                indexColumn,
                valuesColumns,
                groupByColumns,
                sortBy,
            },
            parameters,
        });

        const columns: VizColumn[] = Object.keys(pivotResults.columns).map(
            (field) => ({
                reference: field,
            }),
        );

        return {
            queryUuid: pivotResults.queryUuid,
            fileUrl: pivotResults.fileUrl,
            results: pivotResults.results,
            indexColumn: pivotResults.indexColumn,
            valuesColumns: pivotResults.valuesColumns,
            columns,
            columnCount: pivotResults.columnCount,
        };
    };
};

export const getSqlChartPivotChartData = async ({
    projectUuid,
    savedSqlUuid,
    limit,
    context,
    parameters,
}: {
    projectUuid: string;
    savedSqlUuid: string;
    limit?: number;
    context?: QueryExecutionContext;
    parameters?: ParametersValuesMap;
}): Promise<
    PivotChartData & { queryUuid: string; originalColumns: ResultColumns }
> => {
    const pivotResults = await executeSqlChartPivotQuery(projectUuid, {
        savedSqlUuid,
        context,
        limit,
        parameters,
    });

    const columns: VizColumn[] = Object.keys(pivotResults.columns).map(
        (field) => ({
            reference: field,
        }),
    );

    return {
        ...pivotResults,
        columns,
    };
};

export const getDashboardSqlChartPivotChartData = async ({
    projectUuid,
    dashboardUuid,
    tileUuid,
    savedSqlUuid,
    limit,
    dashboardFilters,
    dashboardSorts,
    context,
    parameters,
}: {
    projectUuid: string;
    dashboardUuid: string;
    tileUuid: string;
    savedSqlUuid: string;
    limit?: number;
    dashboardFilters: DashboardFilters;
    dashboardSorts: SortField[]; // TODO: check if dashboardSorts is needed, seems to be unused
    context?: QueryExecutionContext;
    parameters?: ParametersValuesMap;
}): Promise<
    PivotChartData & { queryUuid: string; originalColumns: ResultColumns }
> => {
    const pivotResults = await executeDashboardSqlChartPivotQuery(projectUuid, {
        dashboardUuid,
        tileUuid,
        savedSqlUuid,
        context,
        dashboardFilters,
        dashboardSorts,
        limit,
        parameters,
    });

    const columns: VizColumn[] = Object.keys(pivotResults.columns).map(
        (field) => ({
            reference: field,
        }),
    );

    return {
        ...pivotResults,
        columns,
    };
};
