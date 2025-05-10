import React from 'react';
import { Users, AlertTriangle, CalendarClock, FileText, Share2, Bell } from 'lucide-react';
import { Cleaning } from '../types';
import { formatDate, getDayName, daysFromToday, isToday, isNewCleaning, generateWhatsAppMessage } from '../utils/helpers';

interface CleaningCardProps {
  cleaning: Cleaning;
  onClick: () => void;
  hasSameDayTurnover: boolean;
  hasNotes: boolean;
}

const CleaningCard: React.FC<CleaningCardProps> = ({
  cleaning,
  onClick,
  hasSameDayTurnover,
  hasNotes
}) => {
  const daysLeft = daysFromToday(cleaning.departureDate);
  const isNew = isNewCleaning(cleaning);
  
  let daysText = '';
  let daysClass = '';
  
  if (daysLeft === 0) {
    daysText = 'Today';
    daysClass = 'bg-red-100 text-red-800';
  } else if (daysLeft < 0) {
    daysText = `${Math.abs(daysLeft)} days ago`;
    daysClass = 'bg-gray-100 text-gray-600';
  } else {
    daysText = `In ${daysLeft} days`;
    if (daysLeft <= 3) {
      daysClass = 'bg-amber-100 text-amber-800';
    } else {
      daysClass = 'bg-blue-100 text-blue-800';
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = generateWhatsAppMessage(cleaning);
    window.open(`https://wa.me/905060688086?text=${message}`, '_blank');
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
        isToday(cleaning.departureDate) ? 'ring-2 ring-red-500 ring-opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-800 truncate" title={cleaning.property}>
            {cleaning.property}
          </h3>
          <div className="flex items-center space-x-2">
            {isNew && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center">
                <Bell className="h-3 w-3 mr-1" />
                NEW
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${daysClass}`}>
              {daysText}
            </span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <span className="mr-3">{cleaning.maskedGuest}</span>
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-1" />
            <span>{cleaning.peopleCount}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-3">
          <CalendarClock className="h-4 w-4 inline mr-1" />
          <span>
            {formatDate(cleaning.departureDate)} ({getDayName(cleaning.departureDate)})
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span 
            className={`text-xs px-2 py-1 rounded-full ${
              cleaning.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {cleaning.status === 'confirmed' ? 'Confirmed' : 'Pending'}
          </span>
          
          <div className="flex space-x-1">
            {hasNotes && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                Notes
              </span>
            )}
            
            {hasSameDayTurnover && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Same-day
              </span>
            )}

            <button
              onClick={handleShare}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center hover:bg-blue-200"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleaningCard;