import dotenv from 'dotenv';

console.log('cwd', process.cwd());

dotenv.config({ path: './.env.local' });

console.log('dotenv loaded url', process.env.NEXT_PUBLIC_SUPABASE_URL, 'key?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

import { supabase } from '../src/lib/supabase';

(async () => {
  const { data, error } = await supabase.from('items').select('*');
  console.log('count', data?.length, 'error', error);
})();
