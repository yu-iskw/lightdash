import { getItemMap } from '@lightdash/common';
import { Box, Text } from '@mantine/core';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { useColumns } from '../../../hooks/useColumns';
import { useExplore } from '../../../hooks/useExplore';
import useExplorerContext from '../../../providers/Explorer/useExplorerContext';
import { TrackSection } from '../../../providers/Tracking/TrackingProvider';
import { SectionName } from '../../../types/Events';
import Table from '../../common/Table';
import { JsonViewerModal } from '../../JsonViewerModal';
import CellContextMenu from './CellContextMenu';
import ColumnHeaderContextMenu from './ColumnHeaderContextMenu';
import {
    EmptyStateExploreLoading,
    EmptyStateNoColumns,
    EmptyStateNoTableData,
    MissingRequiredParameters,
    NoTableSelected,
} from './ExplorerResultsNonIdealStates';

export const ExplorerResults = memo(() => {
    const columns = useColumns();
    const isEditMode = useExplorerContext(
        (context) => context.state.isEditMode,
    );
    const activeTableName = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableName,
    );
    const dimensions = useExplorerContext(
        (context) => context.state.unsavedChartVersion.metricQuery.dimensions,
    );
    const metrics = useExplorerContext(
        (context) => context.state.unsavedChartVersion.metricQuery.metrics,
    );
    const explorerColumnOrder = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableConfig.columnOrder,
    );
    const rows = useExplorerContext((context) => context.queryResults.rows);
    const totalRows = useExplorerContext(
        (context) => context.queryResults.totalResults,
    );

    const isFetchingRows = useExplorerContext(
        (context) =>
            context.queryResults.isFetchingRows && !context.queryResults.error,
    );
    const fetchMoreRows = useExplorerContext(
        (context) => context.queryResults.fetchMoreRows,
    );
    const status = useExplorerContext((context) => {
        const isCreatingQuery = context.query.isFetching;
        const isFetchingFirstPage = context.queryResults.isFetchingFirstPage;
        // Don't return context.queryResults.status because we changed from mutation to query so 'loading' as a different meaning
        if (context.queryResults.error) {
            return 'error';
        } else if (isCreatingQuery || isFetchingFirstPage) {
            return 'loading';
        } else if (context.query.status === 'loading') {
            return 'idle';
        } else {
            return context.query.status;
        }
    });

    const apiError = useExplorerContext(
        (context) => context.query.error ?? context.queryResults.error,
    );

    const setColumnOrder = useExplorerContext(
        (context) => context.actions.setColumnOrder,
    );
    const { data: exploreData, isInitialLoading: isExploreLoading } =
        useExplore(activeTableName, {
            refetchOnMount: false,
        });
    const tableCalculations = useExplorerContext(
        (context) =>
            context.state.unsavedChartVersion.metricQuery.tableCalculations,
    );
    const additionalMetrics = useExplorerContext(
        (context) =>
            context.state.unsavedChartVersion.metricQuery.additionalMetrics,
    );
    const missingRequiredParameters = useExplorerContext(
        (context) => context.state.missingRequiredParameters,
    );
    const [isExpandModalOpened, setIsExpandModalOpened] = useState(false);
    const [expandData, setExpandData] = useState<{
        name: string;
        jsonObject: Record<string, unknown>;
    }>({
        name: 'unknown',
        jsonObject: {},
    });

    const handleCellExpand = (name: string, data: Record<string, unknown>) => {
        setExpandData({
            name: name,
            jsonObject: data,
        });
        setIsExpandModalOpened(true);
    };

    const itemsMap = useMemo(() => {
        if (exploreData) {
            return getItemMap(
                exploreData,
                additionalMetrics,
                tableCalculations,
            );
        }
        return undefined;
    }, [exploreData, additionalMetrics, tableCalculations]);

    const cellContextMenu = useCallback(
        (props: any) => (
            <CellContextMenu
                isEditMode={isEditMode}
                {...props}
                itemsMap={itemsMap}
                onExpand={handleCellExpand}
            />
        ),
        [isEditMode, itemsMap],
    );

    const IdleState: FC = useCallback(() => {
        const description =
            dimensions.length <= 0 ? (
                <>
                    Pick one or more{' '}
                    <Text span color="blue.9">
                        dimensions
                    </Text>{' '}
                    to split your selected metric by.
                </>
            ) : metrics.length <= 0 ? (
                <>
                    Pick a{' '}
                    <Text span color="yellow.9">
                        metric
                    </Text>{' '}
                    to make calculations across your selected dimensions.
                </>
            ) : (
                <>
                    Run query to view your results and visualize them as a
                    chart.
                </>
            );

        return <EmptyStateNoTableData description={description} />;
    }, [dimensions.length, metrics.length]);

    const pagination = useMemo(
        () => ({
            show: true,
            showResultsTotal: true,
        }),
        [],
    );
    const footer = useMemo(
        () => ({
            show: true,
        }),
        [],
    );

    if (!activeTableName) return <NoTableSelected />;

    if (columns.length === 0) return <EmptyStateNoColumns />;

    if (isExploreLoading) return <EmptyStateExploreLoading />;

    if (missingRequiredParameters && missingRequiredParameters.length > 0)
        return (
            <MissingRequiredParameters
                missingRequiredParameters={missingRequiredParameters}
            />
        );

    return (
        <TrackSection name={SectionName.RESULTS_TABLE}>
            <Box px="xs" py="lg">
                <Table
                    status={status}
                    errorDetail={apiError?.error}
                    data={rows || []}
                    totalRowsCount={totalRows || 0}
                    isFetchingRows={isFetchingRows}
                    fetchMoreRows={fetchMoreRows}
                    columns={columns}
                    columnOrder={explorerColumnOrder}
                    onColumnOrderChange={setColumnOrder}
                    cellContextMenu={cellContextMenu}
                    headerContextMenu={
                        isEditMode ? ColumnHeaderContextMenu : undefined
                    }
                    idleState={IdleState}
                    pagination={pagination}
                    footer={footer}
                    showSubtotals={false}
                />
                <JsonViewerModal
                    heading={`Field: ${expandData.name}`}
                    jsonObject={expandData.jsonObject}
                    opened={isExpandModalOpened}
                    onClose={() => setIsExpandModalOpened(false)}
                />
            </Box>
        </TrackSection>
    );
});
