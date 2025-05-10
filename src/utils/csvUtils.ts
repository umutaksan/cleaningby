import { Cleaning } from '../types';
import { maskName, getCleaningStatus } from './helpers';

export const processCSVData = (data: any[]): { cleanings: Cleaning[], properties: string[] } => {
  const cleanings: Cleaning[] = [];
  const propertySet = new Set<string>();
  
  data.forEach(row => {
    if (!Array.isArray(row) || row.length < 5) return; // Invalid row
    
    const propertyName = row[8]; // HouseName
    if (!propertyName) return; // Skip if no property name
    
    const guestName = row[4]; // Name
    const arrivalDate = row[5]; // DateArrival
    const departureDate = row[6]; // DateDeparture
    const peopleCount = row[12] || '1'; // People
    
    propertySet.add(propertyName);
    
    cleanings.push({
      id: `${propertyName}-${departureDate}`,
      property: propertyName,
      guest: guestName,
      maskedGuest: maskName(guestName),
      arrivalDate: arrivalDate,
      departureDate: departureDate,
      peopleCount: peopleCount,
      status: getCleaningStatus(departureDate)
    });
  });
  
  // Remove duplicate records
  const uniqueCleanings: Cleaning[] = [];
  const cleaningIds = new Set<string>();
  
  cleanings.forEach(cleaning => {
    if (!cleaningIds.has(cleaning.id)) {
      cleaningIds.add(cleaning.id);
      uniqueCleanings.push(cleaning);
    }
  });
  
  return {
    cleanings: uniqueCleanings,
    properties: Array.from(propertySet)
  };
};