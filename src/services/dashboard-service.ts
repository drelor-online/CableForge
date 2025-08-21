/**
 * Dashboard Service - Data aggregation for Engineering Dashboard
 */

import { Cable, Tray, Conduit, Load, IOPoint, PLCCard } from '../types';

export interface CableMetrics {
  totalCables: number;
  totalLength: number;
  averageLength: number;
  averageVoltageDropPercentage: number;
  cablesWithWarnings: number;
  cablesWithErrors: number;
  cablesByFunction: Record<string, number>;
  cablesByVoltage: Record<string, number>;
}

export interface RoutingMetrics {
  totalTrays: number;
  totalConduits: number;
  averageTrayFill: number;
  averageConduitFill: number;
  overfilledTrays: number;
  overfilledConduits: number;
  unassignedCables: number;
  trayUtilization: Array<{ tag: string; fillPercentage: number; capacity: number }>;
  conduitUtilization: Array<{ tag: string; fillPercentage: number; capacity: number }>;
}

export interface LoadMetrics {
  totalLoads: number;
  totalConnectedLoad: number;
  totalDemandLoad: number;
  averagePowerFactor: number;
  averageEfficiency: number;
  loadsByType: Record<string, number>;
  loadDistribution: Array<{ range: string; count: number }>;
}

export interface IOMetrics {
  totalIOPoints: number;
  pointsByType: Record<string, number>;
  pointsBySignalType: Record<string, number>;
  plcUtilization: Array<{ plcName: string; usedChannels: number; totalChannels: number; utilization: number }>;
  unassignedPoints: number;
}

export interface DashboardData {
  cables: CableMetrics;
  routing: RoutingMetrics;
  loads: LoadMetrics;
  io: IOMetrics;
  lastUpdated: Date;
}

export class DashboardService {
  private static instance: DashboardService;

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Calculate comprehensive cable metrics
   */
  calculateCableMetrics(cables: Cable[]): CableMetrics {
    if (cables.length === 0) {
      return {
        totalCables: 0,
        totalLength: 0,
        averageLength: 0,
        averageVoltageDropPercentage: 0,
        cablesWithWarnings: 0,
        cablesWithErrors: 0,
        cablesByFunction: {},
        cablesByVoltage: {}
      };
    }

    const validLengths = cables.filter(c => c.length && c.length > 0);
    const validVoltageDrops = cables.filter(c => c.voltageDropPercentage && c.voltageDropPercentage > 0);
    
    const totalLength = validLengths.reduce((sum, cable) => sum + (cable.length || 0), 0);
    const averageLength = validLengths.length > 0 ? totalLength / validLengths.length : 0;
    
    const totalVoltageDrops = validVoltageDrops.reduce((sum, cable) => sum + (cable.voltageDropPercentage || 0), 0);
    const averageVoltageDropPercentage = validVoltageDrops.length > 0 ? totalVoltageDrops / validVoltageDrops.length : 0;

    // Count warnings and errors based on voltage drop thresholds
    const cablesWithWarnings = cables.filter(c => (c.voltageDropPercentage || 0) > 3 && (c.voltageDropPercentage || 0) <= 5).length;
    const cablesWithErrors = cables.filter(c => (c.voltageDropPercentage || 0) > 5).length;

    // Group by function
    const cablesByFunction: Record<string, number> = {};
    cables.forEach(cable => {
      const func = cable.function || 'Unknown';
      cablesByFunction[func] = (cablesByFunction[func] || 0) + 1;
    });

    // Group by voltage ranges
    const cablesByVoltage: Record<string, number> = {};
    cables.forEach(cable => {
      const voltage = cable.voltage || 0;
      let range: string;
      if (voltage === 0) {
        range = 'Not Specified';
      } else if (voltage <= 48) {
        range = '≤ 48V';
      } else if (voltage <= 120) {
        range = '49-120V';
      } else if (voltage <= 480) {
        range = '121-480V';
      } else if (voltage <= 4160) {
        range = '481-4160V';
      } else {
        range = '> 4160V';
      }
      cablesByVoltage[range] = (cablesByVoltage[range] || 0) + 1;
    });

    return {
      totalCables: cables.length,
      totalLength,
      averageLength,
      averageVoltageDropPercentage,
      cablesWithWarnings,
      cablesWithErrors,
      cablesByFunction,
      cablesByVoltage
    };
  }

  /**
   * Calculate routing utilization metrics
   */
  calculateRoutingMetrics(cables: Cable[], trays: Tray[], conduits: Conduit[]): RoutingMetrics {
    const totalTrays = trays.length;
    const totalConduits = conduits.length;
    
    const trayFills = trays.map(t => t.fillPercentage || 0);
    const conduitFills = conduits.map(c => c.fillPercentage || 0);
    
    const averageTrayFill = trayFills.length > 0 ? trayFills.reduce((sum, fill) => sum + fill, 0) / trayFills.length : 0;
    const averageConduitFill = conduitFills.length > 0 ? conduitFills.reduce((sum, fill) => sum + fill, 0) / conduitFills.length : 0;

    const overfilledTrays = trays.filter(t => (t.fillPercentage || 0) > (t.maxFillPercentage || 50)).length;
    const overfilledConduits = conduits.filter(c => (c.fillPercentage || 0) > (c.maxFillPercentage || 40)).length;

    const unassignedCables = cables.filter(c => !c.trayId && !c.conduitId).length;

    const trayUtilization = trays.map(tray => ({
      tag: tray.tag,
      fillPercentage: tray.fillPercentage || 0,
      capacity: (tray.width || 0) * (tray.height || 0)
    }));

    const conduitUtilization = conduits.map(conduit => ({
      tag: conduit.tag,
      fillPercentage: conduit.fillPercentage || 0,
      capacity: Math.PI * Math.pow((conduit.internalDiameter || 0) / 2, 2)
    }));

    return {
      totalTrays,
      totalConduits,
      averageTrayFill,
      averageConduitFill,
      overfilledTrays,
      overfilledConduits,
      unassignedCables,
      trayUtilization,
      conduitUtilization
    };
  }

