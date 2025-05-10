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
import { validateUser, maskName } from './utils/helpers';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

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

    // Load cleanings from Supabase on mount
    loadCleanings();
  }, []);

  const loadCleanings = async () => {
    try {
      const { data, error } = await supabase
        .from('cleanings')
        .select('*');

      if (error) {
        console.error('Error loading cleanings:', error);
        toast.error('Error loading cleanings');
        return;
      }

      if (data) {
        const formattedCleanings = data.map(cleaning => ({
          id: cleaning.id,
          property: cleaning.property,
          guest: cleaning.guest,
          maskedGuest: maskName(cleaning.guest),
          arrivalDate: cleaning.arrival_date,
          departureDate: cleaning.departure_date,
          peopleCount: cleaning.people_count,
          status: cleaning.status,
          cleanerId: cleaning.cleaner_id,
          cleanerName: cleaning.cleaner_name,
          price: cleaning.price,
          cleaningPrice: cleaning.cleaning_price,
          paymentStatus: cleaning.payment_status,
          notes: cleaning.notes,
          doorCode: cleaning.door_code,
          detailsLocked: true
        }));

        setAppState(prev => ({
          ...prev,
          cleanings: formattedCleanings,
          properties: new Set(formattedCleanings.map(c => c.property))
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error loading cleanings');
    }
  };

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
    
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      
      if (!csvText) {
        setAppState(prev => ({
          ...prev,
          statusMessage: 'Error reading CSV file'
        }));
        return;
      }

      Papa.parse(csvText, {
        complete: async (results) => {
          try {
            const { cleanings, properties } = await processCSVData(results.data);
            
            setAppState(prev => ({
              ...prev,
              cleanings,
              properties: new Set(properties),
              statusMessage: `${cleanings.length} cleaning records loaded and saved to database`,
            }));

            toast.success('CSV data successfully uploaded and saved');
          } catch (error) {
            console.error('Error processing CSV:', error);
            setAppState(prev => ({
              ...prev,
              statusMessage: 'Error processing CSV file'
            }));
            toast.error('Error saving CSV data');
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setAppState(prev => ({
            ...prev,
            statusMessage: 'Error processing CSV file'
          }));
          toast.error('Error parsing CSV file');
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

  const handleSaveNotes = async (cleaningId: string, doorCode: string, notes: string, price: number, cleanerId?: string) => {
    const cleaning = appState.cleanings.find(c => c.id === cleaningId);
    
    if (!isAdmin && cleaning?.cleanerId !== appState.currentUser?.id) {
      alert('You can only modify cleanings assigned to you');
      return;
    }

    // Update in Supabase
    const { error } = await supabase
      .from('cleanings')
      .update({
        door_code: doorCode,
        notes: notes,
        cleaning_price: price,
        cleaner_id: cleanerId,
        cleaner_name: cleanerId === 'cleaner-1' ? 'Cleaner 1' : cleanerId === 'cleaner-2' ? 'Cleaner 2' : cleaning?.cleanerName
      })
      .eq('id', cleaningId);

    if (error) {
      console.error('Error updating cleaning:', error);
      toast.error('Error saving changes');
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
    toast.success('Changes saved successfully');
    
    setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        statusMessage: 'Cleaning management system active'
      }));
    }, 2000);
  };

  const handleDeleteCleaning = async (password: string) => {
    if (!isAdmin) {
      alert('Only admin can delete cleanings');
      return;
    }

    if (password !== '290515') {
      alert('Incorrect password!');
      return;
    }
    
    if (!appState.currentCleaningId) return;

    // Delete from Supabase
    const { error } = await supabase
      .from('cleanings')
      .delete()
      .eq('id', appState.currentCleaningId);

    if (error) {
      console.error('Error deleting cleaning:', error);
      toast.error('Error deleting cleaning');
      return;
    }
    
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
    toast.success('Cleaning deleted successfully');
  };

  const handleBulkPayment = async (cleanerId: string, amount: number) => {
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

    // Update in Supabase
    for (const cleaning of updatedCleanings.filter(c => c.cleanerId === cleanerId)) {
      const { error } = await supabase
        .from('cleanings')
        .update({
          payment_status: 'paid',
          price: amount
        })
        .eq('id', cleaning.id);

      if (error) {
        console.error('Error updating payment status:', error);
        toast.error('Error processing bulk payment');
        return;
      }
    }

    setAppState(prev => ({
      ...prev,
      cleanings: updatedCleanings,
      statusMessage: `Bulk payment processed for ${amount} EUR`
    }));

    toast.success('Bulk payment processed successfully');
  };

  const handleUpdateCleaner = async (cleanerId: string, newName: string) => {
    const updatedCleanings = appState.cleanings.map(cleaning => {
      if (cleaning.cleanerId === cleanerId) {
        return {
          ...cleaning,
          cleanerName: newName
        };
      }
      return cleaning;
    });

    // Update in Supabase
    const { error } = await supabase
      .from('cleanings')
      .update({ cleaner_name: newName })
      .eq('cleaner_id', cleanerId);

    if (error) {
      console.error('Error updating cleaner name:', error);
      toast.error('Error updating cleaner name');
      return;
    }

    setAppState(prev => ({
      ...prev,
      cleanings: updatedCleanings,
      statusMessage: 'Cleaner name updated successfully'
    }));

    toast.success('Cleaner name updated successfully');
  };

  const handleAddCleaner = async (username: string) => {
    const cleanerId = `cleaner-${Date.now()}`;
    
    // Add cleaner to Supabase
    const { error } = await supabase
      .from('cleaners')
      .insert([
        {
          id: cleanerId,
          name: username,
          is_admin: false
        }
      ]);

    if (error) {
      console.error('Error adding cleaner:', error);
      toast.error('Error adding new cleaner');
      return;
    }
    
    setAppState(prev => ({
      ...prev,
      statusMessage: `New cleaner ${username} added successfully`
    }));

    toast.success('New cleaner added successfully');

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