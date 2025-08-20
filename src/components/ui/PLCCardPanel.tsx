import React, { useMemo } from 'react';
import { PLCCard, IOPoint } from '../../types';
import { PLCAssignmentService, PLCCardUtilization } from '../../services/plc-assignment-service';

interface PLCCardPanelProps {
  plcCards: PLCCard[];
  ioPoints: IOPoint[];
  onCardSelect?: (card: PLCCard) => void;
  className?: string;
}

const PLCCardPanel: React.FC<PLCCardPanelProps> = ({
  plcCards,
  ioPoints,
  onCardSelect,
  className = ''
}) => {
  const cardUtilizations = useMemo(() => {
    return PLCAssignmentService.getPLCCardUtilization(plcCards, ioPoints);
  }, [plcCards, ioPoints]);

  const getStatusColor = (status: PLCCardUtilization['status']) => {
    switch (status) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'full': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUtilizationBarColor = (status: PLCCardUtilization['status']) => {
    switch (status) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'full': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (plcCards.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No PLC Cards</h3>
        <p className="text-gray-500">Add PLC cards to track I/O channel assignments</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">PLC Cards</h3>
          <span className="text-xs text-gray-500">
            {plcCards.length} card{plcCards.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Cards List */}
      <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
        {cardUtilizations.map((utilization) => (
          <div
            key={utilization.card.id}
            className={`border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(utilization.status)}`}
            onClick={() => onCardSelect?.(utilization.card)}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{utilization.card.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  utilization.card.ioType === 'AI' ? 'bg-blue-100 text-blue-800' :
                  utilization.card.ioType === 'AO' ? 'bg-green-100 text-green-800' :
                  utilization.card.ioType === 'DI' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {utilization.card.ioType}
                </span>
              </div>
              <span className="text-xs font-medium">
                {utilization.utilizationPercentage}%
              </span>
            </div>

            {/* PLC Location */}
            <div className="text-xs text-gray-600 mb-2">
              {utilization.card.plcName} • Rack {utilization.card.rack} • Slot {utilization.card.slot}
            </div>

            {/* Utilization Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Channels</span>
                <span>{utilization.usedChannels}/{utilization.card.totalChannels}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUtilizationBarColor(utilization.status)}`}
                  style={{ width: `${utilization.utilizationPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Card Type and Signal Type */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{utilization.card.cardType}</span>
              {utilization.card.signalType && (
                <span className="text-gray-500">{utilization.card.signalType}</span>
              )}
            </div>

            {/* Status Indicator */}
            <div className="mt-2 flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                utilization.status === 'low' ? 'bg-green-500' :
                utilization.status === 'medium' ? 'bg-yellow-500' :
                utilization.status === 'high' ? 'bg-orange-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-xs font-medium">
                {utilization.status === 'low' && 'Low utilization'}
                {utilization.status === 'medium' && 'Medium utilization'}
                {utilization.status === 'high' && 'High utilization'}
                {utilization.status === 'full' && 'Full capacity'}
              </span>
              {utilization.availableChannels > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({utilization.availableChannels} available)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Total Channels</span>
          <div className="flex items-center gap-4">
            <span className="text-green-600">
              Used: {cardUtilizations.reduce((sum, u) => sum + u.usedChannels, 0)}
            </span>
            <span className="text-gray-600">
              Total: {cardUtilizations.reduce((sum, u) => sum + u.card.totalChannels, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLCCardPanel;