import React, { useMemo, CSSProperties, Suspense } from 'react';
import { Translate, useGetList } from 'react-admin';
import {
    useMediaQuery,
    Theme,
    Skeleton,
    Card,
    CardHeader,
    CardContent,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
} from '@mui/material';
import { subDays, startOfDay } from 'date-fns';

import Welcome from './Welcome';
import MonthlyRevenue from './MonthlyRevenue';
import NbNewOrders from './NbNewOrders';
import PendingOrders from './PendingOrders';
import PendingReviews from './PendingReviews';
import NewCustomers from './NewCustomers';

import { Order } from '../types';

interface OrderStats {
    revenue: number;
    nbNewOrders: number;
    pendingOrders: Order[];
}

interface State {
    nbNewOrders?: number;
    pendingOrders?: Order[];
    recentOrders?: Order[];
    revenue?: string;
}

const styles = {
    flex: { display: 'flex' },
    flexColumn: { display: 'flex', flexDirection: 'column' },
    leftCol: { flex: 1, marginRight: '0.5em' },
    rightCol: { flex: 1, marginLeft: '0.5em' },
    singleCol: { marginTop: '1em', marginBottom: '1em' },
};

const Spacer = () => <span style={{ width: '1em' }} />;
const VerticalSpacer = () => <span style={{ height: '1em' }} />;

const OrderChart = React.lazy(() => import('./OrderChart'));

const Dashboard = () => {
    const [historyDuration, setHistoryDuration] = React.useState(30);
    const isXSmall = useMediaQuery((theme: Theme) =>
        theme.breakpoints.down('sm')
    );
    const isSmall = useMediaQuery((theme: Theme) =>
        theme.breakpoints.down('lg')
    );
    const sinceDate = useMemo(
        () => subDays(startOfDay(new Date()), historyDuration),
        [historyDuration]
    );

    const handleHistoryDurationChange = (event: SelectChangeEvent<number>) => {
        setHistoryDuration(Number(event.target.value));
    };

    const { data: orders } = useGetList<Order>('orders', {
        filter: { date_gte: sinceDate.toISOString() },
        sort: { field: 'date', order: 'DESC' },
        pagination: { page: 1, perPage: 200 },
    });

    const aggregation = useMemo<State>(() => {
        if (!orders) return {};
        const aggregations = orders
            .filter(order => order.status !== 'cancelled')
            .reduce(
                (stats: OrderStats, order) => {
                    if (order.status !== 'cancelled') {
                        stats.revenue += order.total;
                        stats.nbNewOrders++;
                    }
                    if (order.status === 'ordered') {
                        stats.pendingOrders.push(order);
                    }
                    return stats;
                },
                {
                    revenue: 0,
                    nbNewOrders: 0,
                    pendingOrders: [],
                }
            );
        return {
            recentOrders: orders,
            revenue: aggregations.revenue.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }),
            nbNewOrders: aggregations.nbNewOrders,
            pendingOrders: aggregations.pendingOrders,
        };
    }, [orders]);

    const { nbNewOrders, pendingOrders, revenue, recentOrders } = aggregation;
    return isXSmall ? (
        <div>
            <div style={styles.flexColumn as CSSProperties}>
                <Welcome />
                <MonthlyRevenue value={revenue} />
                <VerticalSpacer />
                <NbNewOrders value={nbNewOrders} />
                <VerticalSpacer />
                <PendingOrders orders={pendingOrders} />
            </div>
        </div>
    ) : isSmall ? (
        <div style={styles.flexColumn as CSSProperties}>
            <div style={styles.singleCol}>
                <Welcome />
            </div>
            <div style={styles.flex}>
                <MonthlyRevenue value={revenue} />
                <Spacer />
                <NbNewOrders value={nbNewOrders} />
            </div>
            <div style={styles.singleCol}>
                <Card>
                    <CardHeader
                        title={
                            <Translate
                                i18nKey="pos.dashboard.revenue_history"
                                options={{ smart_count: historyDuration }}
                            />
                        }
                        action={
                            <Box sx={{ minWidth: 120, mt: 1 }}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel id="history-duration-select-label">
                                        <Translate i18nKey="pos.dashboard.duration" />
                                    </InputLabel>
                                    <Select
                                        labelId="history-duration-select-label"
                                        value={historyDuration}
                                        label="Duration"
                                        onChange={handleHistoryDurationChange}
                                    >
                                        <MenuItem value={30}>30 Days</MenuItem>
                                        <MenuItem value={60}>60 Days</MenuItem>
                                        <MenuItem value={90}>90 Days</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        }
                    />
                    <CardContent>
                        <Suspense fallback={<Skeleton height={300} />}>
                            <OrderChart
                                orders={recentOrders}
                                periodInDays={historyDuration}
                            />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
            <div style={styles.singleCol}>
                <PendingOrders orders={pendingOrders} />
            </div>
        </div>
    ) : (
        <>
            <Welcome />
            <div style={styles.flex}>
                <div style={styles.leftCol}>
                    <div style={styles.flex}>
                        <MonthlyRevenue value={revenue} />
                        <Spacer />
                        <NbNewOrders value={nbNewOrders} />
                    </div>
                    <div style={styles.singleCol}>
                        <Card>
                            <CardHeader
                                title={
                                    <Translate
                                        i18nKey="pos.dashboard.revenue_history"
                                        options={{
                                            smart_count: historyDuration,
                                        }}
                                    />
                                }
                                action={
                                    <Box sx={{ minWidth: 120, mt: 1 }}>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel id="history-duration-select-label-large">
                                                <Translate i18nKey="pos.dashboard.duration" />
                                            </InputLabel>
                                            <Select
                                                labelId="history-duration-select-label-large"
                                                value={historyDuration}
                                                label="Duration"
                                                onChange={
                                                    handleHistoryDurationChange
                                                }
                                            >
                                                <MenuItem value={30}>
                                                    30 Days
                                                </MenuItem>
                                                <MenuItem value={60}>
                                                    60 Days
                                                </MenuItem>
                                                <MenuItem value={90}>
                                                    90 Days
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                }
                            />
                            <CardContent>
                                <Suspense fallback={<Skeleton height={300} />}>
                                    <OrderChart
                                        orders={recentOrders}
                                        periodInDays={historyDuration}
                                    />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </div>
                    <div style={styles.singleCol}>
                        <PendingOrders orders={pendingOrders} />
                    </div>
                </div>
                <div style={styles.rightCol}>
                    <div style={styles.flex}>
                        <PendingReviews />
                        <Spacer />
                        <NewCustomers />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
