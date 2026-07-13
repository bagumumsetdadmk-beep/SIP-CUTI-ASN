import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import fs from 'node:fs';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json({limit: '20mb'}));

const angularApp = new AngularNodeAppEngine();

// --- IN-MEMORY & FILE FALLBACK DATABASE ---
const DB_FILE = join(process.cwd(), 'tmp_asn_db.json');

interface DbState {
  pengaturan: {
    namaInstansi: string;
    namaKepalaOpd: string;
    nipKepalaOpd: string;
    alamatInstansi: string;
    logoInstansi: string;
    supabaseUrl: string;
    supabaseKey: string;
  };
  users: any[];
  pegawai: any[];
  hariLibur: any[];
  atasanPejabat: any[];
  jenisCuti: any[];
  sisaCuti: any[];
  pengajuanCuti: any[];
}

let defaultDbState: DbState = {
  pengaturan: {
    namaInstansi: 'Sekretariat Daerah Kabupaten Demak',
    namaKepalaOpd: 'H. Akhmad Sugiharto, S.T., M.T.',
    nipKepalaOpd: '197005121996031004',
    alamatInstansi: 'Jl. Kyai Singkil No. 7, Bintoro, Demak, Jawa Tengah',
    logoInstansi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lambang_Kabupaten_Demak.png/480px-Lambang_Kabupaten_Demak.png',
    supabaseUrl: process.env['SUPABASE_URL'] || '',
    supabaseKey: process.env['SUPABASE_KEY'] || '',
  },
  users: [
    { id: '1', username: 'admin_cuti', password: '123', nama: 'Administrator Cuti Setda', role: 'Admin', nip: '198501012010011001' },
    { id: '2', username: 'verif', password: '123', nama: 'Siti Rahmawati, S.Sos', role: 'Verifikator', nip: '198803152015032002' },
    { id: '3', username: 'budi', password: '123', nama: 'Budi Santoso, S.Kom', role: 'Pegawai', nip: '199005102019031005' },
    { id: '4', username: 'ratna', password: '123', nama: 'Ratna Sari, A.Md', role: 'Pegawai', nip: '199411202022212011' },
  ],
  pegawai: [
    { id: '1', nama: 'Budi Santoso, S.Kom', nip: '199005102019031005', jabatan: 'Pranata Komputer Ahli Muda', unitKerja: 'Bagian Umum Setda', status: 'PNS', jenisKelamin: 'Laki-laki', masaKerja: '6 Tahun 2 Bulan' },
    { id: '2', nama: 'Ratna Sari, A.Md', nip: '199411202022212011', jabatan: 'Pengelola Barang Milik Negara', unitKerja: 'Bagian Umum Setda', status: 'PPPK', jenisKelamin: 'Perempuan', masaKerja: '3 Tahun 4 Bulan' },
    { id: '3', nama: 'Drs. Hendro Purnomo, M.Si', nip: '197208171998031003', jabatan: 'Kepala Bagian Umum', unitKerja: 'Bagian Umum Setda', status: 'PNS', jenisKelamin: 'Laki-laki', masaKerja: '26 Tahun' },
    { id: '4', nama: 'Siti Rahmawati, S.Sos', nip: '198803152015032002', jabatan: 'Analis Kepegawaian Ahli Pertama', unitKerja: 'Bagian Organisasi Setda', status: 'PNS', jenisKelamin: 'Perempuan', masaKerja: '9 Tahun 1 Bulan' },
    { id: '5', nama: 'Ahmad Fauzi', nip: '199802122023211008', jabatan: 'Petugas Pengamanan', unitKerja: 'Bagian Umum Setda', status: 'PPPK PW', jenisKelamin: 'Laki-laki', masaKerja: '1 Tahun' },
  ],
  hariLibur: [
    { id: '1', tanggalLibur: '2026-01-01', namaLibur: 'Tahun Baru 2026 Masehi', jenisLibur: 'Libur Nasional', keterangan: 'Tahun Baru' },
    { id: '2', tanggalLibur: '2026-03-20', namaLibur: 'Hari Raya Idul Fitri 1447 H', jenisLibur: 'Libur Nasional', keterangan: 'Idul Fitri Hari 1' },
    { id: '3', tanggalLibur: '2026-03-21', namaLibur: 'Hari Raya Idul Fitri 1447 H', jenisLibur: 'Libur Nasional', keterangan: 'Idul Fitri Hari 2' },
    { id: '4', tanggalLibur: '2026-03-23', namaLibur: 'Cuti Bersama Idul Fitri', jenisLibur: 'Cuti Bersama', keterangan: 'Cuti Bersama Hari 1' },
    { id: '5', tanggalLibur: '2026-03-24', namaLibur: 'Cuti Bersama Idul Fitri', jenisLibur: 'Cuti Bersama', keterangan: 'Cuti Bersama Hari 2' },
    { id: '6', tanggalLibur: '2026-05-01', namaLibur: 'Hari Buruh Internasional', jenisLibur: 'Libur Nasional', keterangan: 'May Day' },
    { id: '7', tanggalLibur: '2026-08-17', namaLibur: 'Hari Proklamasi Kemerdekaan RI', jenisLibur: 'Libur Nasional', keterangan: 'HUT RI ke-81' },
  ],
  atasanPejabat: [
    { id: '1', namaPegawai: 'Drs. Hendro Purnomo, M.Si', nip: '197208171998031003', jabatan: 'Kepala Bagian Umum', peran: 'Atasan Langsung' },
    { id: '2', namaPegawai: 'H. Akhmad Sugiharto, S.T., M.T.', nip: '197005121996031004', jabatan: 'Sekretaris Daerah', peran: 'Penanggung Jawab' },
  ],
  jenisCuti: [
    { id: '1', kode: 'CT', namaCuti: 'Cuti Tahunan', maksimalHari: 12, keterangan: 'Hak cuti tahunan pegawai ASN', berlakuUntuk: 'Semua' },
    { id: '2', kode: 'CB', namaCuti: 'Cuti Besar', maksimalHari: 90, keterangan: 'Telah bekerja paling kurang 5 tahun terus menerus', berlakuUntuk: 'PNS' },
    { id: '3', kode: 'CS', namaCuti: 'Cuti Sakit', maksimalHari: 365, keterangan: 'Sakit lebih dari 1 hari melampirkan surat keterangan dokter', berlakuUntuk: 'Semua' },
    { id: '4', kode: 'CM', namaCuti: 'Cuti Melahirkan', maksimalHari: 90, keterangan: 'Untuk persalinan anak pertama sampai ketiga', berlakuUntuk: 'Semua' },
    { id: '5', kode: 'CAP', namaCuti: 'Cuti Karena Alasan Penting', maksimalHari: 30, keterangan: 'Keluarga inti sakit keras atau meninggal dunia', berlakuUntuk: 'Semua' },
    { id: '6', kode: 'CLTN', namaCuti: 'Cuti di Luar Tanggungan Negara', maksimalHari: 1095, keterangan: 'Telah bekerja paling singkat 5 tahun secara terus menerus', berlakuUntuk: 'PNS' },
  ],
  sisaCuti: [
    { id: '1', nip: '199005102019031005', namaPegawai: 'Budi Santoso, S.Kom', tahun: 2026, sisaN2: 3, sisaN1: 5, sisaN: 12 },
    { id: '2', nip: '199411202022212011', namaPegawai: 'Ratna Sari, A.Md', tahun: 2026, sisaN2: 0, sisaN1: 4, sisaN: 12 },
    { id: '3', nip: '198803152015032002', namaPegawai: 'Siti Rahmawati, S.Sos', tahun: 2026, sisaN2: 2, sisaN1: 6, sisaN: 12 },
    { id: '4', nip: '197208171998031003', namaPegawai: 'Drs. Hendro Purnomo, M.Si', tahun: 2026, sisaN2: 6, sisaN1: 6, sisaN: 12 },
    { id: '5', nip: '199802122023211008', namaPegawai: 'Ahmad Fauzi', tahun: 2026, sisaN2: 0, sisaN1: 0, sisaN: 12 },
  ],
  pengajuanCuti: [
    {
      id: 'PC-001',
      tanggalPengajuan: '2026-06-15',
      nip: '199005102019031005',
      namaPegawai: 'Budi Santoso, S.Kom',
      jenisCuti: 'Cuti Tahunan',
      kodeCuti: 'CT',
      lamaCuti: 3,
      tanggalMulai: '2026-06-22',
      tanggalSelesai: '2026-06-24',
      sisaN2: 3,
      sisaN1: 5,
      sisaN: 12,
      alasanCuti: 'Acara pernikahan adik kandung di Yogyakarta',
      alamatSelamaCuti: 'Jl. Malioboro No. 45, Yogyakarta',
      telp: '081234567890',
      dokumen: 'undangan_nikah.pdf',
      atasanLangsung: 'Drs. Hendro Purnomo, M.Si',
      pejabatMenyetujui: 'H. Akhmad Sugiharto, S.T., M.T.',
      status: 'Menunggu',
      catatanVerifikator: '',
    },
    {
      id: 'PC-002',
      tanggalPengajuan: '2026-06-25',
      nip: '199411202022212011',
      namaPegawai: 'Ratna Sari, A.Md',
      jenisCuti: 'Cuti Karena Alasan Penting',
      kodeCuti: 'CAP',
      lamaCuti: 2,
      tanggalMulai: '2026-06-29',
      tanggalSelesai: '2026-06-30',
      sisaN2: 0,
      sisaN1: 4,
      sisaN: 12,
      alasanCuti: 'Menemani orang tua opname di RSUD Kalijaga Demak',
      alamatSelamaCuti: 'RSUD Sunan Kalijaga Ruang Melati No 12',
      telp: '085678901234',
      dokumen: 'surat_opname.pdf',
      atasanLangsung: 'Drs. Hendro Purnomo, M.Si',
      pejabatMenyetujui: 'H. Akhmad Sugiharto, S.T., M.T.',
      status: 'Menunggu',
      catatanVerifikator: '',
    },
    {
      id: 'PC-003',
      tanggalPengajuan: '2026-06-20',
      nip: '198803152015032002',
      namaPegawai: 'Siti Rahmawati, S.Sos',
      jenisCuti: 'Cuti Tahunan',
      kodeCuti: 'CT',
      lamaCuti: 5,
      tanggalMulai: '2026-07-06',
      tanggalSelesai: '2026-07-10',
      sisaN2: 2,
      sisaN1: 6,
      sisaN: 12,
      alasanCuti: 'Liburan sekolah anak ke Bali',
      alamatSelamaCuti: 'Hotel Kuta Beach, Bali',
      telp: '081999888777',
      dokumen: '',
      atasanLangsung: 'Drs. Hendro Purnomo, M.Si',
      pejabatMenyetujui: 'H. Akhmad Sugiharto, S.T., M.T.',
      status: 'Perbaikan',
      catatanVerifikator: 'Mohon lampirkan pelimpahan tugas kepada rekan kerja dalam satu unit.',
    },
  ],
};

