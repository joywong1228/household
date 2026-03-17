import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) throw error;

    // Group by location and spot
    const grouped: { [location: string]: { [spot: string]: any[] } } = {};
    data.forEach(row => {
      if (!grouped[row.location]) grouped[row.location] = {};
      grouped[row.location][row.spot] = row.items;
    });

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newData = await request.json();

    // Flatten the data for insertion
    const rows = [];
    for (const location in newData) {
      for (const spot in newData[location]) {
        rows.push({
          location,
          spot,
          items: newData[location][spot]
        });
      }
    }

    // Upsert the rows
    const { error } = await supabase
      .from('inventory')
      .upsert(rows, { onConflict: 'location,spot' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}