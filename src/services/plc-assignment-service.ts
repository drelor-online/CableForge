/**
 * PLC Channel Assignment Service
 * Handles automatic channel assignment and conflict detection
 */

import { IOPoint, PLCCard, IOType, SignalType, ChannelAssignment } from '../types';

export interface ChannelAssignmentResult {
  success: boolean;
  assignedChannel?: number;
  errorMessage?: string;
  suggestions?: string[];
}

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: ChannelConflict[];
}

export interface ChannelConflict {
  type: 'CHANNEL_OCCUPIED' | 'INCOMPATIBLE_SIGNAL' | 'CARD_FULL' | 'NO_COMPATIBLE_CARD';
  message: string;
  ioPointTag: string;
  plcName?: string;
  rack?: number;
  slot?: number;
  channel?: number;
  suggestions: string[];
}

export class PLCAssignmentService {
  
  /**
   * Automatically assign a channel for an I/O point
   */
  static autoAssignChannel(
    ioPoint: IOPoint,
    plcCards: PLCCard[],
    existingIOPoints: IOPoint[]
  ): ChannelAssignmentResult {
    if (!ioPoint.ioType) {
      return {
        success: false,
        errorMessage: 'I/O point must have an I/O type defined',
        suggestions: ['Set the I/O type (AI, AO, DI, DO) for this I/O point']
      };
    }

    // If PLC/rack/slot specified, try to assign to that specific card
    if (ioPoint.plcName && ioPoint.rack !== undefined && ioPoint.slot !== undefined) {
      return this.assignToSpecificCard(ioPoint, plcCards, existingIOPoints);
    }

    // Otherwise, find the best available card
    return this.assignToBestAvailableCard(ioPoint, plcCards, existingIOPoints);
  }

  /**
   * Assign to a specific PLC card
   */
  private static assignToSpecificCard(
    ioPoint: IOPoint,
    plcCards: PLCCard[],
    existingIOPoints: IOPoint[]
  ): ChannelAssignmentResult {
    const targetCard = plcCards.find(card => 
      card.plcName === ioPoint.plcName &&
      card.rack === ioPoint.rack &&
      card.slot === ioPoint.slot
    );

    if (!targetCard) {
      return {
        success: false,
        errorMessage: `No card found at PLC: ${ioPoint.plcName}, Rack: ${ioPoint.rack}, Slot: ${ioPoint.slot}`,
        suggestions: [
          'Check that the PLC card exists',
          'Create the required PLC card',
          'Use auto-assignment instead'
        ]
      };
    }

    // Check I/O type compatibility
    if (targetCard.ioType !== ioPoint.ioType) {
      return {
        success: false,
        errorMessage: `I/O type mismatch. Card supports ${targetCard.ioType}, but I/O point is ${ioPoint.ioType}`,
        suggestions: [
          `Change I/O point type to ${targetCard.ioType}`,
          'Find a compatible card',
          'Use auto-assignment to find compatible card'
        ]
      };
    }

    // Check signal type compatibility if both are specified
    if (targetCard.signalType && ioPoint.signalType && 
        !this.isSignalTypeCompatible(targetCard.signalType, ioPoint.signalType)) {
      return {
        success: false,
        errorMessage: `Signal type incompatible. Card supports ${targetCard.signalType}, but I/O point is ${ioPoint.signalType}`,
        suggestions: [
          `Change signal type to ${targetCard.signalType}`,
          'Find a compatible card',
          'Use auto-assignment to find compatible card'
        ]
      };
    }

    // Find next available channel
    const usedChannels = this.getUsedChannelsForCard(targetCard, existingIOPoints);
    const availableChannel = this.findNextAvailableChannel(targetCard, usedChannels);

    if (availableChannel === null) {
      return {
        success: false,
        errorMessage: `No available channels on card ${targetCard.name}. All ${targetCard.totalChannels} channels are in use.`,
        suggestions: [
          'Add more I/O cards of this type',
          'Free up unused channels',
          'Use auto-assignment to find available cards'
        ]
      };
    }

    return {
      success: true,
      assignedChannel: availableChannel
    };
  }