let db: DbState = defaultDbState;

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
  }
} catch (err) {
  console.log('Using default DB state');
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save DB file', e);
  }
}

// Helper: Sync with Supabase REST if configured
async function trySupabaseGet(table: string): Promise<any[] | null> {
  const url = db.pengaturan.supabaseUrl || process.env['SUPABASE_URL'];
  const key = db.pengaturan.supabaseKey || process.env['SUPABASE_KEY'];
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Graceful fallback
  }
  return null;
}

function processIncomingItem(s: any, local?: any) {
  let rawAlamat = s.alamat_selama_cuti || s.alamatSelamaCuti || '';
  let extractedCreatedBy = '';
  let extractedPejabat = '';
  
  if (typeof rawAlamat === 'string') {
    const matchBy = rawAlamat.match(/\[BY:([^\]]+)\]/);
    if (matchBy) {
      extractedCreatedBy = matchBy[1];
      rawAlamat = rawAlamat.replace(/\s*\[BY:[^\]]+\]/, '');
    }
    const matchPejabat = rawAlamat.match(/\[PEJABAT:([^\]]+)\]/);
    if (matchPejabat) {
      extractedPejabat = matchPejabat[1];
      rawAlamat = rawAlamat.replace(/\s*\[PEJABAT:[^\]]+\]/, '');
    }
  }

  const finalCreatedBy = extractedCreatedBy || (s.created_by !== undefined ? String(s.created_by) : (local && local.createdBy ? String(local.createdBy) : (s.createdBy !== undefined ? String(s.createdBy) : '')));
  const finalPejabat = extractedPejabat || (s.pejabat_menyetujui !== undefined ? String(s.pejabat_menyetujui) : (local && local.pejabatMenyetujui ? String(local.pejabatMenyetujui) : (s.pejabatMenyetujui !== undefined ? String(s.pejabatMenyetujui) : '')));

  return {
    id: s.id,
    status: s.status,
    catatanVerifikator: s.catatan_verifikator || s.catatanVerifikator || '',
    tanggalPengajuan: s.tanggal_pengajuan || s.tanggalPengajuan || '',
    nip: s.nip || '',
    namaPegawai: s.nama_pegawai || s.namaPegawai || '',
    jenisCuti: s.jenis_cuti || s.jenisCuti || '',
    kodeCuti: s.kode_cuti || s.kodeCuti || '',
    lamaCuti: Number(s.lama_cuti !== undefined ? s.lama_cuti : (s.lamaCuti !== undefined ? s.lamaCuti : 0)),
    tanggalMulai: s.tanggal_mulai || s.tanggalMulai || '',
    tanggalSelesai: s.tanggal_selesai || s.tanggalSelesai || '',
    sisaN2: Number(s.sisa_n2 !== undefined ? s.sisa_n2 : (s.sisaN2 !== undefined ? s.sisaN2 : 0)),
    sisaN1: Number(s.sisa_n1 !== undefined ? s.sisa_n1 : (s.sisaN1 !== undefined ? s.sisaN1 : 0)),
    sisaN: Number(s.sisa_n !== undefined ? s.sisa_n : (s.sisaN !== undefined ? s.sisaN : 12)),
    alasanCuti: s.alasan_cuti || s.alasanCuti || '',
    alamatSelamaCuti: rawAlamat.trim(),
    telp: s.telp || '',
    dokumen: s.dokumen || '',
    atasanLangsung: s.atasan_langsung || s.atasanLangsung || '',
    pejabatMenyetujui: finalPejabat,
    createdBy: finalCreatedBy,
  };
}

