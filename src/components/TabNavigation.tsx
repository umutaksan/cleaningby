import React from 'react';
import { CalendarCheck, CalendarX, Calendar } from 'lucide-react';
import { Tab } from '../types';

interface TabNavigationProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('upcoming')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
            currentTab === 'upcoming'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          Upcoming Cleanings
        </button>
        <button
          onClick={() => onTabChange('past')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
            currentTab === 'past'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CalendarX className="h-4 w-4 mr-2" />
          Past Cleanings
        </button>
        <button
          onClick={() => onTabChange('all')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
            currentTab === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          All Cleanings
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;