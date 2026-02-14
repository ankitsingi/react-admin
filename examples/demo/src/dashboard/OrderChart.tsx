import * as React from 'react';
import * as echarts from 'echarts/core';
// Import bar charts, all suffixed with Chart
import { LineChart } from 'echarts/charts';

// Import the title, tooltip, rectangular coordinate system, dataset and transform components
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
} from 'echarts/components';
// Features like Universal Transition and Label Layout
import { LabelLayout, UniversalTransition } from 'echarts/features';

// Import the Canvas renderer
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { SVGRenderer } from 'echarts/renderers';

import { format, subDays, addDays } from 'date-fns';

import { Order } from '../types';
import type {
    DatasetComponentOption,
    GridComponentOption,
    LineSeriesOption,
    TitleComponentOption,
    TooltipComponentOption,
} from 'echarts';

// Create an Option type with only the required components and charts via ComposeOption
type ECOption = echarts.ComposeOption<
    | LineSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | GridComponentOption
    | DatasetComponentOption
>;

echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LineChart,
    LabelLayout,
    UniversalTransition,
    SVGRenderer,
]);

const dateFormatter = (date: number): string =>
    new Date(date).toLocaleDateString();

const aggregateOrdersByDay = (orders: Order[]): { [key: string]: number } =>
    orders
        .filter((order: Order) => order.status !== 'cancelled')
        .reduce(
            (acc, curr) => {
                const day = format(curr.date, 'yyyy-MM-dd');
                if (!acc[day]) {
                    acc[day] = 0;
                }
                acc[day] += curr.total;
                return acc;
            },
            {} as { [key: string]: number }
        );

const getRevenuePerDay = (
    orders: Order[],
    periodInDays: number
): TotalByDay[] => {
    const daysWithRevenue = aggregateOrdersByDay(orders);
    const lastDays = Array.from({ length: periodInDays }, (_, i) =>
        subDays(new Date(), i)
    );

    return lastDays.map(date => ({
        date: date.getTime(),
        total: daysWithRevenue[format(date, 'yyyy-MM-dd')] || 0,
    }));
};

const OrderChart = (props: { orders?: Order[]; periodInDays: number }) => {
    const { orders, periodInDays } = props;
    const chartRef = React.useRef<HTMLDivElement>(null);
    const chartInstance = React.useRef<echarts.ECharts | null>(null);

    React.useEffect(() => {
        if (!orders) return;
        // Initialize chart
        if (chartRef.current) {
            if (!chartInstance.current) {
                chartInstance.current = echarts.init(chartRef.current);
            }

            const periodStart = subDays(new Date(), periodInDays);
            const revenueData = getRevenuePerDay(orders, periodInDays);

            // Configure the chart
            const option: ECOption = {
                xAxis: {
                    type: 'time',
                    min: addDays(periodStart, 1).getTime(),
                    max: new Date().getTime(),
                    axisLabel: {
                        formatter: (value: number) => dateFormatter(value),
                    },
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: (value: number) => `$${value}`,
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: [3, 4],
                            color: '#aaa',
                        },
                    },
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: (params: any) => {
                        const param = params[0];
                        return `${dateFormatter(param.value[0])}: ${new Intl.NumberFormat(
                            undefined,
                            {
                                style: 'currency',
                                currency: 'USD',
                            }
                        ).format(param.value[1])}`;
                    },
                    axisPointer: {
                        type: 'line',
                        lineStyle: {
                            type: [3, 3],
                        },
                    },
                },
                grid: {
                    left: '0%',
                    right: '1%',
                    bottom: '0%',
                    top: '2%',
                    containLabel: true,
                },
                series: [
                    {
                        name: 'Revenue',
                        type: 'line',
                        smooth: true,
                        smoothMonotone: 'x',
                        symbol: 'none',
                        sampling: 'average',
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(
                                0,
                                0,
                                0,
                                1,
                                [
                                    {
                                        offset: 0.05,
                                        color: 'rgba(136, 132, 216, 0.8)',
                                    },
                                    {
                                        offset: 0.95,
                                        color: 'rgba(136, 132, 216, 0)',
                                    },
                                ]
                            ),
                        },
                        lineStyle: {
                            color: '#8884d8',
                            width: 2,
                        },
                        data: revenueData.map(item => [item.date, item.total]),
                    },
                ],
            };

            // Apply the config
            chartInstance.current.setOption(option);
        }

        // Handle resize
        const handleResize = () => {
            chartInstance.current?.resize();
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, [orders, periodInDays]);

    return <div ref={chartRef} style={{ width: '100%', height: 300 }} />;
};

interface TotalByDay {
    date: number;
    total: number;
}

export default OrderChart;
