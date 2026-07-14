const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, 'src', 'environments');

// Pastikan direktori src/environments ada
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Membaca variable dari process.env (Vercel atau local environment)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const envConfigFile = `export const environment = {
  production: false,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}'
};
`;

const envConfigProdFile = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}'
};
`;

// Tulis file environment.ts dan environment.prod.ts
try {
  fs.writeFileSync(path.join(envDir, 'environment.ts'), envConfigFile, 'utf8');
  console.log('File environment.ts berhasil dibuat.');
  
  fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), envConfigProdFile, 'utf8');
  console.log('File environment.prod.ts berhasil dibuat.');
  
  console.log('Konfigurasi environment berhasil digenerate secara otomatis!');
} catch (error) {
  console.error('Gagal menulis file environment:', error);
  process.exit(1);
}
