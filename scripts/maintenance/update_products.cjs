const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const envPath = fs.existsSync(path.join(__dirname, '..', '..', '.env')) ? path.join(__dirname, '..', '..', '.env') : path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  const val = t.slice(eq + 1).trim().replace(/^\"|\"$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function cleanTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  const dir = path.join(__dirname, '..', 'Products');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') || f.endsWith('.ods'));

  const { data: dbProducts } = await supabase.from('products').select('*');
  let updatedCount = 0;

  for (const file of files) {
    try {
      const workbook = xlsx.readFile(path.join(dir, file));
      const sheetName = workbook.SheetNames[0];
      // Use header: 1 to get arrays of rows (ignore missing headers)
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      
      for (const row of data) {
        if (!row || !Array.isArray(row)) continue;
        
        let titleFound = null;
        let dbMatched = null;
        
        // Find which product this row matches
        for (const cell of row) {
          if (typeof cell !== 'string') continue;
          const cleanCell = cleanTitle(cell);
          if (cleanCell.length < 5) continue; // too short to match
          
          for (const dbP of dbProducts) {
             const cleanDb = cleanTitle(dbP.title);
             if (cleanCell.includes(cleanDb) || cleanDb.includes(cleanCell)) {
                titleFound = cell;
                dbMatched = dbP;
                break;
             }
          }
          if (dbMatched) break;
        }

        if (dbMatched) {
          // Found a match! Now extract image URL and description
          let image_url = null;
          let description = null;
          
          for (const cell of row) {
            if (typeof cell !== 'string' || cell === titleFound) continue;
            
            // Heuristic for image URL
            if ((cell.startsWith('http') || cell.includes('imgproxy')) && (cell.includes('.jpg') || cell.includes('.png') || cell.includes('ar:1'))) {
               if (!image_url) image_url = cell;
            }
            // Heuristic for description
            else if (cell.length > 50 && (cell.includes('✅') || cell.includes('⭐') || cell.includes('\n'))) {
               if (!description) description = cell;
            }
          }

          const updates = {};
          if (description && dbMatched.description !== description) updates.description = description;
          if (image_url && dbMatched.image_url !== image_url) updates.image_url = image_url;

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from('products').update(updates).eq('id', dbMatched.id);
            if (!error) {
               console.log(`Updated [${dbMatched.title}] with new description/image!`);
               // update local memory so we don't update same fields repeatedly
               if (updates.description) dbMatched.description = updates.description;
               if (updates.image_url) dbMatched.image_url = updates.image_url;
               updatedCount++;
            }
          }
        }
      }
    } catch(e) {}
  }

  console.log(`Successfully updated ${updatedCount} products from spreadsheets.`);
}

run();
