// import { createClient } from '@supabase/supabase-js';

// const supabase = createClient('https://pxivrjixrniyltkuywqb.supabase.co', 'sb_publishable_meZ3VawqJszK9YH4V777Ow_PM1ijG0U');

// const seedData = {
//   "under bed": {
//     "purple bag": [
//       { name: "櫻蘭被from kelly", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "root 外套 （灰）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "夏油傑 t shirt （藍）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "寄生獸 t shirt （白）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "巨人 t shirt （白）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "比卡超 t shirt （黑）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "碎花 t shirt （白）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "xxxholic t shirt （黑）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "sweden 彩虹裙 （黑）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "泡泡袖 t shirt （粉）", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "best western hoodie S", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "all 冷衫", quantity: 1, dateAdded: new Date().toISOString() }
//     ],
//     "white plastic bag": [
//       { name: "movie ticket file", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "JB folder", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "slam dunk newspaper", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "nightstand light box", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "PP's zipper wallet", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "Ontario license plate", quantity: 1, dateAdded: new Date().toISOString() },
//       { name: "OOR towel", quantity: 1, dateAdded: new Date().toISOString() }
//     ]
//   }
// };

// async function seed() {
//   // Ensure we don't duplicate entries when the script is run multiple times
//   for (const location in seedData) {
//     for (const spot in seedData[location]) {
//       const { error: deleteError } = await supabase
//         .from('items')
//         .delete()
//         .eq('location', location)
//         .eq('spot', spot);

//       if (deleteError) {
//         console.error('Error clearing existing items for', location, spot, deleteError);
//         return;
//       }
//     }
//   }

//   const items = [];
//   for (const location in seedData) {
//     for (const spot in seedData[location]) {
//       seedData[location][spot].forEach(item => {
//         items.push({
//           location,
//           spot,
//           name: item.name,
//           quantity: item.quantity,
//           date_added: item.dateAdded
//         });
//       });
//     }
//   }

//   const { error } = await supabase
//     .from('items')
//     .insert(items);

//   if (error) {
//     console.error('Error seeding data:', error);
//   } else {
//     console.log('Data seeded successfully');
//   }
// }

// seed();