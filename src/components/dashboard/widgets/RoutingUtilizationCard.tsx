import React from 'react';
import { RoutingMetrics } from '../../../services/dashboard-service';
import { theme, colors } from '../../../theme';

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
        color: colors.error[600], 
        bgColor: colors.error[50],
        dotColor: colors.error[500]
      };
    } else if (metrics.averageTrayFill > 80 || metrics.averageConduitFill > 80) {
      return { 
        text: 'Near Capacity', 
        color: colors.warning[600], 
        bgColor: colors.warning[50],
        dotColor: colors.warning[500]
      };
    } else {
      return { 
        text: 'Optimal', 
        color: colors.success[600], 
        bgColor: colors.success[50],
        dotColor: colors.success[500]
      };
    }
  };

  const status = getUtilizationStatus();

  return (
    <div style={{
      backgroundColor: colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.sm,
      border: `1px solid ${colors.border.light}`,
      padding: theme.spacing[6]
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing[4]
      }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: colors.text.primary
        }}>
          Routing System
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          backgroundColor: colors.purple[100],
          borderRadius: theme.borderRadius.lg
        }}>
          <svg width="24" height="24" fill="none" stroke={colors.purple[600]} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>

      {/* Main Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        {/* Container Count */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              {totalContainers}
            </span>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.text.tertiary
            }}>
              containers
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[4],
            fontSize: theme.typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: theme.spacing[1]
          }}>
            <span>{metrics.totalTrays} trays</span>
            <span>•</span>
            <span>{metrics.totalConduits} conduits</span>
          </div>
        </div>

        {/* Average Fill Percentages */}
        <div style={{
          borderTop: `1px solid ${colors.border.light}`,
          paddingTop: theme.spacing[3],
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing[2]
        }}>
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