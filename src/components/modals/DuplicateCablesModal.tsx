import React, { useState, useEffect } from 'react';
import { Cable } from '../../types';
import { autoNumberingService } from '../../services/auto-numbering-service';

interface DuplicateCablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (cables: Cable[], count: number) => Promise<void>;
  selectedCables: Cable[];
  allCables: Cable[];
  isLoading?: boolean;
}

const DuplicateCablesModal: React.FC<DuplicateCablesModalProps> = ({
  isOpen,
  onClose,
  onDuplicate,
  selectedCables,
  allCables,
  isLoading = false
}) => {
  const [count, setCount] = useState(1);
  const [previewTags, setPreviewTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && selectedCables.length > 0) {
      try {
        const totalCopies = selectedCables.length * count;
        const tags = autoNumberingService.getNextTags(allCables, totalCopies);
        setPreviewTags(tags);
      } catch (error) {
        console.error('Failed to generate preview tags:', error);
        setPreviewTags([]);
      }
    }
  }, [isOpen, selectedCables, allCables, count]);

  const handleDuplicate = async () => {
    try {
      await onDuplicate(selectedCables, count);
      onClose();
    } catch (error) {
      console.error('Failed to duplicate cables:', error);
    }
  };

  const handleCountChange = (newCount: number) => {
    setCount(Math.max(1, Math.min(100, newCount))); // Limit between 1-100
  };

  const quickCounts = [1, 2, 3, 5, 10];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Duplicate Cables
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Create copies of {selectedCables.length} selected cable{selectedCables.length !== 1 ? 's' : ''} with auto-generated tags
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Cable List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cables to duplicate:
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
              {selectedCables.map((cable, index) => (
                <div key={cable.id || index} className="text-sm py-1">
                  <span className="font-mono font-semibold text-blue-600">
                    {cable.tag}
                  </span>
                  {cable.description && (
                    <span className="text-gray-600 ml-2">
                      - {cable.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Copy Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of copies per cable:
            </label>
            
            {/* Quick count buttons */}
            <div className="flex gap-2 mb-3">
              {quickCounts.map(quickCount => (
                <button
                  key={quickCount}
                  onClick={() => handleCountChange(quickCount)}
                  className={`px-3 py-1 text-sm rounded border ${
                    count === quickCount
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {quickCount}x
                </button>
              ))}
            </div>

            {/* Custom count input */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Custom:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">copies each</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview of new cable tags:
            </label>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">
                Total new cables: <span className="font-semibold">{selectedCables.length * count}</span>
              </div>
              
              {previewTags.length > 0 && (
                <div>
                  <div className="text-gray-600 mb-1">Generated tags:</div>
                  <div className="font-mono text-xs bg-white p-2 rounded border max-h-24 overflow-y-auto">
                    {previewTags.slice(0, 10).join(', ')}
                    {previewTags.length > 10 && (
                      <span className="text-gray-500">
                        ... and {previewTags.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="font-medium text-gray-700 mb-1">Summary:</div>
            <ul className="text-gray-600 space-y-1">
              <li>• {selectedCables.length} source cable{selectedCables.length !== 1 ? 's' : ''}</li>
              <li>• {count} cop{count !== 1 ? 'ies' : 'y'} per cable</li>
              <li>• {selectedCables.length * count} total new cables will be created</li>
              <li>• All properties except tag and timestamps will be copied</li>
              <li>• Auto-numbering will generate unique tags</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={isLoading || selectedCables.length === 0 || count < 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : `Create ${selectedCables.length * count} Cable${selectedCables.length * count !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateCablesModal;