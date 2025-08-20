import React from 'react';
import { CableFunction } from '../../types';

interface CableTypeBadgeProps {
  type?: CableFunction;
}

const CableTypeBadge: React.FC<CableTypeBadgeProps> = ({ type }) => {
  if (!type) return <span className="text-gray-400">-</span>;

  const getBadgeConfig = (cableType: CableFunction) => {
    switch (cableType) {
      case CableFunction.Power:
        return {
          className: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800',
          icon: '⚡',
          label: 'Power'
        };
      case CableFunction.Signal:
        return {
          className: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
          icon: '📶',
          label: 'Signal'
        };
      case CableFunction.Control:
        return {
          className: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
          icon: '🎛️',
          label: 'Control'
        };
      case CableFunction.Lighting:
        return {
          className: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
          icon: '💡',
          label: 'Lighting'
        };
      case CableFunction.Communication:
        return {
          className: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
          icon: '📡',
          label: 'Comm'
        };
      case CableFunction.Spare:
        return {
          className: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
          icon: '🔧',
          label: 'Spare'
        };
      default:
        return {
          className: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
          icon: '❓',
          label: type
        };
    }
  };

  const config = getBadgeConfig(type);

  return (
    <span className={config.className} title={`${config.label} cable`}>
      <span className="text-xs">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default CableTypeBadge;