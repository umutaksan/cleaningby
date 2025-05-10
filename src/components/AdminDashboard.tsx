import React, { useState } from 'react';
import { FileSpreadsheet, Share2, DollarSign, Send } from 'lucide-react';
import { Cleaning } from '../types';
import { generateUpcomingCleaningsMessage, formatPrice } from '../utils/helpers';

interface AdminDashboardProps {
  onCSVUpload: (file: File) => void;
  cleanings: Cleaning[];
  onAddCleaning: (cleaning: Partial<Cleaning>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onCSVUpload,
  cleanings,
  onAddCleaning
}) => {
  const [editingPaidAmount, setEditingPaidAmount] = useState<{[key: string]: number}>({});
  const [extraPayments, setExtraPayments] = useState<{[key: string]: number}>({});
  const [totalRevenue, setTotalRevenue] = useState<{[key: string]: number}>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCSVUpload(file);
    }
  };

  const handleShareUpcoming = () => {
    const message = generateUpcomingCleaningsMessage(cleanings);
    window.open(`https://wa.me/905060688086?text=${message}`, '_blank');
  };

  // Group cleanings by cleaner
  const cleanerStats = cleanings.reduce((acc, cleaning) => {
    if (cleaning.cleanerId) {
      if (!acc[cleaning.cleanerId]) {
        acc[cleaning.cleanerId] = {
          name: cleaning.cleanerName || `Cleaner ${cleaning.cleanerId}`,
          totalCleaningPrice: 0,
          totalPaidAmount: 0,
          completedCleanings: 0
        };
      }
      acc[cleaning.cleanerId].totalCleaningPrice += cleaning.cleaningPrice || 0;
      acc[cleaning.cleanerId].totalPaidAmount += editingPaidAmount[cleaning.cleanerId] || cleaning.price || 0;
      if (cleaning.status === 'completed') {
        acc[cleaning.cleanerId].completedCleanings++;
      }
    }
    return acc;
  }, {} as Record<string, {
    name: string;
    totalCleaningPrice: number;
    totalPaidAmount: number;
    completedCleanings: number;
  }>);

  const handlePaidAmountChange = (cleanerId: string, amount: number) => {
    setEditingPaidAmount(prev => ({
      ...prev,
      [cleanerId]: amount
    }));
  };

  const handleExtraPaymentChange = (cleanerId: string, amount: number) => {
    setExtraPayments(prev => ({
      ...prev,
      [cleanerId]: amount
    }));
  };

  const handleSendPendingAmount = (cleanerId: string, stats: any) => {
    const pendingAmount = Math.max(0, stats.totalCleaningPrice - (editingPaidAmount[cleanerId] || stats.totalPaidAmount));
    setTotalRevenue(prev => ({
      ...prev,
      [cleanerId]: pendingAmount
    }));
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Admin Controls</h2>
        <div className="flex gap-2">
          <button
            onClick={handleShareUpcoming}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Upcoming
          </button>

          <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(cleanerStats).map(([cleanerId, stats]) => (
            <div key={cleanerId} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-700">{stats.name}</h4>
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {stats.completedCleanings} cleanings
                </span>
              </div>
              
              <div className="space-y-6">
                {/* Total Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-700">Total Revenue:</span>
                    <span className="text-lg font-semibold text-blue-800">
                      {formatPrice(totalRevenue[cleanerId] || 0)}
                    </span>
                  </div>
                </div>

                {/* Cleaning Payments */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-semibold text-blue-600 mb-3">Cleaning Payments</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Cleaning Price:</span>
                      <span className="font-medium text-gray-900">{formatPrice(stats.totalCleaningPrice)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Paid Amount:</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={editingPaidAmount[cleanerId] || stats.totalPaidAmount}
                          onChange={(e) => handlePaidAmountChange(cleanerId, Number(e.target.value))}
                          className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-right w-32"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Pending Amount:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-600">
                          {formatPrice(Math.max(0, stats.totalCleaningPrice - (editingPaidAmount[cleanerId] || stats.totalPaidAmount)))}
                        </span>
                        <button
                          onClick={() => handleSendPendingAmount(cleanerId, stats)}
                          className="inline-flex items-center p-1 text-blue-600 hover:text-blue-700"
                          title="Send to Total Revenue"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;