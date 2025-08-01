import { SupportedDbtAdapter } from '../types/dbt';
import { DEFAULT_SPOTLIGHT_CONFIG } from '../types/lightdashProjectConfig';
import { attachTypesToModels, convertTable } from './translator';
import {
    DBT_METRIC,
    DBT_METRIC_DERIVED,
    DBT_METRIC_WITH_CUSTOM_SQL,
    DBT_METRIC_WITH_FILTER,
    DBT_METRIC_WITH_SQL_FIELD,
    DBT_V9_METRIC,
    LIGHTDASH_TABLE_SQL_WHERE,
    LIGHTDASH_TABLE_WITHOUT_AUTO_METRICS,
    LIGHTDASH_TABLE_WITH_ADDITIONAL_DIMENSIONS,
    LIGHTDASH_TABLE_WITH_AI_HINT,
    LIGHTDASH_TABLE_WITH_AI_HINT_ARRAY,
    LIGHTDASH_TABLE_WITH_AI_HINT_FROM_CONFIG,
    LIGHTDASH_TABLE_WITH_COMPOSITE_PRIMARY_KEY,
    LIGHTDASH_TABLE_WITH_CUSTOM_TIME_INTERVAL_DIMENSIONS,
    LIGHTDASH_TABLE_WITH_DBT_METRICS,
    LIGHTDASH_TABLE_WITH_DBT_V9_METRICS,
    LIGHTDASH_TABLE_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS_BIGQUERY,
    LIGHTDASH_TABLE_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS_SNOWFLAKE,
    LIGHTDASH_TABLE_WITH_DIMENSION_AI_HINT,
    LIGHTDASH_TABLE_WITH_DIMENSION_AI_HINT_ARRAY,
    LIGHTDASH_TABLE_WITH_GROUP_BLOCK,
    LIGHTDASH_TABLE_WITH_GROUP_LABEL,
    LIGHTDASH_TABLE_WITH_METRICS,
    LIGHTDASH_TABLE_WITH_METRIC_AI_HINT,
    LIGHTDASH_TABLE_WITH_METRIC_AI_HINT_ARRAY,
    LIGHTDASH_TABLE_WITH_METRIC_LEVEL_CATEGORIES,
    LIGHTDASH_TABLE_WITH_MODEL_LEVEL_CATEGORIES,
    LIGHTDASH_TABLE_WITH_MODEL_METRIC_AI_HINT,
    LIGHTDASH_TABLE_WITH_NO_CATEGORIES,
    LIGHTDASH_TABLE_WITH_OFF_TIME_INTERVAL_DIMENSIONS,
    LIGHTDASH_TABLE_WITH_SINGLE_PRIMARY_KEY,
    MODEL_WITH_ADDITIONAL_DIMENSIONS,
    MODEL_WITH_AI_HINT,
    MODEL_WITH_AI_HINT_ARRAY,
    MODEL_WITH_AI_HINT_IN_CONFIG,
    MODEL_WITH_COMPOSITE_PRIMARY_KEY,
    MODEL_WITH_CUSTOM_TIME_INTERVAL_DIMENSIONS,
    MODEL_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS,
    MODEL_WITH_DIMENSION_AI_HINT,
    MODEL_WITH_DIMENSION_AI_HINT_ARRAY,
    MODEL_WITH_GROUPS_BLOCK,
    MODEL_WITH_GROUP_LABEL,
    MODEL_WITH_METRIC,
    MODEL_WITH_METRIC_AI_HINT,
    MODEL_WITH_METRIC_AI_HINT_ARRAY,
    MODEL_WITH_METRIC_LEVEL_CATEGORIES,
    MODEL_WITH_MODEL_LEVEL_CATEGORIES,
    MODEL_WITH_MODEL_METRIC_AI_HINT,
    MODEL_WITH_NO_CATEGORIES,
    MODEL_WITH_NO_METRICS,
    MODEL_WITH_NO_TIME_INTERVAL_DIMENSIONS,
    MODEL_WITH_OFF_BOOLEAN_TIME_INTERVAL_DIMENSIONS,
    MODEL_WITH_OFF_TIME_INTERVAL_DIMENSIONS,
    MODEL_WITH_SINGLE_PRIMARY_KEY,
    MODEL_WITH_SQL_FILTER,
    MODEL_WITH_SQL_WHERE,
    MODEL_WITH_WRONG_METRIC,
    MODEL_WITH_WRONG_METRICS,
    SPOTLIGHT_CONFIG_WITH_CATEGORIES_AND_HIDE,
    expectedModelWithType,
    model,
    warehouseSchema,
    warehouseSchemaWithMissingColumn,
    warehouseSchemaWithMissingTable,
    warehouseSchemaWithUpperCaseColumn,
} from './translator.mock';

