/**
 * Electrical Calculation Service
 * Frontend service for electrical engineering calculations
 */

import { invoke } from '@tauri-apps/api/core';

export interface VoltageDropCalculation {
  voltage: number;
  current: number;
  distance: number;
  conductor_size: string;
  material: 'Copper' | 'Aluminum';
  power_factor?: number;
}

export interface VoltageDropResult {
  voltage_drop_volts: number;
  voltage_drop_percentage: number;
  line_to_line_voltage_drop: number;
  severity: 'Good' | 'Warning' | 'Error';
  compliance_status: string;
}

export class CalculationService {
  /**
   * Calculate voltage drop for a cable
   */
  async calculateVoltageDropForCable(
    voltage: number,
    current: number,
    distance: number,
    conductorSize: string,
    material: 'Copper' | 'Aluminum' = 'Copper',
    powerFactor: number = 0.85
  ): Promise<VoltageDropResult> {
    try {
      const result = await invoke<VoltageDropResult>('calculate_voltage_drop', {
        voltage,
        current,
        distance,
        conductorSize,
        material: material.toLowerCase(),
        powerFactor
      });
      return result;
    } catch (error) {
      console.error('Failed to calculate voltage drop:', error);
      throw new Error('Voltage drop calculation failed: ' + error);
    }
  }

  /**
   * Calculate minimum conductor size for voltage drop limit
   */
  async calculateMinimumConductorSize(
    voltage: number,
    current: number,
    distance: number,
    material: 'Copper' | 'Aluminum' = 'Copper',
    maxVoltageDropPercent: number = 3.0,
    powerFactor: number = 0.85
  ): Promise<string> {
    try {
      const result = await invoke<string>('calculate_minimum_conductor_size', {
        voltage,
        current,
        distance,
        material: material.toLowerCase(),
        maxVoltageDropPercent,
        powerFactor
      });
      return result;
    } catch (error) {
      console.error('Failed to calculate minimum conductor size:', error);
      throw new Error('Conductor size calculation failed: ' + error);
    }
  }

  /**
   * Calculate current from power rating
   */
  async calculateCurrentFromPower(
    powerWatts: number,
    voltage: number,
    powerFactor: number = 0.85,
    phases: number = 1
  ): Promise<number> {
    try {
      const result = await invoke<number>('calculate_current_from_power', {
        powerWatts,
        voltage,
        powerFactor,
        phases
      });
      return result;
    } catch (error) {
      console.error('Failed to calculate current from power:', error);
      throw new Error('Current calculation failed: ' + error);
    }
  }

  /**
   * Update voltage drop for a specific cable
   */
  async updateCableVoltageDropCalculation(cableId: number): Promise<number | null> {
    try {
      const result = await invoke<number | null>('update_cable_voltage_drop', {
        cableId
      });
      return result;
    } catch (error) {
      console.error('Failed to update cable voltage drop:', error);
      throw new Error('Cable voltage drop update failed: ' + error);
    }
  }

