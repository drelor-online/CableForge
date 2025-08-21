import React, { useMemo } from 'react';
import { Cable, Tray, Conduit, Load, IOPoint, PLCCard, Project } from '../../types';
import { dashboardService, DashboardData } from '../../services/dashboard-service';
import CableMetricsCard from './widgets/CableMetricsCard';
import RoutingUtilizationCard from './widgets/RoutingUtilizationCard';
import LoadManagementCard from './widgets/LoadManagementCard';
import IOSystemCard from './widgets/IOSystemCard';
import FillDistributionChart from './charts/FillDistributionChart';
import CableFunctionChart from './charts/CableFunctionChart';
import VoltageDropChart from './charts/VoltageDropChart';
import DashboardExportMenu from './DashboardExportMenu';

interface EngineeringDashboardProps {
  project?: Project;
  cables: Cable[];
  trays: Tray[];
  conduits: Conduit[];
  loads: Load[];
  ioPoints: IOPoint[];
  plcCards: PLCCard[];
}

const EngineeringDashboard: React.FC<EngineeringDashboardProps> = ({
  project,
  cables,
  trays,
  conduits,
  loads,
  ioPoints,
  plcCards
}) => {
  // Generate dashboard data
  const dashboardData: DashboardData = useMemo(() => {
    return dashboardService.generateDashboardData(
      cables,
      trays, 
      conduits,
      loads,
      ioPoints,
      plcCards
    );
  }, [cables, trays, conduits, loads, ioPoints, plcCards]);

  const formatLastUpdated = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Engineering Dashboard</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>
                <strong>Project:</strong> {project?.name || 'Untitled Project'}
              </span>
              <span>•</span>
              <span>
                <strong>Last Updated:</strong> {formatLastUpdated(dashboardData.lastUpdated)}
              </span>
            </div>
          </div>
          
          {/* Export Menu */}
          <DashboardExportMenu 
            dashboardData={dashboardData}
            projectName={project?.name || 'Untitled Project'}
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <CableMetricsCard metrics={dashboardData.cables} />
        <RoutingUtilizationCard metrics={dashboardData.routing} />
        <LoadManagementCard metrics={dashboardData.loads} />
        <IOSystemCard metrics={dashboardData.io} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Fill Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Routing Capacity Utilization
          </h3>
          <FillDistributionChart 
            trayUtilization={dashboardData.routing.trayUtilization}
            conduitUtilization={dashboardData.routing.conduitUtilization}
          />
        </div>

        {/* Cable Function Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cable Function Distribution
          </h3>
          <CableFunctionChart cablesByFunction={dashboardData.cables.cablesByFunction} />
        </div>
      </div>

      {/* Voltage Drop Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Voltage Drop Analysis
        </h3>
        <VoltageDropChart cables={cables} />
      </div>

      {/* Summary Statistics Table */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Cable System */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Cable System</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cables:</span>
                <span className="font-medium">{dashboardData.cables.totalCables}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Length:</span>
                <span className="font-medium">{dashboardData.cables.totalLength.toFixed(1)} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Length:</span>
                <span className="font-medium">{dashboardData.cables.averageLength.toFixed(1)} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. V-Drop:</span>
                <span className="font-medium">{dashboardData.cables.averageVoltageDropPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Routing System */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Routing System</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Trays:</span>
                <span className="font-medium">{dashboardData.routing.totalTrays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conduits:</span>
                <span className="font-medium">{dashboardData.routing.totalConduits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Tray Fill:</span>
                <span className="font-medium">{dashboardData.routing.averageTrayFill.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Conduit Fill:</span>
                <span className="font-medium">{dashboardData.routing.averageConduitFill.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Load System */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Load System</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Loads:</span>
                <span className="font-medium">{dashboardData.loads.totalLoads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connected Load:</span>
                <span className="font-medium">{dashboardData.loads.totalConnectedLoad.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Demand Load:</span>
                <span className="font-medium">{dashboardData.loads.totalDemandLoad.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Power Factor:</span>
                <span className="font-medium">{dashboardData.loads.averagePowerFactor.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* I/O System */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">I/O System</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">I/O Points:</span>
                <span className="font-medium">{dashboardData.io.totalIOPoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PLCs:</span>
                <span className="font-medium">{dashboardData.io.plcUtilization.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unassigned:</span>
                <span className="font-medium">{dashboardData.io.unassignedPoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. PLC Util:</span>
                <span className="font-medium">
                  {dashboardData.io.plcUtilization.length > 0 
                    ? (dashboardData.io.plcUtilization.reduce((sum, plc) => sum + plc.utilization, 0) / dashboardData.io.plcUtilization.length).toFixed(1)
                    : '0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineeringDashboard;