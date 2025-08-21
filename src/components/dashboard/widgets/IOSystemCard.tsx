import React from 'react';
import { IOMetrics } from '../../../services/dashboard-service';

interface IOSystemCardProps {
  metrics: IOMetrics;
}

const IOSystemCard: React.FC<IOSystemCardProps> = ({ metrics }) => {
  const avgPlcUtilization = metrics.plcUtilization.length > 0
    ? metrics.plcUtilization.reduce((sum, plc) => sum + plc.utilization, 0) / metrics.plcUtilization.length
    : 0;

  const getIOStatus = () => {
    if (metrics.unassignedPoints > 0) {
      return { 
        text: 'Incomplete', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100',
        dotColor: 'bg-yellow-500'
      };
    } else if (avgPlcUtilization > 90) {
      return { 
        text: 'Near Capacity', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100',
        dotColor: 'bg-orange-500'
      };
    } else {
      return { 
        text: 'Configured', 
        color: 'text-green-600', 
        bgColor: 'bg-green-100',
        dotColor: 'bg-green-500'
      };
    }
  };

  const status = getIOStatus();
  const totalChannels = metrics.plcUtilization.reduce((sum, plc) => sum + plc.totalChannels, 0);
  const usedChannels = metrics.plcUtilization.reduce((sum, plc) => sum + plc.usedChannels, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">I/O System</h3>
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="space-y-4">
        {/* Total I/O Points */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{metrics.totalIOPoints}</span>
            <span className="text-sm text-gray-500">I/O points</span>
          </div>
          <div className="text-sm text-gray-600">Total system I/O</div>
        </div>

        {/* PLC Information */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">PLCs:</span>
            <span className="text-sm font-medium text-gray-900">
              {metrics.plcUtilization.length}
            </span>
          </div>
          
          {totalChannels > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Channel Usage:</span>
              <span className="text-sm font-medium text-gray-900">
                {usedChannels} / {totalChannels}
              </span>
            </div>
          )}

          {avgPlcUtilization > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Utilization:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      avgPlcUtilization > 90 ? 'bg-red-500' : 
                      avgPlcUtilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(avgPlcUtilization, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right">
                  {avgPlcUtilization.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* I/O Type Breakdown */}
        {Object.keys(metrics.pointsByType).length > 0 && (
          <div className="border-t pt-3">
            <div className="text-sm text-gray-600 mb-2">I/O Types:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(metrics.pointsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span className="text-gray-600">{type}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unassigned Points */}
        {metrics.unassignedPoints > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Unassigned:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {metrics.unassignedPoints} points
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">I/O Status</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.dotColor}`}></div>
            <span className={`font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSystemCard;