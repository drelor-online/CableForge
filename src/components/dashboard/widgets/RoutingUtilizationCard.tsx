import React from 'react';
import { RoutingMetrics } from '../../../services/dashboard-service';

interface RoutingUtilizationCardProps {
  metrics: RoutingMetrics;
}

const RoutingUtilizationCard: React.FC<RoutingUtilizationCardProps> = ({ metrics }) => {
  const overfilledCount = metrics.overfilledTrays + metrics.overfilledConduits;
  const totalContainers = metrics.totalTrays + metrics.totalConduits;
  const utilizationPercentage = totalContainers > 0 ? ((totalContainers - overfilledCount) / totalContainers) * 100 : 100;
  
  const getUtilizationStatus = () => {
    if (overfilledCount > 0) {
      return { 
        text: 'Overfilled', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        dotColor: 'bg-red-500'
      };
    } else if (metrics.averageTrayFill > 80 || metrics.averageConduitFill > 80) {
      return { 
        text: 'Near Capacity', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100',
        dotColor: 'bg-yellow-500'
      };
    } else {
      return { 
        text: 'Optimal', 
        color: 'text-green-600', 
        bgColor: 'bg-green-100',
        dotColor: 'bg-green-500'
      };
    }
  };

  const status = getUtilizationStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Routing System</h3>
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="space-y-4">
        {/* Container Count */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{totalContainers}</span>
            <span className="text-sm text-gray-500">containers</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span>{metrics.totalTrays} trays</span>
            <span>•</span>
            <span>{metrics.totalConduits} conduits</span>
          </div>
        </div>

        {/* Average Fill Percentages */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg. Tray Fill:</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(metrics.averageTrayFill, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-10 text-right">
                {metrics.averageTrayFill.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg. Conduit Fill:</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(metrics.averageConduitFill, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-10 text-right">
                {metrics.averageConduitFill.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Issues */}
        {(overfilledCount > 0 || metrics.unassignedCables > 0) && (
          <div className="border-t pt-3">
            <div className="space-y-2">
              {overfilledCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overfilled:</span>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {overfilledCount} containers
                    </span>
                  </div>
                </div>
              )}
              
              {metrics.unassignedCables > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unassigned:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {metrics.unassignedCables} cables
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Routing Status</span>
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

export default RoutingUtilizationCard;