describe('attachTypesToModels', () => {
    it('should return models with types', async () => {
        expect(attachTypesToModels([model], warehouseSchema, false)[0]).toEqual(
            expectedModelWithType,
        );
    });
    it('should return models with undefined type when is missing dataset or table or column', async () => {
        expect(attachTypesToModels([model], {}, false)[0]).toEqual(model);
        expect(
            attachTypesToModels(
                [model],
                warehouseSchemaWithMissingTable,
                false,
            )[0],
        ).toEqual(model);
        expect(
            attachTypesToModels(
                [model],
                warehouseSchemaWithMissingColumn,
                false,
            )[0],
        ).toEqual(model);
    });
    it('should throw when is missing dataset or table or column', async () => {
        expect(() => attachTypesToModels([model], {}, true)).toThrowError(
            'Model "myTable" was expected in your target warehouse at "myDatabase.mySchema.myTable". Does the table exist in your target data warehouse?',
        );
        expect(() =>
            attachTypesToModels([model], warehouseSchemaWithMissingTable, true),
        ).toThrowError(
            'Model "myTable" was expected in your target warehouse at "myDatabase.mySchema.myTable". Does the table exist in your target data warehouse?',
        );
        expect(() =>
            attachTypesToModels(
                [model],
                warehouseSchemaWithMissingColumn,
                true,
            ),
        ).toThrowError(
            'Column "myColumnName" from model "myTable" does not exist.\n "myTable.myColumnName" was not found in your target warehouse at myDatabase.mySchema.myTable. Try rerunning dbt to update your warehouse.',
        );
    });
    it('should throw an error when column has wrong case', async () => {
        expect(() =>
            attachTypesToModels(
                [model],
                warehouseSchemaWithUpperCaseColumn,
                true,
            ),
        ).toThrowError(
            'Column "myColumnName" from model "myTable" does not exist.\n "myTable.myColumnName" was not found in your target warehouse at myDatabase.mySchema.myTable. Try rerunning dbt to update your warehouse.',
        );
    });
    it('should match uppercase column names when case-sensitive is false', async () => {
        expect(
            attachTypesToModels(
                [model],
                warehouseSchemaWithUpperCaseColumn,
                true,
                false,
            )[0],
        ).toEqual(expectedModelWithType);
    });
});

