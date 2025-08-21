import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UtilizationData {
  tag: string;
  fillPercentage: number;
  capacity: number;
}

interface FillDistributionChartProps {
  trayUtilization: UtilizationData[];
  conduitUtilization: UtilizationData[];
}

interface ChartDataPoint {
  name: string;
  fillPercentage: number;
  type: 'Tray' | 'Conduit';
  status: 'Good' | 'Warning' | 'Critical' | 'Overfilled';
}

const FillDistributionChart: React.FC<FillDistributionChartProps> = ({ 
  trayUtilization, 
  conduitUtilization 
}) => {
  const chartData = useMemo(() => {
    const getStatus = (fill: number, maxFill: number = 50): 'Good' | 'Warning' | 'Critical' | 'Overfilled' => {
      if (fill > maxFill) return 'Overfilled';
      if (fill > maxFill * 0.9) return 'Critical';
      if (fill > maxFill * 0.7) return 'Warning';
      return 'Good';
    };

    const trayData: ChartDataPoint[] = trayUtilization.map(tray => ({
      name: tray.tag,
      fillPercentage: tray.fillPercentage,
      type: 'Tray' as const,
      status: getStatus(tray.fillPercentage, 50) // Trays typically 50% max
    }));

    const conduitData: ChartDataPoint[] = conduitUtilization.map(conduit => ({
      name: conduit.tag,
      fillPercentage: conduit.fillPercentage,
      type: 'Conduit' as const,
      status: getStatus(conduit.fillPercentage, 40) // Conduits typically 40% max
    }));

    // Combine and sort by fill percentage
    return [...trayData, ...conduitData]
      .sort((a, b) => b.fillPercentage - a.fillPercentage)
      .slice(0, 20); // Show top 20 for readability
  }, [trayUtilization, conduitUtilization]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-gray-600">Type: {data.type}</p>
          <p className="text-sm">
            Fill: <span className="font-medium">{data.fillPercentage.toFixed(1)}%</span>
          </p>
          <p className="text-sm">
            Status: <span className={`font-medium ${
              data.status === 'Good' ? 'text-green-600' :
              data.status === 'Warning' ? 'text-yellow-600' :
              data.status === 'Critical' ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {data.status}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (entry: ChartDataPoint) => {
    if (entry.status === 'Overfilled') return '#ef4444'; // red-500
    if (entry.status === 'Critical') return '#f97316'; // orange-500
    if (entry.status === 'Warning') return '#eab308'; // yellow-500
    return entry.type === 'Tray' ? '#3b82f6' : '#8b5cf6'; // blue-500 or purple-500
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z" />
          </svg>
          <p>No routing containers found</p>
          <p className="text-sm">Add trays and conduits to see utilization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
            fontSize={12}
          />
          <YAxis 
            label={{ value: 'Fill Percentage (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="fillPercentage" 
            fill={(entry: any) => getBarColor(entry)}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Good (&lt; 70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Warning (70-90%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Critical (&gt; 90%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Overfilled</span>
        </div>
      </div>
    </div>
  );
};

export default FillDistributionChart;