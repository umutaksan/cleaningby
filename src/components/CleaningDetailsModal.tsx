import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, AlertTriangle, DollarSign, Lock, Unlock, ExternalLink } from 'lucide-react';
import { Cleaning, NotesData } from '../types';
import { formatDate, getDayName, formatPrice } from '../utils/helpers';

interface CleaningDetailsModalProps {
  cleaning: Cleaning | null;
  notesData: NotesData;
  onClose: () => void;
  onSave: (cleaningId: string, doorCode: string, notes: string, price: number, cleanerId?: string) => void;
  onDelete: () => void;
  nextGuest: Cleaning | null;
  isAdmin: boolean;
}

const propertyLinks = {
  'Marbella Old Town': 'www.guidemarbella.com/oldtown',
  'Playa de la Fontanilla Marbella': 'www.guidemarbella.com/cibeles',
  'Jardines Tropicales-Puerto Banús': 'www.guidemarbella.com/jardinestropicales',
  'Aloha Pueblo': 'www.guidemarbella.com/aloha'
};

const CleaningDetailsModal: React.FC<CleaningDetailsModalProps> = ({
  cleaning,
  notesData,
  onClose,
  onSave,
  onDelete,
  nextGuest,
  isAdmin
}) => {
  const [doorCode, setDoorCode] = useState('');
  const [notes, setNotes] = useState('');
  const [cleaningPrice, setCleaningPrice] = useState<number>(0);
  const [selectedCleaner, setSelectedCleaner] = useState<string>('');
  
  useEffect(() => {
    if (cleaning) {
      setDoorCode(cleaning.doorCode || '');
      setNotes(cleaning.notes || '');
      setCleaningPrice(cleaning.cleaningPrice || 0);
      setSelectedCleaner(cleaning.cleanerId || '');
    }
  }, [cleaning]);
  
  const handleSave = () => {
    if (cleaning) {
      onSave(cleaning.id, doorCode, notes, cleaningPrice, selectedCleaner);
    }
  };
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!cleaning) return null;

  const hasSameDay = nextGuest && 
    new Date(cleaning.departureDate).toDateString() === new Date(nextGuest.arrivalDate).toDateString();

  const isPriceLocked = cleaning.cleaningPrice && cleaning.cleaningPrice > 0;
  const propertyLink = Object.entries(propertyLinks).find(([key]) => 
    cleaning.property.toLowerCase().includes(key.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">{cleaning.property}</h2>
            {propertyLink && (
              <a 
                href={`https://${propertyLink[1]}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-700 flex items-center"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Guest</div>
                <div className="mt-1 text-gray-900">{cleaning.maskedGuest}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">People</div>
                <div className="mt-1 flex items-center text-gray-900">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{cleaning.peopleCount}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Checkout Date</div>
                <div className="mt-1 flex items-start text-gray-900">
                  <Calendar className="h-4 w-4 mr-1 mt-1 text-gray-500" />
                  <span>
                    {formatDate(cleaning.departureDate)}
                    <div className="text-sm text-gray-500">
                      {getDayName(cleaning.departureDate)}
                    </div>
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="mt-1">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cleaning.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : cleaning.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {cleaning.status.charAt(0).toUpperCase() + cleaning.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cleaner Assignment (Admin Only) */}
          {isAdmin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Cleaner
              </label>
              <select
                value={selectedCleaner}
                onChange={(e) => setSelectedCleaner(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a cleaner</option>
                <option value="cleaner-1">Cleaner 1</option>
                <option value="cleaner-2">Cleaner 2</option>
              </select>
            </div>
          )}

          {/* Payment Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cleaning Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={cleaningPrice}
                  onChange={(e) => setCleaningPrice(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isPriceLocked}
                />
              </div>
              {isPriceLocked && (
                <p className="mt-1 text-sm text-gray-500 flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Price is locked after first entry
                </p>
              )}
            </div>
          </div>

          {/* Next Guest Info */}
          {nextGuest && (
            <div className={`mb-6 p-4 rounded-lg ${
              hasSameDay ? 'bg-red-50 border-l-4 border-red-500' : 'bg-blue-50 border-l-4 border-blue-500'
            }`}>
              <div className="flex items-start">
                {hasSameDay && (
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className={`text-base font-medium ${hasSameDay ? 'text-red-800' : 'text-blue-800'}`}>
                    {hasSameDay ? 'Same-day Turnover!' : 'Next Guest'}
                  </h3>
                  
                  <div className="mt-2 space-y-2">
                    <div className="flex">
                      <span className="text-sm font-medium mr-2 w-20">Name:</span>
                      <span className={`text-sm ${hasSameDay ? 'text-red-700' : 'text-blue-700'}`}>
                        {nextGuest.maskedGuest}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-sm font-medium mr-2 w-20">People:</span>
                      <span className={`text-sm ${hasSameDay ? 'text-red-700' : 'text-blue-700'}`}>
                        {nextGuest.peopleCount}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-sm font-medium mr-2 w-20">Check-in:</span>
                      <span className={`text-sm ${hasSameDay ? 'text-red-700' : 'text-blue-700'}`}>
                        {formatDate(nextGuest.arrivalDate)} ({getDayName(nextGuest.arrivalDate)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Door Code
              </label>
              <input
                type="text"
                value={doorCode}
                onChange={(e) => setDoorCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter door code"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cleaning Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Add cleaning notes here..."
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
          
          {isAdmin && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleaningDetailsModal;