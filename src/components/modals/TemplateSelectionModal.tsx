import React, { useState, useEffect, useMemo } from 'react';
import { ProjectTemplate, ProjectTemplateData } from '../../types';
import { templateService } from '../../services/template-service';
import { useUI } from '../../contexts/UIContext';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate, projectName: string) => void;
  onCreateFromScratch: (projectName: string) => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateFromScratch,
}) => {
  const { showError } = useUI();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectTemplate['category'] | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setProjectName('');
      setSelectedTemplate(null);
      setSearchTerm('');
      setSelectedCategory('All');
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = await templateService.getTemplates({
        includeBuiltin: true,
        sortBy: 'category',
        sortOrder: 'asc',
      });
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showError('Failed to load project templates');
      // Use built-in templates as fallback
      setTemplates(getBuiltinTemplates());
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchTerm]);

  const categories: Array<ProjectTemplate['category'] | 'All'> = ['All', 'Oil & Gas', 'Power', 'Industrial', 'Marine', 'Custom'];

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      showError('Please enter a project name');
      return;
    }

    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, projectName.trim());
    } else {
      onCreateFromScratch(projectName.trim());
    }
  };

  const getBuiltinTemplates = (): ProjectTemplate[] => {
    // Fallback built-in templates if service is not available
    return [
      {
        id: 1,
        name: 'Oil & Gas Facility',
        description: 'Standard template for oil and gas processing facilities with common equipment and cable types',
        category: 'Oil & Gas',
        version: '1.0',
        createdBy: 'System',
        isPublic: true,
        isBuiltin: true,
        templateData: {
          projectInfo: { name: 'New Oil & Gas Project' },
          defaultSettings: {
            voltages: [120, 240, 480, 4160],
            cableFunctions: ['Power', 'Control', 'Instrumentation'],
            conduitTypes: ['Rigid Steel', 'EMT', 'PVC'],
            trayTypes: ['Ladder', 'Solid Bottom'],
            defaultSparePercentage: 25,
            defaultVoltageDropLimit: 3,
          },
        } as ProjectTemplateData,
        tags: ['oil', 'gas', 'processing'],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Power Distribution',
        description: 'Template for electrical power distribution systems',
        category: 'Power',
        version: '1.0',
        createdBy: 'System',
        isPublic: true,
        isBuiltin: true,
        templateData: {
          projectInfo: { name: 'New Power Project' },
          defaultSettings: {
            voltages: [120, 208, 240, 480],
            cableFunctions: ['Power', 'Control'],
            conduitTypes: ['EMT', 'Rigid Steel'],
            trayTypes: ['Ladder', 'Solid Bottom'],
            defaultSparePercentage: 20,
            defaultVoltageDropLimit: 3,
          },
        } as ProjectTemplateData,
        tags: ['power', 'distribution'],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Project</h2>
            <p className="text-gray-600 mt-1">Choose a template or start from scratch</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Templates */}
          <div className="flex-1 flex flex-col">
            {/* Search and Filters */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-4 items-center mb-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Templates Grid/List */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading templates...</div>
                </div>
              ) : (
                <>
                  {/* Create from Scratch Option */}
                  <div 
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${!selectedTemplate ? 'border-blue-500 bg-blue-50' : ''}`}
                    onClick={() => setSelectedTemplate(null)}
                  >
                    <div className="text-center">
                      <div className="text-4xl text-gray-400 mb-2">+</div>
                      <h3 className="font-semibold text-gray-900">Create from Scratch</h3>
                      <p className="text-gray-600 text-sm">Start with an empty project</p>
                    </div>
                  </div>

                  {/* Template Grid */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
                            selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              template.isBuiltin 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {template.category}
                            </span>
                            {template.isBuiltin && (
                              <span className="text-xs text-green-600">Built-in</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                          <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>v{template.version}</span>
                            <span>{template.usageCount} uses</span>
                          </div>
                          {template.tags && template.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                              {template.tags.length > 3 && (
                                <span className="px-2 py-1 text-gray-500 text-xs">
                                  +{template.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Template List */
                    <div className="space-y-2">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  template.isBuiltin 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {template.category}
                                </span>
                                {template.isBuiltin && (
                                  <span className="text-xs text-green-600">Built-in</span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm">{template.description}</p>
                              {template.tags && template.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {template.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              <div>v{template.version}</div>
                              <div>{template.usageCount} uses</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Side - Project Details */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
            
            {/* Project Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Template Preview */}
            {selectedTemplate ? (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Template Details</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-2">{selectedTemplate.name}</h5>
                  <p className="text-sm text-gray-600 mb-3">{selectedTemplate.description}</p>
                  
                  {selectedTemplate.templateData.defaultSettings && (
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Standard Voltages:</span>
                        <div className="text-xs text-gray-700">
                          {selectedTemplate.templateData.defaultSettings.voltages.join('V, ')}V
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Cable Functions:</span>
                        <div className="text-xs text-gray-700">
                          {selectedTemplate.templateData.defaultSettings.cableFunctions.join(', ')}
                        </div>
                      </div>
                      {selectedTemplate.templateData.sampleData && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Sample Data Included:</span>
                          <div className="text-xs text-gray-700">
                            {selectedTemplate.templateData.sampleData.cables?.length || 0} cables,{' '}
                            {selectedTemplate.templateData.sampleData.loads?.length || 0} loads,{' '}
                            {selectedTemplate.templateData.sampleData.conduits?.length || 0} conduits
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Empty Project</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Starting from scratch gives you complete control over your project setup.
                    You'll start with empty tables and can configure everything yourself.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {selectedTemplate ? 'Create from Template' : 'Create Empty Project'}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionModal;