import { Cleaning } from '../types';
import { maskName, getCleaningStatus } from './helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export const processCSVData = async (data: any[]): Promise<{ cleanings: Cleaning[], properties: string[] }> => {
  const cleanings: Cleaning[] = [];
  const propertySet = new Set<string>();
  
  // Skip header row and process only valid rows
  const rows = data.slice(1).filter(row => Array.isArray(row) && row.length >= 9);
  
  for (const row of rows) {
    const propertyName = row[8]; // HouseName
    if (!propertyName) continue;
    
    const guestName = row[4]; // Name
    const arrivalDate = row[5]; // DateArrival
    const departureDate = row[6]; // DateDeparture
    const peopleCount = row[12] || '1'; // People
    
    propertySet.add(propertyName);
    
    const cleaning: Cleaning = {
      id: `${propertyName}-${departureDate}-${Date.now()}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
      property: propertyName,
      guest: guestName,
      maskedGuest: maskName(guestName),
      arrivalDate: new Date(arrivalDate).toISOString(),
      departureDate: new Date(departureDate).toISOString(),
      peopleCount: parseInt(peopleCount),
      status: getCleaningStatus(departureDate)
    };

    cleanings.push(cleaning);

    try {
      const { error } = await supabase
        .from('cleanings')
        .insert({
          id: cleaning.id,
          property: cleaning.property,
          guest: cleaning.guest,
          arrival_date: cleaning.arrivalDate,
          departure_date: cleaning.departureDate,
          people_count: cleaning.peopleCount,
          status: cleaning.status
        });

      if (error) {
        console.error('Error inserting cleaning:', error);
        throw new Error(`Error inserting cleaning: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in insert operation:', error);
      throw error;
    }
  }
  
  return {
    cleanings,
    properties: Array.from(propertySet)
  };
};