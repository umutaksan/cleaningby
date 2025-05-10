export type Cleaning = {
  id: string;
  property: string;
  guest: string;
  maskedGuest: string;
  arrivalDate: string;
  departureDate: string;
  peopleCount: number;
  status: 'pending' | 'confirmed' | 'completed';
  cleanerId?: string;
  cleanerName?: string;
  price?: number;
  cleaningPrice?: number;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  notes?: string;
  doorCode?: string;
  detailsLocked?: boolean;
  editRequest?: boolean;
  isNew?: boolean;
  addedAt?: number;
  createdAt?: string;
};

export type Cleaner = {
  id: string;
  name: string;
  isAdmin: boolean;
};

export type NotesData = {
  [key: string]: {
    doorCode: string;
    notes: string;
  };
};

export type AppState = {
  cleanings: Cleaning[];
  filteredCleanings: Cleaning[];
  notesData: NotesData;
  currentView: View;
  currentTab: Tab;
  currentTimeFilter: TimeFilter;
  currentStatusFilter: StatusFilter;
  currentCleaningId: string | null;
  properties: Set<string>;
  statusMessage: string;
  currentUser?: Cleaner;
};

export type View = 'date' | 'property';
export type Tab = 'upcoming' | 'past' | 'all';
export type TimeFilter = 'all' | 'week' | 'month';
export type StatusFilter = 'all' | 'confirmed' | 'unconfirmed';