  /**
   * Find the best available card for assignment
   */
  private static assignToBestAvailableCard(
    ioPoint: IOPoint,
    plcCards: PLCCard[],
    existingIOPoints: IOPoint[]
  ): ChannelAssignmentResult {
    // Filter cards that match the I/O type
    const compatibleCards = plcCards.filter(card => 
      card.ioType === ioPoint.ioType &&
      (!card.signalType || !ioPoint.signalType || 
       this.isSignalTypeCompatible(card.signalType, ioPoint.signalType))
    );

    if (compatibleCards.length === 0) {
      return {
        success: false,
        errorMessage: `No compatible PLC cards found for I/O type: ${ioPoint.ioType}`,
        suggestions: [
          `Add a PLC card that supports ${ioPoint.ioType}`,
          'Check signal type compatibility',
          'Review I/O point configuration'
        ]
      };
    }

    // Sort by availability (least used first) and prefer same PLC if specified
    const sortedCards = compatibleCards
      .map(card => ({
        card,
        usedChannels: this.getUsedChannelsForCard(card, existingIOPoints),
        utilization: this.getUsedChannelsForCard(card, existingIOPoints).length / card.totalChannels
      }))
      .filter(cardInfo => cardInfo.usedChannels.length < cardInfo.card.totalChannels) // Only cards with available channels
      .sort((a, b) => {
        // Prefer same PLC if specified
        if (ioPoint.plcName) {
          const aSamePLC = a.card.plcName === ioPoint.plcName ? 0 : 1;
          const bSamePLC = b.card.plcName === ioPoint.plcName ? 0 : 1;
          if (aSamePLC !== bSamePLC) return aSamePLC - bSamePLC;
        }
        
        // Then by utilization (least utilized first)
        return a.utilization - b.utilization;
      });

    if (sortedCards.length === 0) {
      return {
        success: false,
        errorMessage: 'All compatible PLC cards are full',
        suggestions: [
          'Add more I/O cards',
          'Free up unused channels',
          'Review channel assignments'
        ]
      };
    }

    const bestCard = sortedCards[0];
    const availableChannel = this.findNextAvailableChannel(bestCard.card, bestCard.usedChannels);

    if (availableChannel === null) {
      return {
        success: false,
        errorMessage: 'Internal error: could not find available channel',
        suggestions: ['Contact support']
      };
    }

    return {
      success: true,
      assignedChannel: availableChannel
    };
  }

  /**
   * Get all used channels for a specific PLC card
   */
  private static getUsedChannelsForCard(card: PLCCard, ioPoints: IOPoint[]): number[] {
    return ioPoints
      .filter(io => 
        io.plcName === card.plcName &&
        io.rack === card.rack &&
        io.slot === card.slot &&
        io.channel !== undefined &&
        io.channel !== null
      )
      .map(io => io.channel!)
      .sort((a, b) => a - b);
  }

  /**
   * Find the next available channel on a card
   */
  private static findNextAvailableChannel(card: PLCCard, usedChannels: number[]): number | null {
    for (let channel = 0; channel < card.totalChannels; channel++) {
      if (!usedChannels.includes(channel)) {
        return channel;
      }
    }
    return null;
  }

  /**
   * Check if signal types are compatible
   */
  private static isSignalTypeCompatible(cardSignalType: SignalType, ioSignalType: SignalType): boolean {
    // Exact match is always compatible
    if (cardSignalType === ioSignalType) return true;

    // Define compatibility matrix
    const compatibilityMatrix: Record<SignalType, SignalType[]> = {
      [SignalType.FourToTwentyMA]: [SignalType.FourToTwentyMA, SignalType.HART, SignalType.Analog],
      [SignalType.HART]: [SignalType.FourToTwentyMA, SignalType.HART],
      [SignalType.Digital]: [SignalType.Digital, SignalType.DryContact, SignalType.TwentyFourVDC],
      [SignalType.RTD]: [SignalType.RTD],
      [SignalType.Thermocouple]: [SignalType.Thermocouple],
      [SignalType.TwentyFourVDC]: [SignalType.TwentyFourVDC, SignalType.Digital],
      [SignalType.DryContact]: [SignalType.DryContact, SignalType.Digital],
      [SignalType.Analog]: [SignalType.Analog, SignalType.FourToTwentyMA, SignalType.HART]
    };

    return compatibilityMatrix[cardSignalType]?.includes(ioSignalType) ?? false;
  }

