"use client";

import { useState } from "react";
import { FuelRecord } from "@prisma/client";
import { formatUtcDate } from "@/lib/utils";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Brush,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";

type Metric = "mpg" | "price" | "cpm";

const METRICS: { key: Metric; label: string; unit: string }[] = [
    { key: "mpg",   label: "MPG",        unit: "mpg"  },
    { key: "price", label: "Fuel Price",  unit: "$/gal" },
    { key: "cpm",   label: "Cost / Mile", unit: "$/mi" },
];

interface FuelChartProps {
    records: FuelRecord[];
}

export function FuelChart({ records }: FuelChartProps) {
    const [metric, setMetric] = useState<Metric>("mpg");
    const { theme, systemTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

    const strokeColor = isDark ? "#60a5fa" : "#3b82f6";
    const gridColor   = isDark ? "#334155" : "#e2e8f0";
    const textColor   = isDark ? "#94a3b8" : "#64748b";
    const dotFill     = isDark ? "#0f172a" : "#ffffff";
    const avgColor    = "#16a34a";
    const limitColor  = isDark ? "#ef4444" : "#dc2626";

    const sortedRecords = [...records].reverse();

    let validGallons = 0;
    let validDistance = 0;
    const chartData: { date: string; fullDate: string; timestamp: number; mpg: number; price: number; cpm: number }[] = [];

    for (let i = 1; i < sortedRecords.length; i++) {
        const cur  = sortedRecords[i];
        const prev = sortedRecords[i - 1];

        if (cur.isFullTank && prev.isFullTank && !(cur as any).missedPrevious) {
            const distance = cur.usageAtFill - prev.usageAtFill;
            if (distance > 0) {
                const mpg = distance / cur.gallons;
                validGallons  += cur.gallons;
                validDistance += distance;

                chartData.push({
                    date:      formatUtcDate(cur.date, "MMM d"),
                    fullDate:  formatUtcDate(cur.date),
                    timestamp: new Date(cur.date).getTime(),
                    mpg:       Number(mpg.toFixed(2)),
                    price:     Number(cur.pricePerGallon.toFixed(3)),
                    cpm:       Number((cur.pricePerGallon / mpg).toFixed(4)),
                });
            }
        }
    }

    if (chartData.length === 0) return null;

    // Averages: volume-weighted for MPG; arithmetic mean for price/cpm
    const avgMpg   = validGallons > 0 ? validDistance / validGallons : 0;
    const avgPrice = chartData.reduce((s, d) => s + d.price, 0) / chartData.length;
    const avgCpm   = avgMpg > 0 ? avgPrice / avgMpg : 0;
    const avgMap: Record<Metric, number> = { mpg: avgMpg, price: avgPrice, cpm: avgCpm };
    const avg = avgMap[metric];

    // UCL / LCL from the last 10 data points of the selected metric
    let ucl: number | null = null;
    let lcl: number | null = null;
    if (chartData.length >= 2) {
        const vals = chartData.slice(-10).map(d => d[metric]);
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const stdDev = Math.sqrt(vals.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / (vals.length - 1));
        ucl = mean + 3 * stdDev;
        lcl = Math.max(0, mean - 3 * stdDev);
    }

    const vals   = chartData.map(d => d[metric]);
    const minVal = Math.min(...vals, lcl ?? Infinity);
    const maxVal = Math.max(...vals, ucl ?? -Infinity);
    const buffer = (maxVal - minVal) * 0.2 || (metric === "mpg" ? 2 : 0.05);

    const oneMonthAgoMs = new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime();
    let startIndex = chartData.findIndex(d => d.timestamp >= oneMonthAgoMs);
    if (startIndex === -1) startIndex = Math.max(0, chartData.length - 10);

    const isMoney = metric !== "mpg";
    const fmt     = (v: number) => isMoney ? `$${v.toFixed(3)}` : v.toFixed(1);
    const fmtTick = (v: number) => isMoney ? `$${v.toFixed(2)}` : v.toFixed(0);
    const unitLabel = METRICS.find(m => m.key === metric)!.unit;

    return (
        <Card className="mb-6 shadow-sm border-muted/60">
            <CardHeader className="pb-2 space-y-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fuel Trend
                </CardTitle>
                <div className="flex items-center bg-muted rounded-lg p-[3px]">
                    {METRICS.map(m => (
                        <button
                            key={m.key}
                            onClick={() => setMetric(m.key)}
                            className={`flex-1 px-2 py-1 text-sm font-medium rounded-md border whitespace-nowrap transition-all ${
                                metric === m.key
                                    ? "bg-background text-foreground border-transparent shadow-sm dark:bg-input/30 dark:border-input dark:text-foreground"
                                    : "border-transparent text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="h-[280px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke={textColor}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke={textColor}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[Math.max(0, minVal - buffer), maxVal + buffer]}
                            tickFormatter={fmtTick}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-popover text-popover-foreground border shadow-md rounded-lg p-3">
                                            <p className="text-xs text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
                                            <p className="font-bold flex items-center gap-1" style={{ color: strokeColor }}>
                                                {fmt(Number(payload[0].value))}
                                                <span className="text-xs font-normal text-muted-foreground">{unitLabel}</span>
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        {avg > 0 && (
                            <ReferenceLine
                                y={avg}
                                stroke={avgColor}
                                strokeDasharray="4 4"
                                strokeWidth={2}
                                label={{ position: "insideTopLeft", value: `AVG: ${fmt(avg)}`, fill: avgColor, fontSize: 10, fontWeight: "bold" }}
                            />
                        )}
                        {ucl !== null && (
                            <ReferenceLine
                                y={ucl}
                                stroke={limitColor}
                                strokeDasharray="3 3"
                                strokeOpacity={0.5}
                                label={{ position: "insideTopLeft", value: `UCL: ${fmt(ucl)}`, fill: limitColor, fontSize: 10, opacity: 0.8 }}
                            />
                        )}
                        {lcl !== null && lcl > 0 && (
                            <ReferenceLine
                                y={lcl}
                                stroke={limitColor}
                                strokeDasharray="3 3"
                                strokeOpacity={0.5}
                                label={{ position: "insideBottomLeft", value: `LCL: ${fmt(lcl)}`, fill: limitColor, fontSize: 10, opacity: 0.8 }}
                            />
                        )}
                        <Line
                            key={metric}
                            type="monotone"
                            dataKey={metric}
                            stroke={strokeColor}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: dotFill, stroke: strokeColor }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
                            animationDuration={400}
                            isAnimationActive={true}
                        />
                        <Brush
                            dataKey="date"
                            height={30}
                            stroke={textColor}
                            fill={isDark ? "#1e293b" : "#f8fafc"}
                            tickFormatter={() => ""}
                            startIndex={startIndex}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
