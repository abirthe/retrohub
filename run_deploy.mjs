import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';
import path from 'path';

async function downloadSupabaseCli() {
  console.log('Fetching latest release info...');
  const res = await fetch('https://api.github.com/repos/supabase/cli/releases/latest');
  const data = await res.json();
  const asset = data.assets.find(a => a.name.includes('windows_amd64.zip'));
  
  if (!asset) {
    console.error('Asset not found');
    process.exit(1);
  }

  const zipUrl = asset.browser_download_url;
  console.log(`Downloading from ${zipUrl}...`);
  
  const dest = path.join(process.cwd(), 'supabase_cli.zip');
  
  return new Promise((resolve, reject) => {
    https.get(zipUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res2) => {
          const file = fs.createWriteStream(dest);
          res2.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }
    }).on('error', reject);
  });
}

async function run() {
  try {
    await downloadSupabaseCli();
    console.log('Downloaded. Extracting...');
    execSync('powershell -Command "Expand-Archive -Path supabase_cli.zip -DestinationPath . -Force"', { stdio: 'inherit' });
    console.log('Extracted. Deploying functions...');
    execSync('.\\supabase.exe functions deploy customer-bot --no-verify-jwt', { stdio: 'inherit' });
    execSync('.\\supabase.exe functions deploy telegram-webhook --no-verify-jwt', { stdio: 'inherit' });
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}

run();
