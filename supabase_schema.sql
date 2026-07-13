-- ==========================================
-- SCHEMA DATABASE CUTI ASN UNTUK SUPABASE
-- ==========================================

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL,
    nip TEXT
);

-- Seeding Default User
INSERT INTO public.users (id, username, password, nama, role, nip)
VALUES 
    ('1', 'admin_cuti', '123', 'Administrator Cuti Setda', 'Admin', '198501012010011001'),
    ('2', 'verif', '123', 'Siti Rahmawati, S.Sos', 'Verifikator', '198803152015032002'),
    ('3', 'budi', '123', 'Budi Santoso, S.Kom', 'Pegawai', '199005102019031005'),
    ('4', 'ratna', '123', 'Ratna Sari, A.Md', 'Pegawai', '199411202022212011')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabel Pegawai
CREATE TABLE IF NOT EXISTS public.pegawai (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    nip TEXT UNIQUE NOT NULL,
    jabatan TEXT,
    "unitKerja" TEXT,
    status TEXT,
    "jenisKelamin" TEXT,
    "masaKerja" TEXT
);

-- 3. Tabel Hari Libur
CREATE TABLE IF NOT EXISTS "hariLibur" (
    id TEXT PRIMARY KEY,
    "tanggalLibur" TEXT NOT NULL,
    "namaLibur" TEXT NOT NULL,
    "jenisLibur" TEXT,
    keterangan TEXT
);

-- 4. Tabel Atasan Pejabat
CREATE TABLE IF NOT EXISTS "atasanPejabat" (
    id TEXT PRIMARY KEY,
    "namaPegawai" TEXT NOT NULL,
    nip TEXT,
    jabatan TEXT,
    peran TEXT
);

-- 5. Tabel Jenis Cuti
CREATE TABLE IF NOT EXISTS "jenisCuti" (
    id TEXT PRIMARY KEY,
    kode TEXT NOT NULL,
    "namaCuti" TEXT NOT NULL,
    "maksimalHari" NUMERIC,
    keterangan TEXT,
    "berlakuUntuk" TEXT
);

-- 6. Tabel Sisa Cuti
CREATE TABLE IF NOT EXISTS "sisaCuti" (
    id TEXT PRIMARY KEY,
    nip TEXT NOT NULL,
    "namaPegawai" TEXT,
    tahun NUMERIC,
    "sisaN2" NUMERIC,
    "sisaN1" NUMERIC,
    "sisaN" NUMERIC
);

-- 7. Tabel Pengajuan Cuti
CREATE TABLE IF NOT EXISTS "pengajuanCuti" (
    id TEXT PRIMARY KEY,
    "tanggalPengajuan" TEXT,
    nip TEXT,
    "namaPegawai" TEXT,
    "jenisCuti" TEXT,
    "kodeCuti" TEXT,
    "lamaCuti" NUMERIC,
    "tanggalMulai" TEXT,
    "tanggalSelesai" TEXT,
    "sisaN2" NUMERIC,
    "sisaN1" NUMERIC,
    "sisaN" NUMERIC,
    "alasanCuti" TEXT,
    "alamatSelamaCuti" TEXT,
    telp TEXT,
    dokumen TEXT,
    "atasanLangsung" TEXT,
    "pejabatMenyetujui" TEXT,
    status TEXT,
    "catatanVerifikator" TEXT
);

-- 8. Tabel Pengaturan
CREATE TABLE IF NOT EXISTS public.pengaturan (
    id TEXT PRIMARY KEY DEFAULT '1',
    "namaInstansi" TEXT,
    "namaKepalaOpd" TEXT,
    "nipKepalaOpd" TEXT,
    "alamatInstansi" TEXT,
    "logoInstansi" TEXT,
    "supabaseUrl" TEXT,
    "supabaseKey" TEXT
);

-- Insert Default Pengaturan
INSERT INTO public.pengaturan (id, "namaInstansi", "namaKepalaOpd", "nipKepalaOpd", "alamatInstansi", "logoInstansi", "supabaseUrl", "supabaseKey")
VALUES (
    '1', 
    'Sekretariat Daerah Kabupaten Demak', 
    'H. Akhmad Sugiharto, S.T., M.T.', 
    '197005121996031004', 
    'Jl. Kyai Singkil No. 7, Bintoro, Demak, Jawa Tengah', 
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lambang_Kabupaten_Demak.png/480px-Lambang_Kabupaten_Demak.png',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage Policies
-- Create bucket for uploads if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('berkas', 'berkas', true) ON CONFLICT DO NOTHING;

-- Allow public read access to berkas bucket
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'berkas');

-- Allow public upload access to berkas bucket (for demo purposes)
CREATE POLICY "Public Insert Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'berkas');

-- Allow public update access to berkas bucket (for demo purposes)
CREATE POLICY "Public Update Access" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'berkas');

-- Allow public delete access to berkas bucket (for demo purposes)
CREATE POLICY "Public Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'berkas');

-- ==========================================
-- JIKA MENDAPAT ERROR "relation already exists":
-- Ini berarti tabel sudah pernah dibuat sebelumnya.
-- Karena script ini menggunakan "IF NOT EXISTS", 
-- error tersebut bisa diabaikan, atau Anda bisa 
-- menghapus (DROP) tabel lama jika ingin mengulang 
-- dari awal (hati-hati, data lama akan hilang).
-- ==========================================
