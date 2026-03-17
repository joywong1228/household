import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('date_added', { ascending: false });

    if (error) throw error;

    // Grouping by: Location -> Spot -> Collector
    const grouped: any = {};

    data.forEach(item => {
      const loc = item.location;
      const spot = item.spot || ''; // Use empty string if null
      const coll = item.collector || 'none'; // Group items with no collector under 'none'

      if (!grouped[loc]) grouped[loc] = {};
      if (!grouped[loc][spot]) grouped[loc][spot] = {};
      if (!grouped[loc][spot][coll]) grouped[loc][spot][coll] = [];

      grouped[loc][spot][coll].push({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        dateAdded: item.date_added
      });
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
    const items: any[] = [];

    // Flattening logic: Location -> Spot -> Collector -> Item
    for (const location in newData) {
      for (const spot in newData[location]) {
        for (const collector in newData[location][spot]) {
          newData[location][spot][collector].forEach((item: any) => {
            items.push({
              location,
              spot,
              collector: collector === 'none' ? null : collector, // Convert 'none' back to NULL
              name: item.name,
              quantity: item.quantity,
              date_added: item.dateAdded || new Date().toISOString()
            });
          });
        }
      }
    }

    // Optional: Overwrite logic for specific locations
    for (const location in newData) {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('location', location);

      if (deleteError) throw deleteError;
    }

    const { error } = await supabase.from('items').insert(items);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}