  /**
   * Calculate load management metrics
   */
  calculateLoadMetrics(loads: Load[]): LoadMetrics {
    if (loads.length === 0) {
      return {
        totalLoads: 0,
        totalConnectedLoad: 0,
        totalDemandLoad: 0,
        averagePowerFactor: 0,
        averageEfficiency: 0,
        loadsByType: {},
        loadDistribution: []
      };
    }

    const totalConnectedLoad = loads.reduce((sum, load) => sum + (load.connectedLoadKw || load.powerKw || 0), 0);
    const totalDemandLoad = loads.reduce((sum, load) => sum + (load.demandLoadKw || 0), 0);
    
    const validPowerFactors = loads.filter(l => l.powerFactor && l.powerFactor > 0);
    const averagePowerFactor = validPowerFactors.length > 0 
      ? validPowerFactors.reduce((sum, load) => sum + (load.powerFactor || 0), 0) / validPowerFactors.length 
      : 0;

    const validEfficiencies = loads.filter(l => l.efficiency && l.efficiency > 0);
    const averageEfficiency = validEfficiencies.length > 0
      ? validEfficiencies.reduce((sum, load) => sum + (load.efficiency || 0), 0) / validEfficiencies.length
      : 0;

    // Group by load type
    const loadsByType: Record<string, number> = {};
    loads.forEach(load => {
      const type = load.loadType || 'Unknown';
      loadsByType[type] = (loadsByType[type] || 0) + 1;
    });

    // Power distribution ranges
    const loadDistribution = [
      { range: '≤ 1 kW', count: 0 },
      { range: '1-5 kW', count: 0 },
      { range: '5-25 kW', count: 0 },
      { range: '25-100 kW', count: 0 },
      { range: '> 100 kW', count: 0 }
    ];

    loads.forEach(load => {
      const power = load.powerKw || 0;
      if (power <= 1) loadDistribution[0].count++;
      else if (power <= 5) loadDistribution[1].count++;
      else if (power <= 25) loadDistribution[2].count++;
      else if (power <= 100) loadDistribution[3].count++;
      else loadDistribution[4].count++;
    });

    return {
      totalLoads: loads.length,
      totalConnectedLoad,
      totalDemandLoad,
      averagePowerFactor,
      averageEfficiency,
      loadsByType,
      loadDistribution
    };
  }

  /**
   * Calculate I/O system metrics
   */
  calculateIOMetrics(ioPoints: IOPoint[], plcCards: PLCCard[]): IOMetrics {
    if (ioPoints.length === 0 && plcCards.length === 0) {
      return {
        totalIOPoints: 0,
        pointsByType: {},
        pointsBySignalType: {},
        plcUtilization: [],
        unassignedPoints: 0
      };
    }

    // Group by I/O type
    const pointsByType: Record<string, number> = {};
    ioPoints.forEach(point => {
      const type = point.ioType || 'Unknown';
      pointsByType[type] = (pointsByType[type] || 0) + 1;
    });

    // Group by signal type
    const pointsBySignalType: Record<string, number> = {};
    ioPoints.forEach(point => {
      const signalType = point.signalType || 'Unknown';
      pointsBySignalType[signalType] = (pointsBySignalType[signalType] || 0) + 1;
    });

    // Calculate PLC utilization
    const plcUtilization = plcCards.map(card => ({
      plcName: card.plcName,
      usedChannels: card.usedChannels,
      totalChannels: card.totalChannels,
      utilization: card.totalChannels > 0 ? (card.usedChannels / card.totalChannels) * 100 : 0
    }));

    const unassignedPoints = ioPoints.filter(point => !point.plcName || !point.rack || !point.slot).length;

    return {
      totalIOPoints: ioPoints.length,
      pointsByType,
      pointsBySignalType,
      plcUtilization,
      unassignedPoints
    };
  }

  /**
   * Generate complete dashboard data
   */
  generateDashboardData(
    cables: Cable[], 
    trays: Tray[], 
    conduits: Conduit[], 
    loads: Load[], 
    ioPoints: IOPoint[], 
    plcCards: PLCCard[]
  ): DashboardData {
    return {
      cables: this.calculateCableMetrics(cables),
      routing: this.calculateRoutingMetrics(cables, trays, conduits),
      loads: this.calculateLoadMetrics(loads),
      io: this.calculateIOMetrics(ioPoints, plcCards),
      lastUpdated: new Date()
    };
  }
}

export const dashboardService = DashboardService.getInstance();