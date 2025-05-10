import React, { useState, useEffect } from 'react';
import { Calendar, Home, Upload, Info } from 'lucide-react';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import TabNavigation from './components/TabNavigation';
import CleaningList from './components/CleaningList';
import CleaningDetailsModal from './components/CleaningDetailsModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import AdminPasswordModal from './components/AdminPasswordModal';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import { Cleaning, AppState, Tab, View, TimeFilter, StatusFilter, Cleaner } from './types';
import { processCSVData } from './utils/csvUtils';
import { validateUser } from './utils/helpers';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

function App() {
  const [appState, setAppState] = useState<AppState>({
    cleanings: [],
    filteredCleanings: [],
    notesData: {},
    currentView: 'date',
    currentTab: 'upcoming',
    currentTimeFilter: 'all',
    currentStatusFilter: 'all',
    currentCleaningId: null,
    properties: new Set<string>(),
    statusMessage: 'Please log in to continue',
  });

  const [showCleaningModal, setShowCleaningModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem('cleaningNotes');
    if (savedNotes) {
      setAppState(prev => ({
        ...prev,
        notesData: JSON.parse(savedNotes)
      }));
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    appState.cleanings,
    appState.currentTab,
    appState.currentTimeFilter,
    appState.currentStatusFilter
  ]);

  const handleLogin = (username: string, password: string) => {
    const user = validateUser(username, password);
    if (user) {
      setAppState(prev => ({
        ...prev,
        currentUser: user,
        statusMessage: `Welcome, ${user.name}!`
      }));
      setIsAdmin(user.isAdmin);
      setShowLoginModal(false);
    } else {
      alert('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setAppState(prev => ({
      ...prev,
      currentUser: undefined,
      statusMessage: 'Please log in to continue'
    }));
    setIsAdmin(false);
    setShowLoginModal(true);
  };

  const applyFilters = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filteredCleanings = [...appState.cleanings];

    // Filter by cleaner if not admin
    if (!isAdmin && appState.currentUser) {
      filteredCleanings = filteredCleanings.filter(cleaning => 
        cleaning.cleanerId === appState.currentUser?.id
      );
    }
    
    if (appState.currentTab === 'upcoming') {
      filteredCleanings = filteredCleanings.filter(cleaning => {
        const departureDate = new Date(cleaning.departureDate);
        departureDate.setHours(0, 0, 0, 0);
        return departureDate >= today;
      });
    } else if (appState.currentTab === 'past') {
      filteredCleanings = filteredCleanings.filter(cleaning => {
        const departureDate = new Date(cleaning.departureDate);
        departureDate.setHours(0, 0, 0, 0);
        return departureDate < today;
      });
    }
    
    if (appState.currentTimeFilter === 'week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      filteredCleanings = filteredCleanings.filter(cleaning => {
        const departureDate = new Date(cleaning.departureDate);
        return departureDate >= today && departureDate <= nextWeek;
      });
    } else if (appState.currentTimeFilter === 'month') {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      filteredCleanings = filteredCleanings.filter(cleaning => {
        const departureDate = new Date(cleaning.departureDate);
        return departureDate >= today && departureDate <= nextMonth;
      });
    }
    
    if (appState.currentStatusFilter === 'confirmed') {
      filteredCleanings = filteredCleanings.filter(cleaning => cleaning.status === 'confirmed');
    } else if (appState.currentStatusFilter === 'unconfirmed') {
      filteredCleanings = filteredCleanings.filter(cleaning => cleaning.status === 'pending');
    }
    
    filteredCleanings.sort((a, b) => {
      return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
    });
    
    setAppState(prev => ({
      ...prev,
      filteredCleanings
    }));
  };

  const handleCSVUpload = (file: File) => {
    if (!file) return;

    setAppState(prev => ({
      ...prev,
      statusMessage: 'Processing CSV file...'
    }));

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      
      if (!csvText) {
        setAppState(prev => ({
          ...prev,
          statusMessage: 'Error reading CSV file'
        }));
        return;
      }

      Papa.parse(csvText, {
        complete: (results) => {
          const { cleanings, properties } = processCSVData(results.data);
          
          setAppState(prev => ({
            ...prev,
            cleanings,
            properties: new Set(properties),
            statusMessage: `${cleanings.length} cleaning records loaded`,
          }));
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setAppState(prev => ({
            ...prev,
            statusMessage: 'Error processing CSV file'
          }));
        }
      });
    };
    
    reader.readAsText(file);
  };

  const handleViewChange = (view: View) => {
    setAppState(prev => ({
      ...prev,
      currentView: view
    }));
  };

  const handleTabChange = (tab: Tab) => {
    if ((tab === 'past' || tab === 'all') && !isAdmin) {
      setPendingTab(tab);
      setShowAdminModal(true);
    } else {
      setAppState(prev => ({
        ...prev,
        currentTab: tab
      }));
    }
  };

  const handleAdminPassword = (password: string) => {
    if (password === '290515') {
      setIsAdmin(true);
      if (pendingTab) {
        setAppState(prev => ({
          ...prev,
          currentTab: pendingTab
        }));
      }
      setShowAdminModal(false);
      setPendingTab(null);
    } else {
      alert('Incorrect password!');
    }
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setAppState(prev => ({
      ...prev,
      currentTimeFilter: filter
    }));
  };

  const handleStatusFilterChange = (filter: StatusFilter) => {
    setAppState(prev => ({
      ...prev,
      currentStatusFilter: filter
    }));
  };
  
  const handleCleaningClick = (cleaningId: string) => {
    // Only allow viewing cleanings assigned to the cleaner or if admin
    const cleaning = appState.cleanings.find(c => c.id === cleaningId);
    if (!isAdmin && cleaning?.cleanerId !== appState.currentUser?.id) {
      alert('You can only view cleanings assigned to you');
      return;
    }

    setAppState(prev => ({
      ...prev,
      currentCleaningId: cleaningId
    }));
    setShowCleaningModal(true);
  };

  const handleCloseModal = () => {
    setShowCleaningModal(false);
    setShowDeleteModal(false);
    setShowAdminModal(false);
  };

  const handleDeleteClick = () => {
    setShowCleaningModal(false);
    setShowDeleteModal(true);
  };

  const handleSaveNotes = (cleaningId: string, doorCode: string, notes: string, price: number, cleanerId?: string) => {
    const cleaning = appState.cleanings.find(c => c.id === cleaningId);
    
    if (!isAdmin && cleaning?.cleanerId !== appState.currentUser?.id) {
      alert('You can only modify cleanings assigned to you');
      return;
    }

    const updatedCleanings = appState.cleanings.map(cleaning => {
      if (cleaning.id === cleaningId) {
        return {
          ...cleaning,
          doorCode,
          notes,
          cleaningPrice: price,
          cleanerId: cleanerId || cleaning.cleanerId,
          cleanerName: cleanerId === 'cleaner-1' ? 'Cleaner 1' : cleanerId === 'cleaner-2' ? 'Cleaner 2' : cleaning.cleanerName,
          detailsLocked: true
        };
      }
      return cleaning;
    });
    
    setAppState(prev => ({
      ...prev,
      cleanings: updatedCleanings,
      statusMessage: 'Changes saved successfully'
    }));
    
    setShowCleaningModal(false);
    
    setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        statusMessage: 'Cleaning management system active'
      }));
    }, 2000);
  };

  const handleDeleteCleaning = (password: string) => {
    if (!isAdmin) {
      alert('Only admin can delete cleanings');
      return;
    }

    if (password !== '290515') {
      alert('Incorrect password!');
      return;
    }
    
    if (!appState.currentCleaningId) return;
    
    const updatedCleanings = appState.cleanings.filter(
      cleaning => cleaning.id !== appState.currentCleaningId
    );
    
    setAppState(prev => ({
      ...prev,
      cleanings: updatedCleanings,
      currentCleaningId: null,
      statusMessage: 'Cleaning record deleted'
    }));
    
    setShowDeleteModal(false);
  };

  const handleBulkPayment = (cleanerId: string, amount: number) => {
    const updatedCleanings = appState.cleanings.map(cleaning => {
      if (cleaning.cleanerId === cleanerId && cleaning.paymentStatus !== 'paid') {
        return {
          ...cleaning,
          paymentStatus: 'paid',
          price: amount
        };
      }
      return cleaning;
    });

    setAppState(prev => ({
      ...prev,
      cleanings: updatedCleanings,
      statusMessage: `Bulk payment processed for ${amount} EUR`
    }));
  };

  const handleUpdateCleaner = (cleanerId: string, newName: string) => {
    const updatedCleanings = appState.cleanings.map(cleaning => {
      if (cleaning.cleanerId === cleanerId) {
        return {
          ...cleaning,
          cleanerName: newName
        };
      }
      return cleaning;
    });

    setAppState(prev => ({
      ...prev,
      cleanings: updatedCleanings,
      statusMessage: 'Cleaner name updated successfully'
    }));
  };

  const handleAddCleaner = (username: string) => {
    const cleanerId = `cleaner-${Date.now()}`;
    
    setAppState(prev => ({
      ...prev,
      statusMessage: `New cleaner ${username} added successfully`
    }));

    setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        statusMessage: 'Cleaning management system active'
      }));
    }, 2000);
  };

  const getCurrentCleaning = () => {
    if (!appState.currentCleaningId) return null;
    return appState.cleanings.find(cleaning => cleaning.id === appState.currentCleaningId) || null;
  };
  
  const findNextGuest = (cleaning: Cleaning) => {
    if (!cleaning) return null;
    
    const checkoutDateObj = new Date(cleaning.departureDate);
    let nextGuest = null;
    let minDiff = Infinity;
    
    for (const potentialNext of appState.cleanings) {
      if (potentialNext.property === cleaning.property) {
        const arrivalDate = new Date(potentialNext.arrivalDate);
        
        if (arrivalDate >= checkoutDateObj) {
          const diffTime = arrivalDate.getTime() - checkoutDateObj.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < minDiff) {
            minDiff = diffDays;
            nextGuest = potentialNext;
          }
        }
      }
    }
    
    return nextGuest;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showLoginModal ? (
        <div className="min-h-screen bg-gray-50">
          <LoginModal onClose={() => {}} onLogin={handleLogin} />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <Header 
            onCSVUpload={handleCSVUpload}
            currentView={appState.currentView}
            onViewChange={handleViewChange}
            currentTimeFilter={appState.currentTimeFilter}
            onTimeFilterChange={handleTimeFilterChange}
            currentStatusFilter={appState.currentStatusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            isAdmin={isAdmin}
            onLogout={handleLogout}
          />
          
          <main className="container mx-auto px-4 py-6">
            <StatusBar 
              message={appState.statusMessage}
              count={appState.cleanings.length}
              cleanings={appState.cleanings}
              currentUser={appState.currentUser}
            />
            
            {appState.currentUser?.name === 'Umut' && (
              <AdminDashboard 
                onCSVUpload={handleCSVUpload}
                cleanings={appState.cleanings}
                onAddCleaning={(cleaning) => {
                  setAppState(prev => ({
                    ...prev,
                    cleanings: [...prev.cleanings, { id: Date.now().toString(), ...cleaning }]
                  }));
                }}
              />
            )}
            
            <TabNavigation 
              currentTab={appState.currentTab}
              onTabChange={handleTabChange}
            />
            
            <CleaningList 
              cleanings={appState.filteredCleanings}
              view={appState.currentView}
              tab={appState.currentTab}
              onCleaningClick={handleCleaningClick}
              notesData={appState.notesData}
              allCleanings={appState.cleanings}
            />
          </main>
          
          {showCleaningModal && (
            <CleaningDetailsModal
              cleaning={getCurrentCleaning()}
              notesData={appState.notesData}
              onClose={handleCloseModal}
              onSave={handleSaveNotes}
              onDelete={handleDeleteClick}
              nextGuest={getCurrentCleaning() ? findNextGuest(getCurrentCleaning()!) : null}
              isAdmin={isAdmin}
            />
          )}
          
          {showDeleteModal && (
            <DeleteConfirmModal
              onClose={handleCloseModal}
              onConfirm={handleDeleteCleaning}
            />
          )}

          {showAdminModal && (
            <AdminPasswordModal
              onClose={handleCloseModal}
              onConfirm={handleAdminPassword}
              title="Admin Access Required"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;