  /**
   * Batch calculate voltage drops for multiple cables
   */
  async batchUpdateVoltageDrops(cableIds: number[]): Promise<Map<number, number | null>> {
    const results = new Map<number, number | null>();
    
    // Process cables in parallel (but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < cableIds.length; i += batchSize) {
      const batch = cableIds.slice(i, i + batchSize);
      const promises = batch.map(async id => {
        try {
          const voltageDropPercent = await this.updateCableVoltageDropCalculation(id);
          return { id, voltageDropPercent };
        } catch (error) {
          console.error(`Failed to calculate voltage drop for cable ${id}:`, error);
          return { id, voltageDropPercent: null };
        }
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ id, voltageDropPercent }) => {
        results.set(id, voltageDropPercent);
      });
    }
    
    return results;
  }

  /**
   * Get voltage drop severity level
   */
  getVoltageDropSeverity(voltageDropPercent: number): 'ok' | 'warning' | 'error' {
    if (voltageDropPercent <= 3.0) {
      return 'ok';
    } else if (voltageDropPercent <= 5.0) {
      return 'warning';
    } else {
      return 'error';
    }
  }

  /**
   * Get voltage drop status message
   */
  getVoltageDropMessage(voltageDropPercent: number): string {
    const severity = this.getVoltageDropSeverity(voltageDropPercent);
    
    switch (severity) {
      case 'ok':
        return `${voltageDropPercent.toFixed(1)}% - Compliant with NEC (≤3%)`;
      case 'warning':
        return `${voltageDropPercent.toFixed(1)}% - Acceptable but high (consider larger conductor)`;
      case 'error':
        return `${voltageDropPercent.toFixed(1)}% - Exceeds NEC recommendations (larger conductor required)`;
    }
  }

  /**
   * Get voltage drop CSS class for UI styling
   */
  getVoltageDropClass(voltageDropPercent: number): string {
    const severity = this.getVoltageDropSeverity(voltageDropPercent);
    
    switch (severity) {
      case 'ok':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
    }
  }

  /**
   * Estimate typical current values for common cable functions
   */
  estimateTypicalCurrent(cableFunction: string, conductorSize: string): number | null {
    const sizeUpper = conductorSize.toUpperCase();
    
    switch (cableFunction.toLowerCase()) {
      case 'power':
      case 'lighting':
        // Power cable current estimates based on NEC ampacity tables (simplified)
        if (sizeUpper.includes('18')) return 7;
        if (sizeUpper.includes('16')) return 10;
        if (sizeUpper.includes('14')) return 15;
        if (sizeUpper.includes('12')) return 20;
        if (sizeUpper.includes('10')) return 30;
        if (sizeUpper.includes('8')) return 50;
        if (sizeUpper.includes('6')) return 65;
        if (sizeUpper.includes('4')) return 85;
        if (sizeUpper.includes('2')) return 115;
        if (sizeUpper.includes('1/0')) return 150;
        if (sizeUpper.includes('2/0')) return 175;
        if (sizeUpper.includes('3/0')) return 200;
        if (sizeUpper.includes('4/0')) return 230;
        return 20; // Default assumption
        
      case 'signal':
      case 'control':
      case 'communication':
        // Signal cables carry very low currents
        if (sizeUpper.includes('18') || sizeUpper.includes('20') || sizeUpper.includes('22')) return 0.1;
        if (sizeUpper.includes('16')) return 0.2;
        if (sizeUpper.includes('14')) return 0.5;
        return 0.1; // Default for signals
        
      default:
        return null; // Can't estimate for unknown functions
    }
  }

  /**
   * Recommend conductor size for given application
   */
  async recommendConductorSize(
    voltage: number,
    loadAmps: number,
    distance: number,
    material: 'Copper' | 'Aluminum' = 'Copper',
    temperatureRating: number = 75,
    maxVoltageDrop: number = 3.0
  ): Promise<{
    recommendedSize: string;
    actualVoltageDrop: number;
    ampacityLimited: boolean;
    voltageDropLimited: boolean;
  }> {
    try {
      // First, find minimum size for voltage drop
      const voltageDropSize = await this.calculateMinimumConductorSize(
        voltage,
        loadAmps,
        distance,
        material,
        maxVoltageDrop
      );

      // Then check if ampacity is limiting factor
      // (This would require ampacity tables - simplified for now)
      const ampacitySize = this.getMinimumSizeForAmpacity(loadAmps, material, temperatureRating);
      
      // Use the larger of the two requirements
      const recommendedSize = this.selectLargerConductorSize(voltageDropSize, ampacitySize);
      
      // Calculate actual voltage drop with recommended size
      const actualResult = await this.calculateVoltageDropForCable(
        voltage,
        loadAmps,
        distance,
        recommendedSize,
        material
      );

      return {
        recommendedSize,
        actualVoltageDrop: actualResult.voltage_drop_percentage,
        ampacityLimited: ampacitySize === recommendedSize,
        voltageDropLimited: voltageDropSize === recommendedSize
      };
    } catch (error) {
      console.error('Failed to recommend conductor size:', error);
      throw new Error('Conductor size recommendation failed: ' + error);
    }
  }

  private getMinimumSizeForAmpacity(amps: number, material: 'Copper' | 'Aluminum', tempRating: number): string {
    // Simplified ampacity table lookup (NEC Table 310.15(B)(16) approximation)
    // This would be more comprehensive in a production system
    const copperSizes = [
      { size: '18 AWG', ampacity: 7 },
      { size: '16 AWG', ampacity: 10 },
      { size: '14 AWG', ampacity: 15 },
      { size: '12 AWG', ampacity: 20 },
      { size: '10 AWG', ampacity: 30 },
      { size: '8 AWG', ampacity: 50 },
      { size: '6 AWG', ampacity: 65 },
      { size: '4 AWG', ampacity: 85 },
      { size: '3 AWG', ampacity: 100 },
      { size: '2 AWG', ampacity: 115 },
      { size: '1 AWG', ampacity: 130 },
      { size: '1/0 AWG', ampacity: 150 },
      { size: '2/0 AWG', ampacity: 175 },
      { size: '3/0 AWG', ampacity: 200 },
      { size: '4/0 AWG', ampacity: 230 },
      { size: '250 MCM', ampacity: 255 },
      { size: '300 MCM', ampacity: 285 },
      { size: '400 MCM', ampacity: 335 },
      { size: '500 MCM', ampacity: 380 },
    ];

    for (const conductor of copperSizes) {
      if (conductor.ampacity >= amps * 1.25) { // Apply 125% safety factor
        return conductor.size;
      }
    }

    return '500 MCM'; // Maximum size if nothing else works
  }

  private selectLargerConductorSize(size1: string, size2: string): string {
    // Simple comparison - in production this would use proper conductor size ordering
    const sizeOrder = [
      '18 AWG', '16 AWG', '14 AWG', '12 AWG', '10 AWG', '8 AWG', '6 AWG',
      '4 AWG', '3 AWG', '2 AWG', '1 AWG', '1/0 AWG', '2/0 AWG', '3/0 AWG', '4/0 AWG',
      '250 MCM', '300 MCM', '350 MCM', '400 MCM', '500 MCM', '600 MCM', '750 MCM', '1000 MCM'
    ];

    const index1 = sizeOrder.indexOf(size1);
    const index2 = sizeOrder.indexOf(size2);

    if (index1 === -1) return size2;
    if (index2 === -1) return size1;

    return index1 > index2 ? size1 : size2; // Higher index = larger conductor
  }
}

// Export singleton instance
export const calculationService = new CalculationService();