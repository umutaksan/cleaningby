import { Cleaner, Cleaning } from '../types';

export const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const getDayName = (dateString: string): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } catch (error) {
    console.error('Error getting day name:', error);
    return '';
  }
};

export const daysFromToday = (dateString: string): number => {
  try {
    if (!dateString) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) return 0;
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days from today:', error);
    return 0;
  }
};

export const isToday = (dateString: string): boolean => {
  try {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(dateString);
    if (isNaN(checkDate.getTime())) return false;
    checkDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === checkDate.getTime();
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

export const isWithinNextDays = (dateString: string, days: number): boolean => {
  try {
    const diff = daysFromToday(dateString);
    return diff >= 0 && diff <= days;
  } catch (error) {
    console.error('Error checking if date is within next days:', error);
    return false;
  }
};

export const isWithinNextMonth = (dateString: string): boolean => {
  try {
    if (!dateString) return false;
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    const checkDate = new Date(dateString);
    if (isNaN(checkDate.getTime())) return false;
    
    return checkDate >= today && checkDate <= nextMonth;
  } catch (error) {
    console.error('Error checking if date is within next month:', error);
    return false;
  }
};

export const maskName = (name: string): string => {
  if (!name || name.trim() === '') return 'A*** B***';
  
  return name.split(' ').map(part => {
    if (part.length === 0) return '*';
    return part[0] + '*'.repeat(Math.max(part.length - 1, 1));
  }).join(' ');
};

export const getCleaningStatus = (dateString: string): 'pending' | 'confirmed' | 'completed' => {
  try {
    const days = daysFromToday(dateString);
    if (days < 0) {
      return 'completed';
    } else if (days <= 14) {
      return 'confirmed';
    } else {
      return 'pending';
    }
  } catch (error) {
    console.error('Error getting cleaning status:', error);
    return 'pending';
  }
};

export const formatPrice = (price: number): string => {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  } catch (error) {
    console.error('Error formatting price:', error);
    return '€0.00';
  }
};

export const hasSameDayTurnover = (
  checkoutDate: string, 
  property: string,
  allCleanings: Array<{
    property: string;
    arrivalDate: string;
    departureDate: string;
  }>
): boolean => {
  try {
    if (!checkoutDate || !property) return false;
    const checkoutDateObj = new Date(checkoutDate);
    if (isNaN(checkoutDateObj.getTime())) return false;
    
    return allCleanings.some(cleaning => {
      if (cleaning.property === property) {
        const arrivalDate = new Date(cleaning.arrivalDate);
        if (isNaN(arrivalDate.getTime())) return false;
        return checkoutDateObj.toDateString() === arrivalDate.toDateString();
      }
      return false;
    });
  } catch (error) {
    console.error('Error checking for same day turnover:', error);
    return false;
  }
};

export const validateUser = (username: string, password: string): Cleaner | null => {
  if (username === 'cleaner1' && password === '123456') {
    return {
      id: 'cleaner-1',
      name: 'Cleaner 1',
      isAdmin: false
    };
  } else if (username === 'cleaner2' && password === '123456') {
    return {
      id: 'cleaner-2',
      name: 'Cleaner 2',
      isAdmin: false
    };
  } else if (username === 'umut' && password === '030924') {
    return {
      id: 'admin-1',
      name: 'Umut',
      isAdmin: true
    };
  }
  return null;
};

export const isNewCleaning = (cleaning: Cleaning): boolean => {
  const now = new Date();
  const createdAt = new Date(cleaning.createdAt);
  const hoursDiff = Math.abs(now.getTime() - createdAt.getTime()) / 36e5;
  return hoursDiff < 24;
};

export const formatTimeWithOrdinal = (date: Date): string => {
  const day = date.getDate();
  const suffix = ['th', 'st', 'nd', 'rd'][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10 ? day % 10 : 0)];
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).replace(/\d+/, day + suffix) + ', 11:00';
};

export const generateUpcomingCleaningsMessage = (cleanings: Cleaning[]): string => {
  // Sort all cleanings by date
  const sortedCleanings = [...cleanings].sort((a, b) => 
    new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
  );

  // Separate new and existing cleanings
  const newCleanings = sortedCleanings.filter(c => isNewCleaning(c));
  const existingCleanings = sortedCleanings.filter(c => !isNewCleaning(c));

  let message = 'Hello\n\n';

  // Add new cleanings section if there are any
  if (newCleanings.length > 0) {
    message += 'New\n';
    for (const cleaning of newCleanings) {
      const date = new Date(cleaning.departureDate);
      message += `* ${formatTimeWithOrdinal(date)} – ${cleaning.property}`;
      
      // Check for same-day turnover
      const sameDayTurnover = sortedCleanings.find(c => 
        c.property === cleaning.property && 
        new Date(c.arrivalDate).toDateString() === new Date(cleaning.departureDate).toDateString()
      );
      if (sameDayTurnover) {
        message += ' (Same-day turnover!)';
      }
      message += '\n';
    }
    message += '\n⸻\n\n';
  }

  // Add update section with all cleanings
  message += 'Update\n';
  for (const cleaning of sortedCleanings) {
    const date = new Date(cleaning.departureDate);
    message += `* ${formatTimeWithOrdinal(date)} – ${cleaning.property}`;
    
    // Check for same-day turnover
    const sameDayTurnover = sortedCleanings.find(c => 
      c.property === cleaning.property && 
      new Date(c.arrivalDate).toDateString() === new Date(cleaning.departureDate).toDateString()
    );
    if (sameDayTurnover) {
      message += ' (Same-day turnover!)';
    }
    message += '\n';
  }

  return encodeURIComponent(message);
};

export const generateWhatsAppMessage = (cleaning: Cleaning): string => {
  const date = new Date(cleaning.departureDate);
  const formattedDate = formatTimeWithOrdinal(date);
  let message = `Cleaning needed at ${cleaning.property}\n${formattedDate}\n${cleaning.maskedGuest} (${cleaning.peopleCount} guests)`;
  
  // Add same-day turnover warning if applicable
  const sameDayTurnover = cleaning.arrivalDate && 
    new Date(cleaning.departureDate).toDateString() === new Date(cleaning.arrivalDate).toDateString();
  if (sameDayTurnover) {
    message += '\n⚠️ Same-day turnover!';
  }
  
  return encodeURIComponent(message);
};