async function trySupabaseWrite(table: string, method: string, data: any, idParam?: string) {
  const url = db.pengaturan.supabaseUrl || process.env['SUPABASE_URL'];
  const key = db.pengaturan.supabaseKey || process.env['SUPABASE_KEY'];
  if (!url || !key) return;

  try {
    let endpoint = `${url}/rest/v1/${table}`;
    if (idParam) endpoint += `?id=eq.${encodeURIComponent(idParam)}`;

    // Remove undefined values
    let cleanData: Record<string, any> | undefined = undefined;
    if (data) {
      cleanData = { ...data };
      Object.keys(cleanData!).forEach(k => cleanData![k] === undefined && delete cleanData![k]);

      // For pengajuan_cuti, encode createdBy into alamat_selama_cuti
      if (table === 'pengajuan_cuti') {
        const creatorId = cleanData!['createdBy'] || cleanData!['created_by'];
        let rawAlamat = cleanData!['alamatSelamaCuti'] || cleanData!['alamat_selama_cuti'] || '';

        if (typeof rawAlamat === 'string') {
          if (creatorId && !rawAlamat.includes('[BY:')) {
            rawAlamat = `${rawAlamat} [BY:${creatorId}]`;
          }
          if (cleanData!['alamatSelamaCuti'] !== undefined) {
            cleanData!['alamatSelamaCuti'] = rawAlamat;
          }
          if (cleanData!['alamat_selama_cuti'] !== undefined) {
            cleanData!['alamat_selama_cuti'] = rawAlamat;
          }
        }
      }

      // Remove createdBy and created_by as they do not exist in the Supabase schema
      if (cleanData!['createdBy'] !== undefined) {
        delete cleanData!['createdBy'];
      }
      if (cleanData!['created_by'] !== undefined) {
        delete cleanData!['created_by'];
      }
      // Remove pejabat_menyetujui (only keep camelCase pejabatMenyetujui)
      if (cleanData!['pejabat_menyetujui'] !== undefined) {
        delete cleanData!['pejabat_menyetujui'];
      }
      // Remove id from payload if we are patching to avoid updating primary key
      if (method === 'PATCH' && cleanData!['id'] !== undefined) {
        delete cleanData!['id'];
      }
    }

    let response = await fetch(endpoint, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=minimal' : 'return=representation',
      },
      body: cleanData ? JSON.stringify(cleanData) : undefined,
    });

    if (cleanData && !response.ok) {
      // Fallback 1: snake_case
      const snakeData: any = {};
      Object.keys(cleanData).forEach(k => {
        const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeData[snakeKey] = cleanData![k];
      });
      response = await fetch(endpoint, {
        method,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: method === 'POST' ? 'return=minimal' : 'return=representation',
        },
        body: JSON.stringify(snakeData),
      });

      if (!response.ok) {
        // Fallback 2: lowercase
        const lowerData: any = {};
        Object.keys(cleanData).forEach(k => {
          lowerData[k.toLowerCase()] = cleanData![k];
        });
        response = await fetch(endpoint, {
          method,
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: method === 'POST' ? 'return=minimal' : 'return=representation',
          },
          body: JSON.stringify(lowerData),
        });
      }
    }
    if (response && !response.ok) {
      const errText = await response.text();
      console.error(`[Supabase Error] Write failed for table ${table} (${method}):`, response.status, errText);
    }
  } catch (err) {
    console.error(`[Supabase Exception] Write failed for table ${table}:`, err);
  }
}

