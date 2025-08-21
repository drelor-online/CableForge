import React, { useState, useEffect, useMemo } from 'react';
import { Cable } from '../../types';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: (updates: { cableId: number; field: string; newValue: string }[]) => Promise<void>;
  cables: Cable[];
  isLoading?: boolean;
}

interface SearchResult {
  cable: Cable;
  field: string;
  currentValue: string;
  matches: { start: number; end: number; text: string }[];
}

const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  onReplace,
  cables,
  isLoading = false
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(['tag', 'description']);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  // Available fields to search
  const searchableFields = [
    { key: 'tag', label: 'Tag' },
    { key: 'description', label: 'Description' },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
    { key: 'function', label: 'Function' },
    { key: 'cableType', label: 'Cable Type' },
    { key: 'size', label: 'Size' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'partNumber', label: 'Part Number' },
    { key: 'notes', label: 'Notes' },
    { key: 'route', label: 'Route' }
  ];

  // Search results
  const searchResults = useMemo(() => {
    if (!findText.trim()) return [];

    const results: SearchResult[] = [];
    
    try {
      let searchPattern: RegExp;
      
      if (useRegex) {
        const flags = matchCase ? 'g' : 'gi';
        searchPattern = new RegExp(findText, flags);
      } else {
        let escapedText = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        if (wholeWord) {
          escapedText = `\\b${escapedText}\\b`;
        }
        
        const flags = matchCase ? 'g' : 'gi';
        searchPattern = new RegExp(escapedText, flags);
      }

      cables.forEach(cable => {
        selectedFields.forEach(field => {
          const value = cable[field as keyof Cable];
          const stringValue = value?.toString() || '';
          
          if (stringValue) {
            const matches: { start: number; end: number; text: string }[] = [];
            let match;
            
            // Reset regex lastIndex for global search
            searchPattern.lastIndex = 0;
            
            while ((match = searchPattern.exec(stringValue)) !== null) {
              matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
              });
              
              // Prevent infinite loop on zero-length matches
              if (match.index === searchPattern.lastIndex) {
                searchPattern.lastIndex++;
              }
            }
            
            if (matches.length > 0) {
              results.push({
                cable,
                field,
                currentValue: stringValue,
                matches
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Search pattern error:', error);
    }

    return results;
  }, [findText, cables, selectedFields, matchCase, wholeWord, useRegex]);

  // Reset selected results when search changes
  useEffect(() => {
    setSelectedResults(new Set());
  }, [findText, selectedFields, matchCase, wholeWord, useRegex]);

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleResultToggle = (resultKey: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultKey)) {
        newSet.delete(resultKey);
      } else {
        newSet.add(resultKey);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedResults.size === searchResults.length) {
      setSelectedResults(new Set());
    } else {
      const allKeys = searchResults.map((_, index) => index.toString());
      setSelectedResults(new Set(allKeys));
    }
  };

  const getPreviewText = (result: SearchResult) => {
    if (!replaceText && replaceText !== '') return result.currentValue;
    
    try {
      let newValue = result.currentValue;
      
      if (useRegex) {
        const flags = matchCase ? 'g' : 'gi';
        const pattern = new RegExp(findText, flags);
        newValue = result.currentValue.replace(pattern, replaceText);
      } else {
        let escapedText = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        if (wholeWord) {
          escapedText = `\\b${escapedText}\\b`;
        }
        
        const flags = matchCase ? 'g' : 'gi';
        const pattern = new RegExp(escapedText, flags);
        newValue = result.currentValue.replace(pattern, replaceText);
      }
      
      return newValue;
    } catch (error) {
      return result.currentValue;
    }
  };

  const handleReplace = async () => {
    if (selectedResults.size === 0) return;

    const updates = Array.from(selectedResults).map(resultIndex => {
      const result = searchResults[parseInt(resultIndex)];
      const newValue = getPreviewText(result);
      
      return {
        cableId: result.cable.id!,
        field: result.field,
        newValue
      };
    });

    try {
      await onReplace(updates);
      setSelectedResults(new Set());
      setFindText('');
      setReplaceText('');
    } catch (error) {
      console.error('Replace failed:', error);
    }
  };

  const highlightMatches = (text: string, matches: { start: number; end: number }[]) => {
    if (matches.length === 0) return text;

    const parts = [];
    let lastEnd = 0;

    matches.forEach(match => {
      // Add text before match
      if (match.start > lastEnd) {
        parts.push(text.substring(lastEnd, match.start));
      }
      
      // Add highlighted match
      parts.push(
        <mark key={`${match.start}-${match.end}`} className="bg-yellow-200 px-1 rounded">
          {text.substring(match.start, match.end)}
        </mark>
      );
      
      lastEnd = match.end;
    });

    // Add remaining text
    if (lastEnd < text.length) {
      parts.push(text.substring(lastEnd));
    }

    return parts;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Find & Replace
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Search and replace text across cable data
          </p>
        </div>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
          {/* Search Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Find:
              </label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter text to find..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replace with:
              </label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter replacement text..."
              />
            </div>
          </div>

          {/* Search Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Match case</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Whole word</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Use regex</span>
            </label>
          </div>

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search in fields:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {searchableFields.map(field => (
                <label key={field.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Results */}
          {findText && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Search Results ({searchResults.length} matches)
                </h4>
                {searchResults.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedResults.size === searchResults.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No matches found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((result, index) => {
                      const resultKey = index.toString();
                      const isSelected = selectedResults.has(resultKey);
                      const previewText = getPreviewText(result);
                      const hasChanges = previewText !== result.currentValue;
                      
                      return (
                        <div
                          key={resultKey}
                          className={`p-3 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleResultToggle(resultKey)}
                              className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-semibold text-blue-600">
                                  {result.cable.tag}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {searchableFields.find(f => f.key === result.field)?.label}
                                </span>
                              </div>
                              
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="text-gray-600">Current: </span>
                                  <span className="font-mono">
                                    {highlightMatches(result.currentValue, result.matches)}
                                  </span>
                                </div>
                                
                                {hasChanges && (
                                  <div>
                                    <span className="text-gray-600">Preview: </span>
                                    <span className="font-mono text-green-700">
                                      {previewText}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedResults.size > 0 && (
              <span>{selectedResults.size} of {searchResults.length} selected</span>
            )}
          </div>
          
          <div className="flex space-x-3">
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
              onClick={handleReplace}
              disabled={isLoading || selectedResults.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Replacing...' : `Replace ${selectedResults.size} Item${selectedResults.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindReplaceModal;