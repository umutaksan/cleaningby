import React from 'react';
import { Calendar, Home } from 'lucide-react';
import CleaningCard from './CleaningCard';
import { Cleaning, View, Tab, NotesData } from '../types';
import { formatDate, getDayName, hasSameDayTurnover } from '../utils/helpers';

interface CleaningListProps {
  cleanings: Cleaning[];
  view: View;
  tab: Tab;
  onCleaningClick: (cleaningId: string) => void;
  notesData: NotesData;
  allCleanings: Cleaning[];
}

const CleaningList: React.FC<CleaningListProps> = ({
  cleanings,
  view,
  tab,
  onCleaningClick,
  notesData,
  allCleanings
}) => {
  if (cleanings.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center">
        <div className="flex flex-col items-center justify-center text-gray-400">
          {tab === 'upcoming' ? (
            <Calendar className="h-12 w-12 mb-3 text-gray-300" />
          ) : tab === 'past' ? (
            <Calendar className="h-12 w-12 mb-3 text-gray-300" />
          ) : (
            <Calendar className="h-12 w-12 mb-3 text-gray-300" />
          )}
          <p className="text-lg">No cleaning records found for the selected filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {view === 'date' ? (
        // Date view
        renderDateView(cleanings, onCleaningClick, notesData, allCleanings)
      ) : (
        // Property view
        renderPropertyView(cleanings, onCleaningClick, notesData, allCleanings)
      )}
    </div>
  );
};

const renderDateView = (
  cleanings: Cleaning[],
  onCleaningClick: (cleaningId: string) => void,
  notesData: NotesData,
  allCleanings: Cleaning[]
) => {
  // Group cleanings by date
  const cleaningsByDate: { [key: string]: Cleaning[] } = {};
  
  cleanings.forEach(cleaning => {
    const formattedDate = formatDate(cleaning.departureDate);
    if (!cleaningsByDate[formattedDate]) {
      cleaningsByDate[formattedDate] = [];
    }
    cleaningsByDate[formattedDate].push(cleaning);
  });
  
  return Object.entries(cleaningsByDate).map(([date, cleaningsOnDate]) => (
    <div key={date} className="space-y-4">
      <div className="bg-gray-50 py-2 px-4 rounded-md border-l-4 border-blue-500 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-blue-500" />
        <h3 className="text-lg font-medium text-gray-700">
          {date} ({getDayName(cleaningsOnDate[0].departureDate)})
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cleaningsOnDate.map(cleaning => (
          <CleaningCard
            key={cleaning.id}
            cleaning={cleaning}
            onClick={() => onCleaningClick(cleaning.id)}
            hasSameDayTurnover={hasSameDayTurnover(
              cleaning.departureDate,
              cleaning.property,
              allCleanings
            )}
            hasNotes={!!notesData[cleaning.id]}
          />
        ))}
      </div>
    </div>
  ));
};

const renderPropertyView = (
  cleanings: Cleaning[],
  onCleaningClick: (cleaningId: string) => void,
  notesData: NotesData,
  allCleanings: Cleaning[]
) => {
  // Group cleanings by property
  const cleaningsByProperty: { [key: string]: Cleaning[] } = {};
  
  cleanings.forEach(cleaning => {
    if (!cleaningsByProperty[cleaning.property]) {
      cleaningsByProperty[cleaning.property] = [];
    }
    cleaningsByProperty[cleaning.property].push(cleaning);
  });
  
  // Sort properties alphabetically
  const sortedProperties = Object.keys(cleaningsByProperty).sort();
  
  return sortedProperties.map(property => (
    <div key={property} className="space-y-4">
      <div className="bg-gray-50 py-2 px-4 rounded-md border-l-4 border-green-500 flex items-center">
        <Home className="h-5 w-5 mr-2 text-green-500" />
        <h3 className="text-lg font-medium text-gray-700">{property}</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cleaningsByProperty[property]
          .sort((a, b) => 
            new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
          )
          .map(cleaning => (
            <CleaningCard
              key={cleaning.id}
              cleaning={cleaning}
              onClick={() => onCleaningClick(cleaning.id)}
              hasSameDayTurnover={hasSameDayTurnover(
                cleaning.departureDate,
                cleaning.property,
                allCleanings
              )}
              hasNotes={!!notesData[cleaning.id]}
            />
          ))}
      </div>
    </div>
  ));
};

export default CleaningList;