describe('convert tables from dbt models', () => {
    it('should convert dbt model without metrics to Lightdash table without autogenerated metrics', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_NO_METRICS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITHOUT_AUTO_METRICS);
    });
    it('should convert dbt model with dbt metrics', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_NO_METRICS,
                [
                    DBT_METRIC,
                    DBT_METRIC_WITH_SQL_FIELD,
                    DBT_METRIC_WITH_CUSTOM_SQL,
                    DBT_METRIC_WITH_FILTER,
                    DBT_METRIC_DERIVED,
                ],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_DBT_METRICS);
        // dbt 1.5 metrics
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_NO_METRICS,
                [DBT_V9_METRIC],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_DBT_V9_METRICS);
    });
    it('should convert dbt model with metrics in meta', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_METRIC,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_METRICS);
    });
    it('should convert dbt model with dimension with default time intervals bigquery', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(
            LIGHTDASH_TABLE_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS_BIGQUERY,
        );
    });
    it('should convert dbt model with dimension with no time intervals bigquery', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_NO_TIME_INTERVAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(
            LIGHTDASH_TABLE_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS_BIGQUERY,
        );
    });
    it('should convert dbt model with dimension with default time intervals snowflake', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.SNOWFLAKE,
                MODEL_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(
            LIGHTDASH_TABLE_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS_SNOWFLAKE,
        );
    });
    it('should convert dbt model with dimension with no time intervals snowflake', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.SNOWFLAKE,
                MODEL_WITH_NO_TIME_INTERVAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(
            LIGHTDASH_TABLE_WITH_DEFAULT_TIME_INTERVAL_DIMENSIONS_SNOWFLAKE,
        );
    });
    it('should convert dbt model with dimension with off time intervals', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_OFF_TIME_INTERVAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_OFF_TIME_INTERVAL_DIMENSIONS);
    });
    it('should convert dbt model with dimension with off boolean time intervals', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_OFF_BOOLEAN_TIME_INTERVAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_OFF_TIME_INTERVAL_DIMENSIONS);
    });
    it('should convert dbt model with dimension with custom time intervals', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_CUSTOM_TIME_INTERVAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_CUSTOM_TIME_INTERVAL_DIMENSIONS);
    });
    it('should throw an error when metric and dimension have the same name', async () => {
        expect(() =>
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_WRONG_METRIC,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toThrowError(
            'Found a metric and a dimension with the same name: user_id',
        );
    });
    it('should throw an error when multiple metrics and dimensions have the same name', async () => {
        expect(() =>
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_WRONG_METRICS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toThrowError(
            'Found multiple metrics and a dimensions with the same name: user_id,user_id2',
        );
    });

    it('should convert dbt model with group label', async () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_GROUP_LABEL,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_GROUP_LABEL);
    });

    // `sql_where` is an alias of `sql_filter`
    it('should convert dbt model with sql where', async () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_SQL_WHERE,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_SQL_WHERE);
    });

    it('should convert dbt model with sql filter', async () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_SQL_FILTER,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_SQL_WHERE);
    });

    it('should convert dbt model with dimension and additional dimensions', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.POSTGRES,
                MODEL_WITH_ADDITIONAL_DIMENSIONS,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_ADDITIONAL_DIMENSIONS);
    });

    it('should convert dbt model with groups meta block', async () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_GROUPS_BLOCK,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_GROUP_BLOCK);
    });

    it('should convert dbt model with single column primary key', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_SINGLE_PRIMARY_KEY,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_SINGLE_PRIMARY_KEY);
    });

    it('should convert dbt model with composite primary key', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_COMPOSITE_PRIMARY_KEY,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_COMPOSITE_PRIMARY_KEY);
    });

    it('should convert dbt model with dimension ai.hint', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_DIMENSION_AI_HINT,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_DIMENSION_AI_HINT);
    });

    it('should convert dbt model with metric ai.hint', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_METRIC_AI_HINT,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_METRIC_AI_HINT);
    });

    it('should convert dbt model with model-level metric ai.hint', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_MODEL_METRIC_AI_HINT,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_MODEL_METRIC_AI_HINT);
    });

    it('should convert dbt model with table ai.hint in meta', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_AI_HINT,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_AI_HINT);
    });

    it('should convert dbt model with table ai.hint in config.meta', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_AI_HINT_IN_CONFIG,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_AI_HINT_FROM_CONFIG);
    });

    it('should convert dbt model with table ai.hint as array', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_AI_HINT_ARRAY,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_AI_HINT_ARRAY);
    });

    it('should convert dbt model with dimension ai.hint as array', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_DIMENSION_AI_HINT_ARRAY,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_DIMENSION_AI_HINT_ARRAY);
    });

    it('should convert dbt model with metric ai.hint as array', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_METRIC_AI_HINT_ARRAY,
                [],
                DEFAULT_SPOTLIGHT_CONFIG,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_METRIC_AI_HINT_ARRAY);
    });
});

describe('spotlight config', () => {
    it('should convert dbt model with metrics when no categories are defined', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_NO_CATEGORIES,
                [DBT_METRIC],
                SPOTLIGHT_CONFIG_WITH_CATEGORIES_AND_HIDE.spotlight,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_NO_CATEGORIES);
    });

    it('should convert dbt model with metrics when categories are defined', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_MODEL_LEVEL_CATEGORIES,
                [DBT_METRIC],
                SPOTLIGHT_CONFIG_WITH_CATEGORIES_AND_HIDE.spotlight,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_MODEL_LEVEL_CATEGORIES);
    });

    it('should convert dbt model with metrics when categories are defined and there is metric level assignment', () => {
        expect(
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_METRIC_LEVEL_CATEGORIES,
                [DBT_METRIC],
                SPOTLIGHT_CONFIG_WITH_CATEGORIES_AND_HIDE.spotlight,
            ),
        ).toStrictEqual(LIGHTDASH_TABLE_WITH_METRIC_LEVEL_CATEGORIES);
    });

    it('should error when categories are assigned but not defined in the spotlight config', () => {
        expect(() =>
            convertTable(
                SupportedDbtAdapter.BIGQUERY,
                MODEL_WITH_METRIC_LEVEL_CATEGORIES,
                [DBT_METRIC],
                DEFAULT_SPOTLIGHT_CONFIG, // no categories defined
            ),
        ).toThrowError(
            `Invalid spotlight categories found in metric 'user_count': category_1, category_2. Categories must be defined in project config.`,
        );
    });
});