async function syncFromSupabase() {
  const url = db.pengaturan.supabaseUrl || process.env['SUPABASE_URL'];
  const key = db.pengaturan.supabaseKey || process.env['SUPABASE_KEY'];
  if (!url || !key) return;

  try {
    const [supaSisa, supaPengajuan] = await Promise.all([
      trySupabaseGet('sisa_cuti'),
      trySupabaseGet('pengajuan_cuti')
    ]);
    if (supaSisa) {
      db.sisaCuti = supaSisa.map((s: any) => {
        return {
          id: s.id?.toString(),
          nip: s.nip || s.nip_pegawai || '',
          namaPegawai: s.nama_pegawai || s.namaPegawai || '',
          tahun: Number(s.tahun) || 2026,
          sisaN2: Number(s.sisa_n2 !== undefined ? s.sisa_n2 : (s.sisaN2 !== undefined ? s.sisaN2 : 0)),
          sisaN1: Number(s.sisa_n1 !== undefined ? s.sisa_n1 : (s.sisaN1 !== undefined ? s.sisaN1 : 0)),
          sisaN: Number(s.sisa_n !== undefined ? s.sisa_n : (s.sisaN !== undefined ? s.sisaN : 12)),
        };
      });
    }
    if (supaPengajuan) {
      db.pengajuanCuti = supaPengajuan.map((s: any) => {
        const local = db.pengajuanCuti.find((p) => p.id === s.id);
        return processIncomingItem(s, local);
      });
    }
    saveDb();
  } catch (err) {
    console.error('Failed to sync from Supabase', err);
  }
}

// --- API ENDPOINTS ---

