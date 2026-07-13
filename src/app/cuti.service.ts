import {inject, Injectable, signal, computed} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

export interface User {
  id?: string;
  username: string;
  password?: string;
  nama: string;
  role: 'Admin' | 'Verifikator' | 'Operator';
  nip?: string;
}

export interface Pegawai {
  id?: string;
  nama: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  status: 'PNS' | 'CPNS' | 'PPPK' | 'CPPPK' | 'PPPK PW';
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  masaKerja: string;
}

export interface HariLibur {
  id?: string;
  tanggalLibur: string;
  namaLibur: string;
  jenisLibur: 'Libur Nasional' | 'Cuti Bersama';
  keterangan: string;
}

export interface AtasanPejabat {
  id?: string;
  namaPegawai: string;
  nip: string;
  jabatan: string;
  peran: 'Penanggung Jawab' | 'Atasan Langsung';
}

export interface JenisCuti {
  id?: string;
  kode: string;
  namaCuti: string;
  maksimalHari: number;
  keterangan: string;
  berlakuUntuk: string;
}

export interface SisaCuti {
  id?: string;
  nip: string;
  namaPegawai: string;
  tahun: number;
  sisaN2: number;
  sisaN1: number;
  sisaN: number;
}

export interface PengajuanCuti {
  id?: string;
  tanggalPengajuan: string;
  nip: string;
  namaPegawai: string;
  jenisCuti: string;
  kodeCuti: string;
  lamaCuti: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  sisaN2: number;
  sisaN1: number;
  sisaN: number;
  alasanCuti: string;
  alamatSelamaCuti: string;
  telp: string;
  dokumen: string;
  atasanLangsung: string;
  pejabatMenyetujui: string;
  status: 'Menunggu' | 'Disetujui' | 'Perbaikan';
  catatanVerifikator?: string;
  createdBy?: string;
}

export interface RekapCuti {
  nip: string;
  nama: string;
  unitKerja: string;
  ct: number;
  cb: number;
  cs: number;
  cm: number;
  cap: number;
  cltn: number;
  total: number;
}

export interface Pengaturan {
  namaInstansi: string;
  namaKepalaOpd: string;
  nipKepalaOpd: string;
  alamatInstansi: string;
  logoInstansi: string;
  supabaseUrl: string;
  supabaseKey: string;
}

@Injectable({providedIn: 'root'})
export class CutiService {
  private http = inject(HttpClient);

  // Auth State
  currentUser = signal<User | null>(null);
  activeMenu = signal<string>('dashboard');

  // Notification Toast
  toast = signal<{message: string; type: 'success' | 'error' | 'info'} | null>(null);

  // Data Signals
  pengaturan = signal<Pengaturan>({
    namaInstansi: 'Sekretariat Daerah Kabupaten Demak',
    namaKepalaOpd: 'H. Akhmad Sugiharto, S.T., M.T.',
    nipKepalaOpd: '197005121996031004',
    alamatInstansi: 'Jl. Kyai Singkil No. 7, Bintoro, Demak',
    logoInstansi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lambang_Kabupaten_Demak.png/480px-Lambang_Kabupaten_Demak.png',
    supabaseUrl: '',
    supabaseKey: '',
  });

  users = signal<User[]>([]);
  pegawai = signal<Pegawai[]>([]);
  hariLibur = signal<HariLibur[]>([]);
  atasanPejabat = signal<AtasanPejabat[]>([]);
  jenisCuti = signal<JenisCuti[]>([]);
  sisaCuti = signal<SisaCuti[]>([]);
  pengajuanCuti = signal<PengajuanCuti[]>([]);
  rekapCuti = signal<RekapCuti[]>([]);

  // Computed stats for dashboard
  totalPegawai = computed(() => this.pegawai().length);
  totalPNS = computed(() => this.pegawai().filter(p => p.status === 'PNS' || p.status === 'CPNS').length);
  totalPPPK = computed(() => this.pegawai().filter(p => p.status.includes('PPPK')).length);
  cutiBerjalan = computed(() => this.pengajuanCuti().filter(c => c.status === 'Disetujui').length);
  menungguApproval = computed(() => this.pengajuanCuti().filter(c => c.status === 'Menunggu' || c.status === 'Perbaikan').length);
  totalPerbaikan = computed(() => this.pengajuanCuti().filter(c => c.status === 'Perbaikan').length);
  totalSisaKuota = computed(() => this.sisaCuti().reduce((acc, s) => acc + s.sisaN + s.sisaN1 + s.sisaN2, 0));

