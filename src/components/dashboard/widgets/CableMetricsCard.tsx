import React from 'react';
import { CableMetrics } from '../../../services/dashboard-service';

interface CableMetricsCardProps {
  metrics: CableMetrics;
}

const CableMetricsCard: React.FC<CableMetricsCardProps> = ({ metrics }) => {
  const getVoltageDropStatus = (percentage: number) => {
    if (percentage <= 3) {
      return { text: 'Good', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (percentage <= 5) {
      return { text: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { text: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  const voltageDropStatus = getVoltageDropStatus(metrics.averageVoltageDropPercentage);
  const issueCount = metrics.cablesWithWarnings + metrics.cablesWithErrors;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cable System</h3>
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="space-y-4">
        {/* Total Cables */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{metrics.totalCables}</span>
            <span className="text-sm text-gray-500">cables</span>
          </div>
          <div className="text-sm text-gray-600">Total system cables</div>
        </div>

        {/* Total Length */}
        <div className="border-t pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {metrics.totalLength.toFixed(0)}
            </span>
            <span className="text-sm text-gray-500">ft</span>
          </div>
          <div className="text-sm text-gray-600">Total cable length</div>
        </div>

        {/* Average Voltage Drop */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-gray-900">
                  {metrics.averageVoltageDropPercentage.toFixed(2)}%
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${voltageDropStatus.bgColor} ${voltageDropStatus.color}`}>
                  {voltageDropStatus.text}
                </span>
              </div>
              <div className="text-sm text-gray-600">Avg. voltage drop</div>
            </div>
          </div>
        </div>

        {/* Issues Count */}
        {issueCount > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">{issueCount}</span>
                <div className="flex items-center gap-1">
                  {metrics.cablesWithWarnings > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {metrics.cablesWithWarnings} warnings
                    </span>
                  )}
                  {metrics.cablesWithErrors > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {metrics.cablesWithErrors} errors
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">Cables requiring attention</div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">System Status</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              issueCount === 0 
                ? 'bg-green-500' 
                : metrics.cablesWithErrors > 0 
                  ? 'bg-red-500' 
                  : 'bg-yellow-500'
            }`}></div>
            <span className={`font-medium ${
              issueCount === 0 
                ? 'text-green-600' 
                : metrics.cablesWithErrors > 0 
                  ? 'text-red-600' 
                  : 'text-yellow-600'
            }`}>
              {issueCount === 0 ? 'Healthy' : metrics.cablesWithErrors > 0 ? 'Critical' : 'Warning'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CableMetricsCard;