  /**
   * Detect channel assignment conflicts
   */
  static detectConflicts(
    ioPoints: IOPoint[],
    plcCards: PLCCard[]
  ): ConflictDetectionResult {
    const conflicts: ChannelConflict[] = [];

    // Group I/O points by PLC card location
    const cardGroups = new Map<string, IOPoint[]>();
    
    ioPoints.forEach(io => {
      if (io.plcName && io.rack !== undefined && io.slot !== undefined && io.channel !== undefined) {
        const key = `${io.plcName}-${io.rack}-${io.slot}`;
        if (!cardGroups.has(key)) {
          cardGroups.set(key, []);
        }
        cardGroups.get(key)!.push(io);
      }
    });

    // Check each card group for conflicts
    cardGroups.forEach((ioPointsInCard, cardKey) => {
      const [plcName, rack, slot] = cardKey.split('-');
      const card = plcCards.find(c => 
        c.plcName === plcName && 
        c.rack === parseInt(rack) && 
        c.slot === parseInt(slot)
      );

      if (!card) {
        // Missing card conflict
        ioPointsInCard.forEach(io => {
          conflicts.push({
            type: 'NO_COMPATIBLE_CARD',
            message: `PLC card not found: ${plcName} Rack ${rack} Slot ${slot}`,
            ioPointTag: io.tag,
            plcName,
            rack: parseInt(rack),
            slot: parseInt(slot),
            suggestions: [
              'Create the missing PLC card',
              'Verify PLC configuration',
              'Reassign I/O point to existing card'
            ]
          });
        });
        return;
      }

      // Check for duplicate channel assignments
      const channelMap = new Map<number, IOPoint[]>();
      ioPointsInCard.forEach(io => {
        if (io.channel !== undefined) {
          if (!channelMap.has(io.channel)) {
            channelMap.set(io.channel, []);
          }
          channelMap.get(io.channel)!.push(io);
        }
      });

      channelMap.forEach((iosOnChannel, channel) => {
        if (iosOnChannel.length > 1) {
          iosOnChannel.forEach(io => {
            const otherTags = iosOnChannel.filter(other => other.tag !== io.tag).map(other => other.tag);
            conflicts.push({
              type: 'CHANNEL_OCCUPIED',
              message: `Channel ${channel} is assigned to multiple I/O points: ${otherTags.join(', ')}`,
              ioPointTag: io.tag,
              plcName,
              rack: parseInt(rack),
              slot: parseInt(slot),
              channel,
              suggestions: [
                'Use auto-assignment to resolve conflicts',
                'Manually reassign to available channels',
                'Add more I/O cards if needed'
              ]
            });
          });
        }
      });

      // Check for I/O type mismatches
      ioPointsInCard.forEach(io => {
        if (io.ioType && card.ioType !== io.ioType) {
          conflicts.push({
            type: 'INCOMPATIBLE_SIGNAL',
            message: `I/O type mismatch: card supports ${card.ioType}, I/O point is ${io.ioType}`,
            ioPointTag: io.tag,
            plcName,
            rack: parseInt(rack),
            slot: parseInt(slot),
            suggestions: [
              `Change I/O type to ${card.ioType}`,
              'Move to compatible card',
              'Use auto-assignment'
            ]
          });
        }

        // Check signal type compatibility
        if (io.signalType && card.signalType && 
            !this.isSignalTypeCompatible(card.signalType, io.signalType)) {
          conflicts.push({
            type: 'INCOMPATIBLE_SIGNAL',
            message: `Signal type incompatible: card supports ${card.signalType}, I/O point is ${io.signalType}`,
            ioPointTag: io.tag,
            plcName,
            rack: parseInt(rack),
            slot: parseInt(slot),
            suggestions: [
              `Change signal type to compatible type`,
              'Move to compatible card',
              'Use auto-assignment'
            ]
          });
        }
      });

      // Check if card is over capacity
      if (ioPointsInCard.length > card.totalChannels) {
        const overCapacityPoints = ioPointsInCard.slice(card.totalChannels);
        overCapacityPoints.forEach(io => {
          conflicts.push({
            type: 'CARD_FULL',
            message: `Card is over capacity: ${ioPointsInCard.length} I/O points assigned to ${card.totalChannels} channel card`,
            ioPointTag: io.tag,
            plcName,
            rack: parseInt(rack),
            slot: parseInt(slot),
            suggestions: [
              'Add more I/O cards',
              'Move some I/O points to other cards',
              'Use auto-assignment to redistribute'
            ]
          });
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Get utilization statistics for all PLC cards
   */
  static getPLCCardUtilization(
    plcCards: PLCCard[],
    ioPoints: IOPoint[]
  ): Array<PLCCardUtilization> {
    return plcCards.map(card => {
      const usedChannels = this.getUsedChannelsForCard(card, ioPoints);
      const utilization = usedChannels.length / card.totalChannels;
      
      return {
        card,
        usedChannels: usedChannels.length,
        availableChannels: card.totalChannels - usedChannels.length,
        utilizationPercentage: Math.round(utilization * 100),
        status: utilization >= 1 ? 'full' : utilization >= 0.9 ? 'high' : utilization >= 0.7 ? 'medium' : 'low'
      };
    });
  }

  /**
   * Suggest optimal PLC card configuration
   */
  static suggestPLCCardConfiguration(
    ioPoints: IOPoint[]
  ): PLCCardSuggestion[] {
    // Group I/O points by type and signal type
    const ioGroups = new Map<string, IOPoint[]>();
    
    ioPoints.forEach(io => {
      if (io.ioType) {
        const key = `${io.ioType}-${io.signalType || 'generic'}`;
        if (!ioGroups.has(key)) {
          ioGroups.set(key, []);
        }
        ioGroups.get(key)!.push(io);
      }
    });

    const suggestions: PLCCardSuggestion[] = [];

    ioGroups.forEach((ios, key) => {
      const [ioType, signalType] = key.split('-');
      const count = ios.length;
      
      // Suggest cards based on standard sizes (8, 16, 32 channels)
      const cardSizes = [32, 16, 8];
      let remainingChannels = count;
      
      cardSizes.forEach(size => {
        const cardsNeeded = Math.floor(remainingChannels / size);
        if (cardsNeeded > 0) {
          suggestions.push({
            ioType: ioType as IOType,
            signalType: signalType !== 'generic' ? signalType as SignalType : undefined,
            channelCount: size,
            cardsNeeded,
            ioPointsServed: cardsNeeded * size,
            reason: `Efficient ${size}-channel cards for ${ioType} signals`
          });
          remainingChannels -= cardsNeeded * size;
        }
      });

      // Handle remaining channels with smallest card
      if (remainingChannels > 0) {
        suggestions.push({
          ioType: ioType as IOType,
          signalType: signalType !== 'generic' ? signalType as SignalType : undefined,
          channelCount: 8, // Default smallest card
          cardsNeeded: 1,
          ioPointsServed: remainingChannels,
          reason: `Handle remaining ${remainingChannels} ${ioType} channels`
        });
      }
    });

    return suggestions.sort((a, b) => {
      // Sort by I/O type, then by card size (larger first)
      if (a.ioType !== b.ioType) return a.ioType.localeCompare(b.ioType);
      return b.channelCount - a.channelCount;
    });
  }
}

export interface PLCCardUtilization {
  card: PLCCard;
  usedChannels: number;
  availableChannels: number;
  utilizationPercentage: number;
  status: 'low' | 'medium' | 'high' | 'full';
}

export interface PLCCardSuggestion {
  ioType: IOType;
  signalType?: SignalType;
  channelCount: number;
  cardsNeeded: number;
  ioPointsServed: number;
  reason: string;
}