  // Year Signals
  currentYear = signal<number>(new Date().getFullYear());
  yearN = computed(() => this.currentYear());
  yearN1 = computed(() => this.currentYear() - 1);
  yearN2 = computed(() => this.currentYear() - 2);

  async uploadFile(bucket: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result as string;
        const extension = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const payload = {
          bucket,
          path: fileName,
          fileData,
          mimeType: file.type,
        };
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            const data = await response.json();
            resolve(data.publicUrl);
          } else {
            const err = await response.json();
            reject(new Error(err.error || 'Upload failed'));
          }
        } catch(e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;
    // Only attempt to delete if it's a supabase URL (from our upload endpoint)
    if (fileUrl.includes('/storage/v1/object/public/')) {
      try {
        await fetch('/api/delete-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl })
        });
      } catch (err) {
        console.error('Failed to delete file', err);
      }
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toast.set({message, type});
    setTimeout(() => this.toast.set(null), 3500);
  }

  async loadAllData() {
    try {
      const [cfg, usr, peg, lib, atas, jen, sis, peng, rek] = await Promise.all([
        firstValueFrom(this.http.get<Pengaturan>('/api/pengaturan')),
        firstValueFrom(this.http.get<User[]>('/api/users')),
        firstValueFrom(this.http.get<Pegawai[]>('/api/pegawai')),
        firstValueFrom(this.http.get<HariLibur[]>('/api/hari-libur')),
        firstValueFrom(this.http.get<AtasanPejabat[]>('/api/atasan-pejabat')),
        firstValueFrom(this.http.get<JenisCuti[]>('/api/jenis-cuti')),
        firstValueFrom(this.http.get<SisaCuti[]>('/api/sisa-cuti')),
        firstValueFrom(this.http.get<PengajuanCuti[]>('/api/pengajuan-cuti')),
        firstValueFrom(this.http.get<RekapCuti[]>('/api/rekap-cuti')),
      ]);

      if (cfg) this.pengaturan.set(cfg);
      if (usr) this.users.set(usr);
      if (peg) this.pegawai.set(peg);
      if (lib) this.hariLibur.set(lib);
      if (atas) this.atasanPejabat.set(atas);
      if (jen) this.jenisCuti.set(jen);
      if (sis) this.sisaCuti.set(sis);
      if (peng) this.pengajuanCuti.set(peng);
      if (rek) this.rekapCuti.set(rek);
    } catch (err) {
      console.error('Failed loading data from API', err);
    }
  }

  // --- CRUD METHODS ---
  async savePengaturan(data: Pengaturan) {
    const res = await firstValueFrom(this.http.post<Pengaturan>('/api/pengaturan', data));
    this.pengaturan.set(res);
    this.showToast('Pengaturan berhasil disimpan');
  }

  async addUser(data: User) {
    const res = await firstValueFrom(this.http.post<User>('/api/users', data));
    this.users.update(list => [...list, res]);
    this.showToast('User berhasil ditambahkan');
  }

  async updateUser(id: string, data: User) {
    await firstValueFrom(this.http.put(`/api/users/${id}`, data));
    this.users.update(list => list.map(u => u.id === id ? {...u, ...data} : u));
    this.showToast('User berhasil diperbarui');
  }

  async deleteUser(id: string) {
    await firstValueFrom(this.http.delete(`/api/users/${id}`));
    this.users.update(list => list.filter(u => u.id !== id));
    this.showToast('User berhasil dihapus', 'info');
  }

  async addPegawai(data: Pegawai) {
    const res = await firstValueFrom(this.http.post<Pegawai>('/api/pegawai', data));
    this.pegawai.update(list => [...list, res]);
    this.showToast('Pegawai berhasil ditambahkan');
  }

  async updatePegawai(id: string, data: Pegawai) {
    await firstValueFrom(this.http.put(`/api/pegawai/${id}`, data));
    this.pegawai.update(list => list.map(p => p.id === id ? {...p, ...data} : p));
    this.showToast('Data Pegawai berhasil diperbarui');
  }

  async deletePegawai(id: string) {
    await firstValueFrom(this.http.delete(`/api/pegawai/${id}`));
    this.pegawai.update(list => list.filter(p => p.id !== id));
    this.showToast('Pegawai berhasil dihapus', 'info');
  }

  async addHariLibur(data: HariLibur) {
    const res = await firstValueFrom(this.http.post<HariLibur>('/api/hari-libur', data));
    this.hariLibur.update(list => [...list, res]);
    this.showToast('Hari libur berhasil ditambahkan');
  }

  async updateHariLibur(id: string, data: HariLibur) {
    await firstValueFrom(this.http.put(`/api/hari-libur/${id}`, data));
    this.hariLibur.update(list => list.map(h => h.id === id ? {...h, ...data} : h));
    this.showToast('Hari libur berhasil diperbarui');
  }

  async deleteHariLibur(id: string) {
    await firstValueFrom(this.http.delete(`/api/hari-libur/${id}`));
    this.hariLibur.update(list => list.filter(h => h.id !== id));
    this.showToast('Hari libur berhasil dihapus', 'info');
  }

  async addAtasanPejabat(data: AtasanPejabat) {
    const res = await firstValueFrom(this.http.post<AtasanPejabat>('/api/atasan-pejabat', data));
    this.atasanPejabat.update(list => [...list, res]);
    this.showToast('Pejabat berhasil ditambahkan');
  }

  async updateAtasanPejabat(id: string, data: AtasanPejabat) {
    await firstValueFrom(this.http.put(`/api/atasan-pejabat/${id}`, data));
    this.atasanPejabat.update(list => list.map(a => a.id === id ? {...a, ...data} : a));
    this.showToast('Pejabat berhasil diperbarui');
  }

  async deleteAtasanPejabat(id: string) {
    await firstValueFrom(this.http.delete(`/api/atasan-pejabat/${id}`));
    this.atasanPejabat.update(list => list.filter(a => a.id !== id));
    this.showToast('Pejabat berhasil dihapus', 'info');
  }

  async addJenisCuti(data: JenisCuti) {
    const res = await firstValueFrom(this.http.post<JenisCuti>('/api/jenis-cuti', data));
    this.jenisCuti.update(list => [...list, res]);
    this.showToast('Jenis Cuti berhasil ditambahkan');
  }

  async updateJenisCuti(id: string, data: JenisCuti) {
    await firstValueFrom(this.http.put(`/api/jenis-cuti/${id}`, data));
    this.jenisCuti.update(list => list.map(j => j.id === id ? {...j, ...data} : j));
    this.showToast('Jenis Cuti berhasil diperbarui');
  }

  async deleteJenisCuti(id: string) {
    await firstValueFrom(this.http.delete(`/api/jenis-cuti/${id}`));
    this.jenisCuti.update(list => list.filter(j => j.id !== id));
    this.showToast('Jenis Cuti berhasil dihapus', 'info');
  }

  async addSisaCuti(data: SisaCuti) {
    const res = await firstValueFrom(this.http.post<SisaCuti>('/api/sisa-cuti', data));
    this.sisaCuti.update(list => [...list, res]);
    this.showToast('Kuota Cuti berhasil ditambahkan');
  }

  async updateSisaCuti(id: string, data: SisaCuti) {
    await firstValueFrom(this.http.put(`/api/sisa-cuti/${id}`, data));
    this.sisaCuti.update(list => list.map(s => s.id === id ? {...s, ...data} : s));
    this.showToast('Kuota Cuti berhasil diperbarui');
  }

  async deleteSisaCuti(id: string) {
    await firstValueFrom(this.http.delete(`/api/sisa-cuti/${id}`));
    this.sisaCuti.update(list => list.filter(s => s.id !== id));
    this.showToast('Kuota Cuti berhasil dihapus', 'info');
  }

  async generateDefaultSisaCuti() {
    const year = this.yearN();
    const res = await firstValueFrom(this.http.post<SisaCuti[]>('/api/sisa-cuti/generate-default', {tahun: year}));
    this.sisaCuti.set(res);
    this.showToast('Sinkronisasi kuota tahunan selesai');
    await this.loadAllData(); // Full refresh to sync all related state
  }

  async importSisaCuti(payloads: Partial<SisaCuti>[]) {
    await firstValueFrom(this.http.post('/api/sisa-cuti/import', payloads));
    this.showToast('Berhasil mengimport data sisa cuti');
    await this.loadAllData();
  }

  async addPengajuanCuti(data: PengajuanCuti) {
    const res = await firstValueFrom(this.http.post<PengajuanCuti>('/api/pengajuan-cuti', data));
    this.pengajuanCuti.update(list => [res, ...list]);
    this.showToast('Pengajuan cuti berhasil dikirim');
  }

  async updatePengajuanCuti(id: string, data: Partial<PengajuanCuti>) {
    await firstValueFrom(this.http.put(`/api/pengajuan-cuti/${id}`, data));
    await this.loadAllData();
    this.showToast('Status pengajuan diperbarui');
  }

  async deletePengajuanCuti(id: string) {
    await firstValueFrom(this.http.delete(`/api/pengajuan-cuti/${id}`));
    await this.loadAllData();
    this.showToast('Pengajuan cuti dihapus', 'info');
  }
}
