import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Cable } from '../../../types';

interface VoltageDropChartProps {
  cables: Cable[];
}

interface ScatterDataPoint {
  x: number; // length
  y: number; // voltage drop %
  tag: string;
  function: string;
  voltage: number;
  status: 'Good' | 'Warning' | 'Critical';
}

const VoltageDropChart: React.FC<VoltageDropChartProps> = ({ cables }) => {
  const { chartData, maxLength, maxVoltageDrop } = useMemo(() => {
    const validCables = cables.filter(cable => 
      cable.length && 
      cable.length > 0 && 
      cable.voltageDropPercentage !== undefined && 
      cable.voltageDropPercentage >= 0
    );

    const data: ScatterDataPoint[] = validCables.map(cable => {
      const voltageDrop = cable.voltageDropPercentage || 0;
      let status: 'Good' | 'Warning' | 'Critical';
      
      if (voltageDrop <= 3) {
        status = 'Good';
      } else if (voltageDrop <= 5) {
        status = 'Warning';
      } else {
        status = 'Critical';
      }

      return {
        x: cable.length || 0,
        y: voltageDrop,
        tag: cable.tag,
        function: cable.function || 'Unknown',
        voltage: cable.voltage || 0,
        status
      };
    });

    const maxLen = Math.max(...data.map(d => d.x), 0);
    const maxVDrop = Math.max(...data.map(d => d.y), 6); // At least 6% for chart scaling

    return { 
      chartData: data, 
      maxLength: maxLen,
      maxVoltageDrop: maxVDrop
    };
  }, [cables]);

  const getPointColor = (status: string) => {
    switch (status) {
      case 'Good': return '#10b981'; // emerald-500
      case 'Warning': return '#f59e0b'; // amber-500
      case 'Critical': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.tag}</p>
          <p className="text-sm text-gray-600">Function: {data.function}</p>
          <p className="text-sm">
            Length: <span className="font-medium">{data.x.toFixed(1)} ft</span>
          </p>
          <p className="text-sm">
            Voltage Drop: <span className="font-medium">{data.y.toFixed(2)}%</span>
          </p>
          <p className="text-sm">
            Voltage: <span className="font-medium">{data.voltage}V</span>
          </p>
          <p className="text-sm">
            Status: <span className={`font-medium ${
              data.status === 'Good' ? 'text-green-600' :
              data.status === 'Warning' ? 'text-yellow-600' :
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

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p>No voltage drop data available</p>
          <p className="text-sm">Cables need length and voltage drop calculations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 60,
            left: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Length"
            unit="ft"
            domain={[0, maxLength * 1.1]}
            label={{ value: 'Cable Length (ft)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Voltage Drop"
            unit="%"
            domain={[0, Math.max(maxVoltageDrop * 1.1, 6)]}
            label={{ value: 'Voltage Drop (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Reference lines for code limits */}
          <ReferenceLine y={3} stroke="#f59e0b" strokeDasharray="5 5" />
          <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="5 5" />
          
          {/* Good cables */}
          <Scatter
            data={chartData.filter(d => d.status === 'Good')}
            fill="#10b981"
            name="Good (≤ 3%)"
          />
          
          {/* Warning cables */}
          <Scatter
            data={chartData.filter(d => d.status === 'Warning')}
            fill="#f59e0b"
            name="Warning (3-5%)"
          />
          
          {/* Critical cables */}
          <Scatter
            data={chartData.filter(d => d.status === 'Critical')}
            fill="#ef4444"
            name="Critical (> 5%)"
          />
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend and Reference Info */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Good (≤ 3%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Warning (3-5%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Critical (&gt; 5%)</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-600">
          <p>Reference lines show NEC recommended voltage drop limits: 3% (branch circuits), 5% (feeders)</p>
        </div>
      </div>
    </div>
  );
};

export default VoltageDropChart;