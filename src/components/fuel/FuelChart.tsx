"use client";

import { FuelRecord } from "@prisma/client";
import { format } from "date-fns";
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

interface FuelChartProps {
    records: FuelRecord[];
}

export function FuelChart({ records }: FuelChartProps) {
    const { theme, systemTheme } = useTheme();
    // Default to dark if undefined to prevent hydration mismatch flashes, 
    // or just handle it. We'll use a safe check.
    const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

    const strokeColor = isDark ? "#60a5fa" : "#3b82f6"; // blue-400 : blue-500
    const gridColor = isDark ? "#334155" : "#e2e8f0"; // slate-700 : slate-200
    const textColor = isDark ? "#94a3b8" : "#64748b"; // slate-400 : slate-500
    const dotFill = isDark ? "#0f172a" : "#ffffff";
    const avgColor = "#16a34a"; // green-600

    // Records are sorted newest to oldest. We want oldest to newest for the chart.
    const sortedRecords = [...records].reverse();
    
    const chartData = [];
    let validGallons = 0;
    let validDistance = 0;
    
    for (let i = 0; i < sortedRecords.length; i++) {
        const record = sortedRecords[i];
        let mpg = null;
        
        if (i > 0) {
            const prevRecord = sortedRecords[i - 1]; // prevRecord is older
            if (record.isFullTank && prevRecord.isFullTank && !(record as any).missedPrevious) {
                const distance = record.usageAtFill - prevRecord.usageAtFill;
                if (distance > 0) {
                    mpg = Number((distance / record.gallons).toFixed(2));
                    validGallons += record.gallons;
                    validDistance += distance;
                }
            }
        }

        if (mpg !== null) {
            chartData.push({
                date: format(new Date(record.date), "MMM d"),
                mpg: mpg,
                fullDate: format(new Date(record.date), "MMM d, yyyy"),
                timestamp: new Date(record.date).getTime()
            });
        }
    }

    if (chartData.length === 0) {
        return null;
    }

    // Calculate overall average MPG for the ReferenceLine
    const avgMpg = validGallons > 0 ? Number((validDistance / validGallons).toFixed(1)) : 0;

    // Calculate domain with a slight buffer
    const minMpg = Math.min(...chartData.map(d => d.mpg), avgMpg || Infinity);
    const maxMpg = Math.max(...chartData.map(d => d.mpg), avgMpg || -Infinity);
    const buffer = (maxMpg - minMpg) * 0.2 || 2; // 20% buffer or 2 if flat

    // Time scale: show last 1 month by default in the brush
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoMs = oneMonthAgo.getTime();
    
    // Find index of the first record within the last month
    let startIndex = chartData.findIndex(d => d.timestamp >= oneMonthAgoMs);
    if (startIndex === -1) startIndex = Math.max(0, chartData.length - 10); // fallback to last 10 if none in last month

    return (
        <Card className="mb-6 shadow-sm border-muted/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fuel Economy Trend
                </CardTitle>
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
                            domain={[Math.max(0, minMpg - buffer), maxMpg + buffer]}
                            tickFormatter={(value) => value.toFixed(0)}
                        />
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-popover text-popover-foreground border shadow-md rounded-lg p-3">
                                            <p className="text-xs text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
                                            <p className="font-bold flex items-center" style={{ color: strokeColor }}>
                                                {payload[0].value} <span className="text-xs ml-1 font-normal text-muted-foreground">MPG</span>
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        {avgMpg > 0 && (
                            <ReferenceLine 
                                y={avgMpg} 
                                stroke={avgColor} 
                                strokeDasharray="4 4" 
                                strokeWidth={2}
                                label={{ position: 'insideTopLeft', value: `AVG: ${avgMpg}`, fill: avgColor, fontSize: 10, fontWeight: 'bold' }}
                            />
                        )}
                        <Line 
                            type="monotone" 
                            dataKey="mpg" 
                            name="MPG"
                            stroke={strokeColor} 
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: dotFill, stroke: strokeColor }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
                            animationDuration={1000}
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
