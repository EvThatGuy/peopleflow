'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function HeadcountChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="hc-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(165 65% 25%)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="hsl(165 65% 25%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          stroke="hsl(220 9% 46%)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(220 9% 46%)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ stroke: 'hsl(220 13% 88%)', strokeDasharray: 3 }}
          contentStyle={{
            background: 'hsl(36 33% 99%)',
            border: '1px solid hsl(220 13% 88%)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 12,
          }}
          labelStyle={{ color: 'hsl(220 9% 46%)', fontSize: 11 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(165 65% 25%)"
          strokeWidth={2}
          fill="url(#hc-gradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
