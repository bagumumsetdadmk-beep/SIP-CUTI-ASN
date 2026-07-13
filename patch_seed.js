const fs = require('fs');
let code = fs.readFileSync('src/server.ts', 'utf8');

const patchEndpoint = (endpoint, table, dbKey) => {
  const regex = new RegExp(\`app\\.get\\('/api/\${endpoint}', async \\(req, res\\) => \\{\\s*const supa = await trySupabaseGet\\('\${table}'\\);\\s*if \\(supa\\) \\{\\s*(?:const mapped = supa\\.map.*?\\s*res\\.json\\(mapped\\);|res\\.json\\(supa\\);)\\s*\\} else \\{\\s*res\\.json\\(db\\.\${dbKey}\\);\\s*\\}\\s*\\}\\);\`, 's');

  const match = code.match(regex);
  if (match) {
    const replacement = \`app.get('/api/\${endpoint}', async (req, res) => {
  const supa = await trySupabaseGet('\${table}');
  if (supa) {
    if (supa.length === 0 && Array.isArray(db.\${dbKey})) {
      console.log('\${table} is empty. Seeding default data...');
      for (const item of db.\${dbKey}) {
        await trySupabaseWrite('\${table}', 'POST', item);
      }
      res.json(db.\${dbKey});
      return;
    } else if (supa.length === 0 && !Array.isArray(db.\${dbKey})) {
      console.log('\${table} is empty. Seeding default data...');
      await trySupabaseWrite('\${table}', 'POST', db.\${dbKey});
      res.json(db.\${dbKey});
      return;
    }
    const mapped = supa.map((u: any) => ({
      ...u,
      id: u.id !== undefined ? String(u.id) : ''
    }));
    res.json(mapped);
  } else {
    res.json(db.\${dbKey});
  }
});\`;
    code = code.replace(regex, replacement);
  }
};

patchEndpoint('pegawai', 'pegawai', 'pegawai');
patchEndpoint('hari-libur', 'hari_libur', 'hariLibur');
patchEndpoint('atasan-pejabat', 'atasan_pejabat', 'atasanPejabat');
patchEndpoint('jenis-cuti', 'jenis_cuti', 'jenisCuti');
patchEndpoint('sisa-cuti', 'sisa_cuti', 'sisaCuti');

fs.writeFileSync('src/server.ts', code);
console.log("Patched auto-seed successfully");
