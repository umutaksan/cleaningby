import React from 'react';
import { Info, DollarSign } from 'lucide-react';
import { formatPrice } from '../utils/helpers';
import { Cleaning } from '../types';

interface StatusBarProps {
  message: string;
  count: number;
  cleanings: Cleaning[];
  currentUser?: { id: string; isAdmin: boolean };
}

const StatusBar: React.FC<StatusBarProps> = ({ message, count, cleanings, currentUser }) => {
  // Filter cleanings based on user role
  const userCleanings = currentUser?.isAdmin 
    ? cleanings 
    : cleanings.filter(c => c.cleanerId === currentUser?.id);

  // Calculate totals
  const totalCleaningPrice = userCleanings.reduce((sum, cleaning) => sum + (cleaning.cleaningPrice || 0), 0);
  const totalPaidAmount = userCleanings.reduce((sum, cleaning) => sum + (cleaning.price || 0), 0);
  const pendingAmount = Math.max(0, totalCleaningPrice - totalPaidAmount);

  const completedCleanings = userCleanings.filter(c => c.status === 'completed').length;
  const pendingCleanings = userCleanings.filter(c => c.status === 'pending').length;

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div className="flex items-center text-gray-600 mb-4">
        <Info className="h-5 w-5 mr-2 text-blue-500" />
        <span>{message}</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-600 mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-blue-800">{formatPrice(totalCleaningPrice)}</div>
          <div className="mt-2 text-sm text-blue-600">
            <span className="font-medium">{formatPrice(totalPaidAmount)}</span> paid •
            <span className="font-medium ml-1">{formatPrice(pendingAmount)}</span> pending
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Total</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {userCleanings.length}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-green-600">Completed</div>
              <div className="mt-1 text-xl font-semibold text-green-800">
                {completedCleanings}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-yellow-600">Pending</div>
              <div className="mt-1 text-xl font-semibold text-yellow-800">
                {pendingCleanings}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;