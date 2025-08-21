import React from 'react';
import { LoadMetrics } from '../../../services/dashboard-service';

interface LoadManagementCardProps {
  metrics: LoadMetrics;
}

const LoadManagementCard: React.FC<LoadManagementCardProps> = ({ metrics }) => {
  const demandFactor = metrics.totalConnectedLoad > 0 
    ? (metrics.totalDemandLoad / metrics.totalConnectedLoad) * 100 
    : 0;

  const getLoadStatus = () => {
    if (metrics.averagePowerFactor < 0.8) {
      return { 
        text: 'Poor PF', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        dotColor: 'bg-red-500'
      };
    } else if (metrics.averagePowerFactor < 0.9) {
      return { 
        text: 'Fair PF', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100',
        dotColor: 'bg-yellow-500'
      };
    } else {
      return { 
        text: 'Good PF', 
        color: 'text-green-600', 
        bgColor: 'bg-green-100',
        dotColor: 'bg-green-500'
      };
    }
  };

  const status = getLoadStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Load Management</h3>
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="space-y-4">
        {/* Total Loads */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{metrics.totalLoads}</span>
            <span className="text-sm text-gray-500">loads</span>
          </div>
          <div className="text-sm text-gray-600">Total system loads</div>
        </div>

        {/* Power Metrics */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Connected Load:</span>
            <span className="text-sm font-medium text-gray-900">
              {metrics.totalConnectedLoad.toFixed(1)} kW
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Demand Load:</span>
            <span className="text-sm font-medium text-gray-900">
              {metrics.totalDemandLoad.toFixed(1)} kW
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Demand Factor:</span>
            <span className="text-sm font-medium text-gray-900">
              {demandFactor.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Power Factor */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg. Power Factor:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
              {metrics.averagePowerFactor.toFixed(2)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                metrics.averagePowerFactor >= 0.9 ? 'bg-green-500' : 
                metrics.averagePowerFactor >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(metrics.averagePowerFactor * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Efficiency */}
        {metrics.averageEfficiency > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Efficiency:</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.averageEfficiency.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Power Quality</span>
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

export default LoadManagementCard;