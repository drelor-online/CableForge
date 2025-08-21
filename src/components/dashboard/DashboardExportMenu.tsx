import React, { useState, useCallback } from 'react';
import { DashboardData } from '../../services/dashboard-service';
import { useUI } from '../../contexts/UIContext';

interface DashboardExportMenuProps {
  dashboardData: DashboardData;
  projectName: string;
}

const DashboardExportMenu: React.FC<DashboardExportMenuProps> = ({ 
  dashboardData, 
  projectName 
}) => {
  const { showSuccess, showError } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportData = {
        project: projectName,
        timestamp: dashboardData.lastUpdated.toISOString(),
        metrics: dashboardData
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_dashboard_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Dashboard data exported successfully');
      setIsOpen(false);
    } catch (error) {
      showError(`Failed to export dashboard data: ${error}`);
    } finally {
      setIsExporting(false);
    }
  }, [dashboardData, projectName, showSuccess, showError]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const csvLines = [
        'Metric Category,Metric Name,Value,Unit',
        `Cable System,Total Cables,${dashboardData.cables.totalCables},count`,
        `Cable System,Total Length,${dashboardData.cables.totalLength.toFixed(1)},ft`,
        `Cable System,Average Length,${dashboardData.cables.averageLength.toFixed(1)},ft`,
        `Cable System,Average Voltage Drop,${dashboardData.cables.averageVoltageDropPercentage.toFixed(2)},%`,
        `Cable System,Cables with Warnings,${dashboardData.cables.cablesWithWarnings},count`,
        `Cable System,Cables with Errors,${dashboardData.cables.cablesWithErrors},count`,
        `Routing System,Total Trays,${dashboardData.routing.totalTrays},count`,
        `Routing System,Total Conduits,${dashboardData.routing.totalConduits},count`,
        `Routing System,Average Tray Fill,${dashboardData.routing.averageTrayFill.toFixed(1)},%`,
        `Routing System,Average Conduit Fill,${dashboardData.routing.averageConduitFill.toFixed(1)},%`,
        `Routing System,Overfilled Trays,${dashboardData.routing.overfilledTrays},count`,
        `Routing System,Overfilled Conduits,${dashboardData.routing.overfilledConduits},count`,
        `Routing System,Unassigned Cables,${dashboardData.routing.unassignedCables},count`,
        `Load System,Total Loads,${dashboardData.loads.totalLoads},count`,
        `Load System,Total Connected Load,${dashboardData.loads.totalConnectedLoad.toFixed(1)},kW`,
        `Load System,Total Demand Load,${dashboardData.loads.totalDemandLoad.toFixed(1)},kW`,
        `Load System,Average Power Factor,${dashboardData.loads.averagePowerFactor.toFixed(2)},ratio`,
        `Load System,Average Efficiency,${dashboardData.loads.averageEfficiency.toFixed(1)},%`,
        `I/O System,Total I/O Points,${dashboardData.io.totalIOPoints},count`,
        `I/O System,Unassigned Points,${dashboardData.io.unassignedPoints},count`,
        `I/O System,Number of PLCs,${dashboardData.io.plcUtilization.length},count`,
      ];

      const csvString = csvLines.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_dashboard_metrics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Dashboard metrics exported to CSV');
      setIsOpen(false);
    } catch (error) {
      showError(`Failed to export CSV: ${error}`);
    } finally {
      setIsExporting(false);
    }
  }, [dashboardData, projectName, showSuccess, showError]);

  const handleCopyToClipboard = useCallback(async () => {
    setIsExporting(true);
    try {
      const summary = [
        `${projectName} - Dashboard Summary`,
        `Generated: ${dashboardData.lastUpdated.toLocaleDateString()}`,
        '',
        'CABLE SYSTEM:',
        `• Total Cables: ${dashboardData.cables.totalCables}`,
        `• Total Length: ${dashboardData.cables.totalLength.toFixed(1)} ft`,
        `• Average Voltage Drop: ${dashboardData.cables.averageVoltageDropPercentage.toFixed(2)}%`,
        `• Issues: ${dashboardData.cables.cablesWithWarnings} warnings, ${dashboardData.cables.cablesWithErrors} errors`,
        '',
        'ROUTING SYSTEM:',
        `• Containers: ${dashboardData.routing.totalTrays} trays, ${dashboardData.routing.totalConduits} conduits`,
        `• Average Fill: ${dashboardData.routing.averageTrayFill.toFixed(1)}% trays, ${dashboardData.routing.averageConduitFill.toFixed(1)}% conduits`,
        `• Overfilled: ${dashboardData.routing.overfilledTrays + dashboardData.routing.overfilledConduits} containers`,
        `• Unassigned: ${dashboardData.routing.unassignedCables} cables`,
        '',
        'LOAD SYSTEM:',
        `• Total Loads: ${dashboardData.loads.totalLoads}`,
        `• Connected Load: ${dashboardData.loads.totalConnectedLoad.toFixed(1)} kW`,
        `• Demand Load: ${dashboardData.loads.totalDemandLoad.toFixed(1)} kW`,
        `• Average Power Factor: ${dashboardData.loads.averagePowerFactor.toFixed(2)}`,
        '',
        'I/O SYSTEM:',
        `• I/O Points: ${dashboardData.io.totalIOPoints}`,
        `• PLCs: ${dashboardData.io.plcUtilization.length}`,
        `• Unassigned: ${dashboardData.io.unassignedPoints} points`
      ].join('\n');

      await navigator.clipboard.writeText(summary);
      showSuccess('Dashboard summary copied to clipboard');
      setIsOpen(false);
    } catch (error) {
      showError(`Failed to copy to clipboard: ${error}`);
    } finally {
      setIsExporting(false);
    }
  }, [dashboardData, projectName, showSuccess, showError]);

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        disabled={isExporting}
      >
        {isExporting ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        Export Dashboard
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1">
            <button
              onClick={handleCopyToClipboard}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              disabled={isExporting}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Summary to Clipboard
            </button>
            
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              disabled={isExporting}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Metrics to CSV
            </button>
            
            <button
              onClick={handleExportJSON}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              disabled={isExporting}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export Full Data to JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardExportMenu;