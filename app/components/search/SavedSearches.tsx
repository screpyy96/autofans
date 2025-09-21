import React, { useState } from 'react';
import type { SavedSearch, FilterState } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatDate } from '../../utils/helpers';

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onCreateSearch: (name: string, filters: FilterState, alertsEnabled: boolean) => void;
  onUpdateSearch: (searchId: string, updates: Partial<SavedSearch>) => void;
  onDeleteSearch: (searchId: string) => void;
  onExecuteSearch: (filters: FilterState) => void;
  currentFilters?: FilterState;
  className?: string;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  savedSearches,
  onCreateSearch,
  onUpdateSearch,
  onDeleteSearch,
  onExecuteSearch,
  currentFilters,
  className = ''
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [searchName, setSearchName] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const handleCreateSearch = () => {
    if (searchName.trim() && currentFilters) {
      onCreateSearch(searchName.trim(), currentFilters, alertsEnabled);
      setSearchName('');
      setAlertsEnabled(true);
      setIsCreateModalOpen(false);
    }
  };

  const handleUpdateSearch = (search: SavedSearch, updates: Partial<SavedSearch>) => {
    onUpdateSearch(search.id, updates);
    setEditingSearch(null);
  };

  const getFilterSummary = (filters: FilterState): string => {
    const parts: string[] = [];
    
    if (filters.brand?.length) {
      parts.push(`Marca: ${filters.brand.join(', ')}`);
    }
    if (filters.priceRange) {
      parts.push(`Preț: ${filters.priceRange.min} - ${filters.priceRange.max} RON`);
    }
    if (filters.yearRange) {
      parts.push(`An: ${filters.yearRange.min} - ${filters.yearRange.max}`);
    }
    if (filters.fuelType?.length) {
      parts.push(`Combustibil: ${filters.fuelType.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Toate mașinile';
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Căutări Salvate
        </h2>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!currentFilters}
          size="sm"
        >
          Salvează Căutarea
        </Button>
      </div>  
    {savedSearches.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nicio căutare salvată
          </h3>
          <p className="text-gray-600 mb-4">
            Salvează căutările tale pentru a le accesa rapid mai târziu
          </p>
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!currentFilters}
          >
            Salvează căutarea curentă
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <Card key={search.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{search.name}</h3>
                    {search.alertsEnabled && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        Alerte
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getFilterSummary(search.filters)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Salvată pe {formatDate(search.createdAt)}
                    {search.lastNotified && ` • Ultima alertă: ${formatDate(search.lastNotified)}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExecuteSearch(search.filters)}
                  >
                    Caută
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSearch(search)}
                  >
                    Editează
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteSearch(search.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Șterge
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Search Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Salvează Căutarea"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nume căutare
            </label>
            <Input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="ex: BMW Seria 3 sub 30.000 RON"
              className="w-full"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="alerts"
              checked={alertsEnabled}
              onChange={(e) => setAlertsEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="alerts" className="ml-2 text-sm text-gray-700">
              Primește alerte pentru anunțuri noi care se potrivesc acestei căutări
            </label>
          </div>

          {currentFilters && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Filtre curente:</p>
              <p className="text-sm text-gray-600">{getFilterSummary(currentFilters)}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Anulează
            </Button>
            <Button
              onClick={handleCreateSearch}
              disabled={!searchName.trim()}
            >
              Salvează
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Search Modal */}
      {editingSearch && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSearch(null)}
          title="Editează Căutarea"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nume căutare
              </label>
              <Input
                value={editingSearch.name}
                onChange={(e) => setEditingSearch({ ...editingSearch, name: e.target.value })}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-alerts"
                checked={editingSearch.alertsEnabled}
                onChange={(e) => setEditingSearch({ ...editingSearch, alertsEnabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="edit-alerts" className="ml-2 text-sm text-gray-700">
                Primește alerte pentru anunțuri noi
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingSearch(null)}
              >
                Anulează
              </Button>
              <Button
                onClick={() => handleUpdateSearch(editingSearch, {
                  name: editingSearch.name,
                  alertsEnabled: editingSearch.alertsEnabled
                })}
              >
                Salvează
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};