// Upload file to Supabase Storage
app.post('/api/upload', async (req, res) => {
  const { bucket, path, fileData, mimeType } = req.body;
  if (!bucket || !path || !fileData) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const url = db.pengaturan.supabaseUrl || process.env['SUPABASE_URL'];
  const key = db.pengaturan.supabaseKey || process.env['SUPABASE_KEY'];

  if (!url || !key) {
    res.status(500).json({ error: 'Supabase credentials not configured' });
    return;
  }

  try {
    const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const endpoint = `${url}/storage/v1/object/${bucket}/${path}`;
    
    const uploadRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': mimeType || 'application/octet-stream',
      },
      body: buffer,
    });
    
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      res.status(uploadRes.status).json({ error: errorText });
      return;
    }
    
    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${path}`;
    res.json({ publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file from Supabase Storage
app.post('/api/delete-file', async (req, res) => {
  const { fileUrl } = req.body;
  if (!fileUrl) {
    res.status(400).json({ error: 'Missing fileUrl parameter' });
    return;
  }

  const url = db.pengaturan.supabaseUrl || process.env['SUPABASE_URL'];
  const key = db.pengaturan.supabaseKey || process.env['SUPABASE_KEY'];

  if (!url || !key) {
    res.status(500).json({ error: 'Supabase credentials not configured' });
    return;
  }

  try {
    // Extract bucket and path from the public URL
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const publicUrlPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
    const match = fileUrl.match(publicUrlPattern);
    
    if (!match) {
      res.status(400).json({ error: 'Invalid Supabase public URL' });
      return;
    }

    const bucket = match[1];
    const path = match[2];

    const endpoint = `${url}/storage/v1/object/${bucket}/${path}`;
    
    const deleteRes = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    
    if (!deleteRes.ok) {
      const errorText = await deleteRes.text();
      res.status(deleteRes.status).json({ error: errorText });
      return;
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. PENGATURAN
app.get('/api/pengaturan', async (req, res) => {
  const supa = await trySupabaseGet('pengaturan');
  if (supa && supa.length > 0) {
    // Map snake_case or lowercase from DB back to camelCase for the frontend if necessary
    const supaData = supa[0];
    const mappedData = {
      namaInstansi: supaData.namaInstansi || supaData.nama_instansi || supaData.namainstansi || db.pengaturan.namaInstansi,
      namaKepalaOpd: supaData.namaKepalaOpd || supaData.nama_kepala_opd || supaData.namakepalaopd || db.pengaturan.namaKepalaOpd,
      nipKepalaOpd: supaData.nipKepalaOpd || supaData.nip_kepala_opd || supaData.nipkepalaopd || db.pengaturan.nipKepalaOpd,
      alamatInstansi: supaData.alamatInstansi || supaData.alamat_instansi || supaData.alamatinstansi || db.pengaturan.alamatInstansi,
      logoInstansi: supaData.logoInstansi || supaData.logo_instansi || supaData.logoinstansi || db.pengaturan.logoInstansi,
      supabaseUrl: db.pengaturan.supabaseUrl,
      supabaseKey: db.pengaturan.supabaseKey
    };
    db.pengaturan = { ...db.pengaturan, ...mappedData };
  }
  res.json(db.pengaturan);
});

app.post('/api/pengaturan', async (req, res) => {
  db.pengaturan = { ...db.pengaturan, ...req.body };
  saveDb();
  
  // Custom sync for pengaturan to handle different possible column names (camelCase vs snake_case vs lowercase)
  const url = db.pengaturan.supabaseUrl || process.env['SUPABASE_URL'];
  const key = db.pengaturan.supabaseKey || process.env['SUPABASE_KEY'];
  if (url && key) {
    try {
      // Clean payload (exclude supabaseUrl and supabaseKey which might not be in DB schema)
      const cleanData = {
        namaInstansi: db.pengaturan.namaInstansi,
        alamatInstansi: db.pengaturan.alamatInstansi,
        logoInstansi: db.pengaturan.logoInstansi,
        namaKepalaOpd: db.pengaturan.namaKepalaOpd,
        nipKepalaOpd: db.pengaturan.nipKepalaOpd
      };
      
      // Remove undefined values
      Object.keys(cleanData).forEach(k => (cleanData as any)[k] === undefined && delete (cleanData as any)[k]);

      let response = await fetch(`${url}/rest/v1/pengaturan?id=eq.1`, {
        method: 'PATCH',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        // Fallback 1: snake_case
        const snakeData = {
          nama_instansi: db.pengaturan.namaInstansi,
          alamat_instansi: db.pengaturan.alamatInstansi,
          logo_instansi: db.pengaturan.logoInstansi,
          nama_kepala_opd: db.pengaturan.namaKepalaOpd,
          nip_kepala_opd: db.pengaturan.nipKepalaOpd
        };
        Object.keys(snakeData).forEach(k => (snakeData as any)[k] === undefined && delete (snakeData as any)[k]);
        
        response = await fetch(`${url}/rest/v1/pengaturan?id=eq.1`, {
          method: 'PATCH',
          headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(snakeData)
        });
        
        if (!response.ok) {
          // Fallback 2: lowercase
          const lowerData = {
            namainstansi: db.pengaturan.namaInstansi,
            alamatinstansi: db.pengaturan.alamatInstansi,
            logoinstansi: db.pengaturan.logoInstansi,
            namakepalaopd: db.pengaturan.namaKepalaOpd,
            nipkepalaopd: db.pengaturan.nipKepalaOpd
          };
          Object.keys(lowerData).forEach(k => (lowerData as any)[k] === undefined && delete (lowerData as any)[k]);
          
          await fetch(`${url}/rest/v1/pengaturan?id=eq.1`, {
            method: 'PATCH',
            headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify(lowerData)
          });
        }
      }
    } catch (e) {}
  }

  res.json(db.pengaturan);
});

// 2. USERS
app.get('/api/users', async (req, res) => {
  const supa = await trySupabaseGet('users');
  if (supa) {
    const mapped = supa.map((u: any) => ({
      ...u,
      id: u.id !== undefined ? String(u.id) : ''
    }));
    res.json(mapped);
  } else {
    res.json(db.users);
  }
});

app.post('/api/users', async (req, res) => {
  const newUser = { id: Date.now().toString(), ...req.body };
  db.users.push(newUser);
  saveDb();
  await trySupabaseWrite('users', 'POST', newUser);
  res.json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx > -1) {
    db.users[idx] = { ...db.users[idx], ...req.body };
    saveDb();
    await trySupabaseWrite('users', 'PATCH', req.body, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/users/:id', async (req, res) => {
  db.users = db.users.filter((u) => u.id !== req.params.id);
  saveDb();
  await trySupabaseWrite('users', 'DELETE', null, req.params.id);
  res.json({ success: true });
});

// 3. PEGAWAI
app.get('/api/pegawai', async (req, res) => {
  const supa = await trySupabaseGet('pegawai');
  res.json(supa || db.pegawai);
});

app.post('/api/pegawai', async (req, res) => {
  const item = { id: Date.now().toString(), ...req.body };
  db.pegawai.push(item);
  saveDb();
  await trySupabaseWrite('pegawai', 'POST', item);
  res.json(item);
});

app.put('/api/pegawai/:id', async (req, res) => {
  const idx = db.pegawai.findIndex((p) => p.id === req.params.id);
  if (idx > -1) {
    db.pegawai[idx] = { ...db.pegawai[idx], ...req.body };
    saveDb();
    await trySupabaseWrite('pegawai', 'PATCH', req.body, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/pegawai/:id', async (req, res) => {
  db.pegawai = db.pegawai.filter((p) => p.id !== req.params.id);
  saveDb();
  await trySupabaseWrite('pegawai', 'DELETE', null, req.params.id);
  res.json({ success: true });
});

// 4. HARI LIBUR
app.get('/api/hari-libur', async (req, res) => {
  const supa = await trySupabaseGet('hari_libur');
  res.json(supa || db.hariLibur);
});

app.post('/api/hari-libur', async (req, res) => {
  const item = { id: Date.now().toString(), ...req.body };
  db.hariLibur.push(item);
  saveDb();
  await trySupabaseWrite('hari_libur', 'POST', item);
  res.json(item);
});

app.put('/api/hari-libur/:id', async (req, res) => {
  const idx = db.hariLibur.findIndex((h) => h.id === req.params.id);
  if (idx > -1) {
    db.hariLibur[idx] = { ...db.hariLibur[idx], ...req.body };
    saveDb();
    await trySupabaseWrite('hari_libur', 'PATCH', req.body, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/hari-libur/:id', async (req, res) => {
  db.hariLibur = db.hariLibur.filter((h) => h.id !== req.params.id);
  saveDb();
  await trySupabaseWrite('hari_libur', 'DELETE', null, req.params.id);
  res.json({ success: true });
});

// 5. ATASAN & PEJABAT
app.get('/api/atasan-pejabat', async (req, res) => {
  const supa = await trySupabaseGet('atasan_pejabat');
  res.json(supa || db.atasanPejabat);
});

app.post('/api/atasan-pejabat', async (req, res) => {
  const item = { id: Date.now().toString(), ...req.body };
  db.atasanPejabat.push(item);
  saveDb();
  await trySupabaseWrite('atasan_pejabat', 'POST', item);
  res.json(item);
});

app.put('/api/atasan-pejabat/:id', async (req, res) => {
  const idx = db.atasanPejabat.findIndex((a) => a.id === req.params.id);
  if (idx > -1) {
    db.atasanPejabat[idx] = { ...db.atasanPejabat[idx], ...req.body };
    saveDb();
    await trySupabaseWrite('atasan_pejabat', 'PATCH', req.body, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/atasan-pejabat/:id', async (req, res) => {
  db.atasanPejabat = db.atasanPejabat.filter((a) => a.id !== req.params.id);
  saveDb();
  await trySupabaseWrite('atasan_pejabat', 'DELETE', null, req.params.id);
  res.json({ success: true });
});

// 6. JENIS CUTI
app.get('/api/jenis-cuti', async (req, res) => {
  const supa = await trySupabaseGet('jenis_cuti');
  res.json(supa || db.jenisCuti);
});

app.post('/api/jenis-cuti', async (req, res) => {
  const item = { id: Date.now().toString(), ...req.body };
  db.jenisCuti.push(item);
  saveDb();
  await trySupabaseWrite('jenis_cuti', 'POST', item);
  res.json(item);
});

app.put('/api/jenis-cuti/:id', async (req, res) => {
  const idx = db.jenisCuti.findIndex((j) => j.id === req.params.id);
  if (idx > -1) {
    db.jenisCuti[idx] = { ...db.jenisCuti[idx], ...req.body };
    saveDb();
    await trySupabaseWrite('jenis_cuti', 'PATCH', req.body, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/jenis-cuti/:id', async (req, res) => {
  db.jenisCuti = db.jenisCuti.filter((j) => j.id !== req.params.id);
  saveDb();
  await trySupabaseWrite('jenis_cuti', 'DELETE', null, req.params.id);
  res.json({ success: true });
});

// 7. SISA CUTI TAHUNAN
app.get('/api/sisa-cuti', async (req, res) => {
  const supa = await trySupabaseGet('sisa_cuti');
  if (supa) {
    const mapped = supa.map((s: any) => ({
      id: s.id?.toString(),
      nip: s.nip || s.nip_pegawai || '',
      namaPegawai: s.nama_pegawai || s.namaPegawai || '',
      tahun: Number(s.tahun) || 2026,
      sisaN2: Number(s.sisa_n2 !== undefined ? s.sisa_n2 : (s.sisaN2 !== undefined ? s.sisaN2 : 0)),
      sisaN1: Number(s.sisa_n1 !== undefined ? s.sisa_n1 : (s.sisaN1 !== undefined ? s.sisaN1 : 0)),
      sisaN: Number(s.sisa_n !== undefined ? s.sisa_n : (s.sisaN !== undefined ? s.sisaN : 12)),
    }));
    res.json(mapped);
  } else {
    res.json(db.sisaCuti);
  }
});

app.post('/api/sisa-cuti', async (req, res) => {
  const item = { id: Date.now().toString(), ...req.body };
  db.sisaCuti.push(item);
  saveDb();
  await trySupabaseWrite('sisa_cuti', 'POST', item);
  res.json(item);
});

app.put('/api/sisa-cuti/:id', async (req, res) => {
  const idx = db.sisaCuti.findIndex((s) => s.id === req.params.id);
  if (idx > -1) {
    db.sisaCuti[idx] = { ...db.sisaCuti[idx], ...req.body };
    saveDb();
    await trySupabaseWrite('sisa_cuti', 'PATCH', req.body, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/sisa-cuti/:id', async (req, res) => {
  db.sisaCuti = db.sisaCuti.filter((s) => s.id !== req.params.id);
  saveDb();
  await trySupabaseWrite('sisa_cuti', 'DELETE', null, req.params.id);
  res.json({ success: true });
});

app.post('/api/sisa-cuti/generate-default', async (req, res) => {
  const thn = Number(req.body.tahun) || new Date().getFullYear();
  const pegawaiData = (await trySupabaseGet('pegawai')) || db.pegawai;
  const sisaCutiData = (await trySupabaseGet('sisa_cuti')) || db.sisaCuti;

  for (const p of pegawaiData) {
    const exist = sisaCutiData.find((s: any) => s.nip === p.nip && Number(s.tahun) === thn);
    if (!exist) {
      const newItem = {
        id: Math.random().toString(36).substring(2, 9),
        nip: p.nip,
        namaPegawai: p.nama,
        tahun: thn,
        sisaN2: 0,
        sisaN1: 0,
        sisaN: 12,
      };
      // Save locally
      if (!db.sisaCuti.find(s => s.id === newItem.id)) {
        db.sisaCuti.push(newItem);
      }
      sisaCutiData.push(newItem);
      await trySupabaseWrite('sisa_cuti', 'POST', newItem);
    }
  }
  saveDb();
  res.json(sisaCutiData);
});

app.post('/api/sisa-cuti/import', async (req, res) => {
  const payloads = req.body;
  const sisaCutiData = (await trySupabaseGet('sisa_cuti')) || db.sisaCuti;

  for (const item of payloads) {
    const exist = sisaCutiData.find((s: any) => s.nip === item.nip && Number(s.tahun) === Number(item.tahun));
    if (exist) {
      exist.sisaN2 = item.sisaN2;
      exist.sisaN1 = item.sisaN1;
      exist.sisaN = item.sisaN;
      const localExist = db.sisaCuti.find(s => s.id === exist.id);
      if (localExist) {
        localExist.sisaN2 = item.sisaN2;
        localExist.sisaN1 = item.sisaN1;
        localExist.sisaN = item.sisaN;
      }
      await trySupabaseWrite('sisa_cuti', 'PATCH', exist, exist.id);
    } else {
      const newItem = {
        id: Math.random().toString(36).substring(2, 9),
        ...item
      };
      db.sisaCuti.push(newItem);
      sisaCutiData.push(newItem);
      await trySupabaseWrite('sisa_cuti', 'POST', newItem);
    }
  }
  saveDb();
  res.json({ success: true });
});

// 8. PENGAJUAN CUTI
app.get('/api/pengajuan-cuti', async (req, res) => {
  const supa = await trySupabaseGet('pengajuan_cuti');
  if (supa) {
    const mapped = supa.map((s: any) => {
      const local = db.pengajuanCuti.find((p) => p.id === s.id);
      return processIncomingItem(s, local);
    });
    res.json(mapped);
  } else {
    res.json(db.pengajuanCuti);
  }
});

app.post('/api/pengajuan-cuti', async (req, res) => {
  const count = db.pengajuanCuti.length + 1;
  const id = `PC-${String(count).padStart(3, '0')}`;
  const item = { id, status: 'Menunggu', catatanVerifikator: '', ...req.body };
  db.pengajuanCuti.unshift(item);
  saveDb();
  await trySupabaseWrite('pengajuan_cuti', 'POST', item);
  res.json(item);
});

app.put('/api/pengajuan-cuti/:id', async (req, res) => {
  await syncFromSupabase();
  const idx = db.pengajuanCuti.findIndex((p) => p.id === req.params.id);
  if (idx > -1) {
    // Check if status changed to Disetujui and cuti type is Cuti Tahunan -> deduct sisaN
    const prevStatus = db.pengajuanCuti[idx].status;
    const nextStatus = req.body.status;
    if (prevStatus !== 'Disetujui' && nextStatus === 'Disetujui' && db.pengajuanCuti[idx].kodeCuti === 'CT') {
      const nip = db.pengajuanCuti[idx].nip;
      const thn = db.pengajuanCuti[idx].tanggalPengajuan ? new Date(db.pengajuanCuti[idx].tanggalPengajuan).getFullYear() : new Date().getFullYear();
      const sisaIdx = db.sisaCuti.findIndex((s) => s.nip === nip && Number(s.tahun) === thn);
      if (sisaIdx > -1) {
        const deduct = Number(db.pengajuanCuti[idx].lamaCuti) || 0;
        db.sisaCuti[sisaIdx].sisaN = Math.max(0, (db.sisaCuti[sisaIdx].sisaN || 0) - deduct);
        await trySupabaseWrite('sisa_cuti', 'PATCH', db.sisaCuti[sisaIdx], db.sisaCuti[sisaIdx].id);
      }
    } else if (prevStatus === 'Disetujui' && nextStatus !== 'Disetujui' && db.pengajuanCuti[idx].kodeCuti === 'CT') {
      const nip = db.pengajuanCuti[idx].nip;
      const thn = db.pengajuanCuti[idx].tanggalPengajuan ? new Date(db.pengajuanCuti[idx].tanggalPengajuan).getFullYear() : new Date().getFullYear();
      const sisaIdx = db.sisaCuti.findIndex((s) => s.nip === nip && Number(s.tahun) === thn);
      if (sisaIdx > -1) {
        const restore = Number(db.pengajuanCuti[idx].lamaCuti) || 0;
        db.sisaCuti[sisaIdx].sisaN = (db.sisaCuti[sisaIdx].sisaN || 0) + restore;
        await trySupabaseWrite('sisa_cuti', 'PATCH', db.sisaCuti[sisaIdx], db.sisaCuti[sisaIdx].id);
      }
    }

    const bodyWithCreatedBy = { ...req.body };
    const existingCreatedBy = db.pengajuanCuti[idx].createdBy;
    if (!bodyWithCreatedBy.createdBy && existingCreatedBy) {
      bodyWithCreatedBy.createdBy = existingCreatedBy;
    }

    db.pengajuanCuti[idx] = { ...db.pengajuanCuti[idx], ...bodyWithCreatedBy };
    saveDb();
    await trySupabaseWrite('pengajuan_cuti', 'PATCH', bodyWithCreatedBy, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/pengajuan-cuti/:id', async (req, res) => {
  await syncFromSupabase();
  const p = db.pengajuanCuti.find((x) => x.id === req.params.id);
  if (p && p.status === 'Disetujui' && p.kodeCuti === 'CT') {
    const thn = p.tanggalPengajuan ? new Date(p.tanggalPengajuan).getFullYear() : new Date().getFullYear();
    const sisaIdx = db.sisaCuti.findIndex((s) => s.nip === p.nip && Number(s.tahun) === thn);
    if (sisaIdx > -1) {
      const restore = Number(p.lamaCuti) || 0;
      db.sisaCuti[sisaIdx].sisaN = (db.sisaCuti[sisaIdx].sisaN || 0) + restore;
      await trySupabaseWrite('sisa_cuti', 'PATCH', db.sisaCuti[sisaIdx], db.sisaCuti[sisaIdx].id);
    }
  }
  db.pengajuanCuti = db.pengajuanCuti.filter((x) => x.id !== req.params.id);
  saveDb();
  await trySupabaseWrite('pengajuan_cuti', 'DELETE', null, req.params.id);
  res.json({ success: true });
});

// 9. REKAP CUTI PEGAWAI (Computed)
app.get('/api/rekap-cuti', async (req, res) => {
  const currentYear = new Date().getFullYear().toString();
  const pegawaiData = (await trySupabaseGet('pegawai')) || db.pegawai;
  const pengajuanData = (await trySupabaseGet('pengajuan_cuti')) || db.pengajuanCuti;

  const rekap = pegawaiData.map((p: any) => {
    const list = pengajuanData.filter((c: any) => 
      c.nip === p.nip && 
      c.status === 'Disetujui' && 
      (c.tanggalPengajuan || '').startsWith(currentYear)
    );
    const ct = list.filter((c: any) => c.kodeCuti === 'CT').reduce((acc: number, cur: any) => acc + Number(cur.lamaCuti || 0), 0);
    const cb = list.filter((c: any) => c.kodeCuti === 'CB').reduce((acc: number, cur: any) => acc + Number(cur.lamaCuti || 0), 0);
    const cs = list.filter((c: any) => c.kodeCuti === 'CS').reduce((acc: number, cur: any) => acc + Number(cur.lamaCuti || 0), 0);
    const cm = list.filter((c: any) => c.kodeCuti === 'CM').reduce((acc: number, cur: any) => acc + Number(cur.lamaCuti || 0), 0);
    const cap = list.filter((c: any) => c.kodeCuti === 'CAP').reduce((acc: number, cur: any) => acc + Number(cur.lamaCuti || 0), 0);
    const cltn = list.filter((c: any) => c.kodeCuti === 'CLTN').reduce((acc: number, cur: any) => acc + Number(cur.lamaCuti || 0), 0);
    return {
      nip: p.nip,
      nama: p.nama,
      unitKerja: p.unitKerja,
      ct, cb, cs, cm, cap, cltn,
      total: ct + cb + cs + cm + cap + cltn
    };
  }).filter((r: any) => r.total > 0);
  res.json(rekap);
});


/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);

