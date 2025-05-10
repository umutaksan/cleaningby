import React, { useRef } from 'react';
import { Calendar, Home, LogOut } from 'lucide-react';
import { View, TimeFilter, StatusFilter } from '../types';

interface HeaderProps {
  onCSVUpload: (file: File) => void;
  currentView: View;
  onViewChange: (view: View) => void;
  currentTimeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  currentStatusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  currentTimeFilter,
  onTimeFilterChange,
  currentStatusFilter,
  onStatusFilterChange,
  isAdmin,
  onLogout
}) => {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center">
            <Calendar className="h-7 w-7 mr-2 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">L&D GUEST MARBELLA Cleaning Schedule</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex shadow-sm rounded-md overflow-hidden">
              <button
                onClick={() => onViewChange('date')}
                className={`flex items-center px-3 py-2 text-sm font-medium ${
                  currentView === 'date'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4 mr-1" />
                <span>Date View</span>
              </button>
              <button
                onClick={() => onViewChange('property')}
                className={`flex items-center px-3 py-2 text-sm font-medium ${
                  currentView === 'property'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="h-4 w-4 mr-1" />
                <span>Property View</span>
              </button>
            </div>
            
            <div className="flex justify-between space-x-2">
              <select
                value={currentTimeFilter}
                onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              >
                <option value="all">All Times</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              <select
                value={currentStatusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="unconfirmed">Unconfirmed</option>
              </select>

              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;