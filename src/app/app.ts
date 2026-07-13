import {ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, ViewChild, ElementRef} from '@angular/core';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import * as XLSX from 'xlsx';
import {
  CutiService,
  Pegawai,
  PengajuanCuti,
} from './cuti.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  cuti = inject(CutiService);
  private fb = inject(FormBuilder);

  // Database Diagnostic Signals
  dbDiagnosticResult = signal<any>(null);
  checkingDb = signal<boolean>(false);
  showDiagnosticModal = signal<boolean>(false);

  // UI State
  sidebarOpen = signal(false);
  pegawaiPage = signal(1);
  pegawaiPageSize = signal(10);
  sisaPage = signal(1);
  sisaPageSize = signal(10);

  // Modal & Edit State
  activeModal = signal<string | null>(null);
  editingId = signal<string | null>(null);
  deleteTarget = signal<{type: string; id: string; title: string} | null>(null);
  selectedPengajuan = signal<PengajuanCuti | null>(null);
  selectedPegawaiInfo = computed(() => this.cuti.pegawai().find(p => p.nip === this.selectedPengajuan()?.nip));
  uploadedFileName = signal<string>('');

  // Search & Filter Signals
  searchQuery = signal<string>('');
  filterStatus = signal<string>('ALL');

  monthlyStats = computed(() => {
    const pengajuan = this.cuti.pengajuanCuti();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = new Array(12).fill(0);
    
    pengajuan.forEach(p => {
      if(p.tanggalPengajuan) {
        const monthIndex = new Date(p.tanggalPengajuan).getMonth();
        counts[monthIndex]++;
      }
    });

    const max = Math.max(...counts, 1);
    return months.map((label, index) => ({
      label,
      count: counts[index],
      percentage: (counts[index] / max) * 100
    }));
  });

  // Forms
  loginForm: FormGroup = this.fb.group({
    username: ['admin_cuti', Validators.required],
    password: ['123', Validators.required],
  });

  pengaturanForm: FormGroup = this.fb.group({
    namaInstansi: ['', Validators.required],
    namaKepalaOpd: ['', Validators.required],
    nipKepalaOpd: ['', Validators.required],
    alamatInstansi: ['', Validators.required],
    logoInstansi: [''],
    supabaseUrl: [''],
    supabaseKey: [''],
  });

  pegawaiForm: FormGroup = this.fb.group({
    nama: ['', Validators.required],
    nip: ['', Validators.required],
    jabatan: ['', Validators.required],
    unitKerja: ['Bagian Umum Setda', Validators.required],
    status: ['PNS', Validators.required],
    jenisKelamin: ['Laki-laki', Validators.required],
    masaKerja: ['', Validators.required],
  });

  liburForm: FormGroup = this.fb.group({
    tanggalLibur: ['', Validators.required],
    namaLibur: ['', Validators.required],
    jenisLibur: ['Libur Nasional', Validators.required],
    keterangan: [''],
  });

  pejabatForm: FormGroup = this.fb.group({
    namaPegawai: ['', Validators.required],
    nip: [''],
    jabatan: [''],
    peran: ['Atasan Langsung', Validators.required],
  });

  jenisForm: FormGroup = this.fb.group({
    kode: ['', Validators.required],
    namaCuti: ['', Validators.required],
    maksimalHari: [12, Validators.required],
    keterangan: [''],
    berlakuUntuk: ['Semua', Validators.required],
  });

  sisaForm: FormGroup = this.fb.group({
    nip: ['', Validators.required],
    namaPegawai: ['', Validators.required],
    tahun: [2026, Validators.required],
    sisaN2: [0, Validators.required],
    sisaN1: [0, Validators.required],
    sisaN: [12, Validators.required],
  });

  pengajuanForm: FormGroup = this.fb.group({
    tanggalPengajuan: [this.getToday(), Validators.required],
    nip: ['', Validators.required],
    namaPegawai: [''],
    jenisCuti: ['Cuti Tahunan', Validators.required],
    kodeCuti: ['CT'],
    lamaCuti: [1, [Validators.required, Validators.min(1)]],
    tanggalMulai: [this.getToday(), Validators.required],
    tanggalSelesai: [this.getToday(), Validators.required],
    sisaN2: [0],
    sisaN1: [0],
    sisaN: [12],
    alasanCuti: ['', Validators.required],
    alamatSelamaCuti: ['', Validators.required],
    telp: ['', Validators.required],
    dokumen: [''],
    atasanLangsung: ['', Validators.required],
    pejabatMenyetujui: ['', Validators.required],
  });

  verifForm: FormGroup = this.fb.group({
    status: ['Disetujui', Validators.required],
    catatanVerifikator: [''],
  });

  userForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['123', Validators.required],
    nama: ['', Validators.required],
    role: ['Operator', Validators.required],
    nip: [''],
  });

  // Filtered lists computed
  filteredPegawai = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.cuti.pegawai().filter(p => p.nama.toLowerCase().includes(q) || p.nip.includes(q));
  });

  paginatedPegawai = computed(() => {
    const all = this.filteredPegawai();
    const start = (this.pegawaiPage() - 1) * this.pegawaiPageSize();
    return all.slice(start, start + this.pegawaiPageSize());
  });

  searchSisaTabel = signal('');

  filteredSisaTabel = computed(() => {
    const q = this.searchSisaTabel().toLowerCase();
    return this.cuti.sisaCuti().filter(s => s.namaPegawai.toLowerCase().includes(q) || s.nip.toLowerCase().includes(q));
  });

  paginatedSisa = computed(() => {
    const all = this.filteredSisaTabel();
    const start = (this.sisaPage() - 1) * this.sisaPageSize();
    return all.slice(start, start + this.sisaPageSize());
  });

  // Pagination & Filtering
  searchPejabat = signal('');
  searchPegawaiPengajuan = signal('');
  searchSisaPegawai = signal('');
  searchAtasan = signal('');
  searchPejabatMenyetujui = signal('');

  dropdownPejabatOpen = signal(false);
  dropdownPengajuanOpen = signal(false);
  dropdownAtasanOpen = signal(false);
  dropdownPejabatMenyetujuiOpen = signal(false);
  dropdownSisaOpen = signal(false);

  selectedPengajuanNip = signal('');

  allowedJenisCuti = computed(() => {
    const nip = this.selectedPengajuanNip();
    const allJenis = this.cuti.jenisCuti();
    if (!nip) return allJenis;
    
    const peg = this.cuti.pegawai().find(p => p.nip === nip);
    if (!peg) return allJenis;

    const masa = peg.masaKerja || '';
    const matchTahun = masa.match(/(\d+)\s*Tahun/i);
    const mkTahun = matchTahun ? parseInt(matchTahun[1]) : 0;
    
    if (mkTahun < 1) {
      return [];
    }

    let allowed = allJenis;

    if (peg.status.includes('PPPK')) {
      allowed = allowed.filter(j => 
        j.namaCuti.toLowerCase().includes('tahunan') || 
        j.namaCuti.toLowerCase().includes('sakit') || 
        j.namaCuti.toLowerCase().includes('melahirkan') ||
        j.kode === 'CT' || j.kode === 'CS' || j.kode === 'CM'
      );
    }

    if (peg.status === 'PNS' && mkTahun < 5) {
      allowed = allowed.filter(j => !j.namaCuti.toLowerCase().includes('besar') && j.kode !== 'CB');
    }

    return allowed;
  });

  // Dropdown filtered lists
  filteredPejabatList = computed(() => {
    const q = this.searchPejabat().toLowerCase();
    return this.cuti.pegawai().filter(p => p.nama.toLowerCase().includes(q) || p.jabatan.toLowerCase().includes(q));
  });

  filteredAtasanList = computed(() => {
    const q = this.searchAtasan().toLowerCase();
    return this.cuti.atasanPejabat().filter(a => a.peran === 'Atasan Langsung' && (a.namaPegawai.toLowerCase().includes(q) || a.jabatan.toLowerCase().includes(q)));
  });

  filteredPejabatMenyetujuiList = computed(() => {
    const q = this.searchPejabatMenyetujui().toLowerCase();
    return this.cuti.atasanPejabat().filter(a => a.peran === 'Penanggung Jawab' && (a.namaPegawai.toLowerCase().includes(q) || a.jabatan.toLowerCase().includes(q)));
  });

  filteredPegawaiPengajuanList = computed(() => {
    const q = this.searchPegawaiPengajuan().toLowerCase();
    return this.cuti.pegawai().filter(p => p.nama.toLowerCase().includes(q) || p.nip.toLowerCase().includes(q));
  });

  filteredSisaPegawaiList = computed(() => {
    const q = this.searchSisaPegawai().toLowerCase();
    return this.cuti.pegawai().filter(p => p.nama.toLowerCase().includes(q) || p.nip.toLowerCase().includes(q));
  });

  selectPejabat(p: any) {
    this.pejabatForm.patchValue({ namaPegawai: p.nama });
  }

  selectPengajuanPegawai(p: any) {
    this.pengajuanForm.patchValue({ nip: p.nip, namaPegawai: p.nama });
    this.selectedPengajuanNip.set(p.nip);
  }

  selectSisaPegawai(p: any) {
    this.sisaForm.patchValue({ nip: p.nip, namaPegawai: p.nama });
  }

  pegawaiTotalPages = computed(() => {
    return Math.ceil(this.filteredPegawai().length / this.pegawaiPageSize()) || 1;
  });

  sisaTotalPages = computed(() => {
    return Math.ceil(this.filteredSisaTabel().length / this.sisaPageSize()) || 1;
  });

  nextPegawaiPage() {
    if (this.pegawaiPage() < this.pegawaiTotalPages()) {
      this.pegawaiPage.update(p => p + 1);
    }
  }

  prevPegawaiPage() {
    if (this.pegawaiPage() > 1) {
      this.pegawaiPage.update(p => p - 1);
    }
  }

  nextSisaPage() {
    if (this.sisaPage() < this.sisaTotalPages()) {
      this.sisaPage.update(p => p + 1);
    }
  }

  prevSisaPage() {
    if (this.sisaPage() > 1) {
      this.sisaPage.update(p => p - 1);
    }
  }

  filteredPengajuan = computed(() => {
    const st = this.filterStatus();
    const q = this.searchQuery().toLowerCase();
    return this.cuti.pengajuanCuti().filter(c => {
      // Exclude 'Disetujui' completely from this table
      if (c.status === 'Disetujui') return false;
      const matchSt = st === 'ALL' || c.status === st;
      const matchQ = c.namaPegawai.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q);
      return matchSt && matchQ;
    });
  });

  ngOnInit() {
    this.cuti.loadAllData().then(() => {
      this.initPengaturanForm();
    });

    // Auto calculate tanggal selesai
    this.pengajuanForm.get('tanggalMulai')?.valueChanges.subscribe(() => this.calcSelesai());
    this.pengajuanForm.get('lamaCuti')?.valueChanges.subscribe(() => this.calcSelesai());

    // Auto fill Pegawai details on NIP change
    this.pengajuanForm.get('nip')?.valueChanges.subscribe(nip => {
      if (!nip) return;
      const p = this.cuti.pegawai().find(x => x.nip === nip);
      if (p) {
        this.pengajuanForm.patchValue({namaPegawai: p.nama}, {emitEvent: false});
      }
      const s = this.cuti.sisaCuti().find(x => x.nip === nip && x.tahun === 2026);
      if (s) {
        this.pengajuanForm.patchValue({sisaN2: s.sisaN2, sisaN1: s.sisaN1, sisaN: s.sisaN}, {emitEvent: false});
      } else {
        this.pengajuanForm.patchValue({sisaN2: 0, sisaN1: 0, sisaN: 12}, {emitEvent: false});
      }
    });

    // Auto fill kodeCuti
    this.pengajuanForm.get('jenisCuti')?.valueChanges.subscribe(nm => {
      const j = this.cuti.jenisCuti().find(x => x.namaCuti === nm);
      if (j) {
        this.pengajuanForm.patchValue({kodeCuti: j.kode}, {emitEvent: false});
      }
    });

    // Auto fill Pejabat details in pejabatForm
    this.pejabatForm.get('namaPegawai')?.valueChanges.subscribe(nama => {
      const p = this.cuti.pegawai().find(x => x.nama === nama);
      if (p) {
        this.pejabatForm.patchValue({nip: p.nip, jabatan: p.jabatan}, {emitEvent: false});
      }
    });

    // Auto fill Sisa form name
    this.sisaForm.get('nip')?.valueChanges.subscribe(nip => {
      const p = this.cuti.pegawai().find(x => x.nip === nip);
      if (p) {
        this.sisaForm.patchValue({namaPegawai: p.nama}, {emitEvent: false});
      }
    });
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private calcSelesai() {
    const mulai = this.pengajuanForm.get('tanggalMulai')?.value;
    const lama = Number(this.pengajuanForm.get('lamaCuti')?.value) || 1;
    if (mulai) {
      const d = new Date(mulai);
      d.setDate(d.getDate() + Math.max(0, lama - 1));
      const selesai = d.toISOString().split('T')[0];
      this.pengajuanForm.patchValue({tanggalSelesai: selesai}, {emitEvent: false});
    }
  }

  initPengaturanForm() {
    this.pengaturanForm.patchValue(this.cuti.pengaturan());
  }

  // --- AUTH METHODS ---
  onLogin() {
    if (this.loginForm.invalid) return;
    const {username, password} = this.loginForm.value;
    const u = this.cuti.users().find(x => x.username === username && x.password === password);
    if (u) {
      this.cuti.currentUser.set(u);
      this.cuti.showToast(`Selamat datang, ${u.nama} (${u.role})`);
    } else {
      this.cuti.showToast('Username atau password salah!', 'error');
    }
  }

  async runDbDiagnostics() {
    this.checkingDb.set(true);
    this.showDiagnosticModal.set(true);
    this.dbDiagnosticResult.set(null);
    try {
      const res = await fetch('/api/db-status');
      if (res.ok) {
        const data = await res.json();
        this.dbDiagnosticResult.set(data);
      } else {
        this.dbDiagnosticResult.set({
          error: `HTTP error ${res.status}`
        });
      }
    } catch (err: any) {
      this.dbDiagnosticResult.set({
        error: err?.message || String(err)
      });
    } finally {
      this.checkingDb.set(false);
    }
  }

  quickLogin(role: string) {
    const u = this.cuti.users().find(x => x.role.toLowerCase() === role.toLowerCase()) || this.cuti.users()[0];
    if (u) {
      this.cuti.currentUser.set(u);
      this.cuti.showToast(`Login cepat sebagai ${u.nama}`);
    }
  }

  logout() {
    this.cuti.currentUser.set(null);
    this.cuti.activeMenu.set('dashboard');
    this.cuti.showToast('Berhasil logout', 'info');
  }

  setMenu(menu: string) {
    this.cuti.activeMenu.set(menu);
    this.searchQuery.set('');
    if (menu === 'pengaturan') {
      this.initPengaturanForm();
    }
  }

  // --- FILE UPLOAD SIMULATION ---
  async onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validation size (max 500 KB)
      const maxSize = 500 * 1024;
      if (file.size > maxSize) {
        this.cuti.showToast('Ukuran file maksimal 500 KB', 'error');
        input.value = '';
        return;
      }

      const oldUrl = this.pengajuanForm.get('dokumen')?.value;
      this.uploadedFileName.set(file.name);
      try {
        this.cuti.showToast('Mengupload dokumen...', 'info');
        const url = await this.cuti.uploadFile('berkas', file);
        this.pengajuanForm.patchValue({ dokumen: url });
        if (oldUrl) {
          await this.cuti.deleteFile(oldUrl);
        }
        this.cuti.showToast(`File "${file.name}" berhasil diupload`, 'success');
      } catch (err: any) {
        this.cuti.showToast('Gagal upload ke bucket: ' + err.message, 'error');
        // Fallback to file name only
        this.pengajuanForm.patchValue({dokumen: file.name});
      }
    }
  }

  // --- MODAL HANDLERS ---
  openModal(type: string, item?: any) {
    this.editingId.set(item?.id || null);
    this.activeModal.set(type);

    if (type === 'pegawai') {
      if (item) this.pegawaiForm.patchValue(item);
      else this.pegawaiForm.reset({unitKerja: 'Bagian Umum Setda', status: 'PNS', jenisKelamin: 'Laki-laki'});
    } else if (type === 'libur') {
      if (item) this.liburForm.patchValue(item);
      else this.liburForm.reset({jenisLibur: 'Libur Nasional'});
    } else if (type === 'pejabat') {
      if (item) this.pejabatForm.patchValue(item);
      else this.pejabatForm.reset({peran: 'Atasan Langsung'});
    } else if (type === 'jenis') {
      if (item) this.jenisForm.patchValue(item);
      else this.jenisForm.reset({maksimalHari: 12, berlakuUntuk: 'PNS, PPPK'});
    } else if (type === 'sisa') {
      if (item) this.sisaForm.patchValue(item);
      else this.sisaForm.reset({tahun: 2026, sisaN2: 0, sisaN1: 0, sisaN: 12});
    } else if (type === 'pengajuan') {
      this.uploadedFileName.set('');
      const curUser = this.cuti.currentUser();
      const defaultPeg = curUser?.nip ? this.cuti.pegawai().find(p => p.nip === curUser.nip) : undefined;
      const atas = this.cuti.atasanPejabat().find(a => a.peran === 'Atasan Langsung');
      const setujui = this.cuti.atasanPejabat().find(a => a.peran === 'Penanggung Jawab');
      if (item) {
        this.pengajuanForm.patchValue(item);
        if (item.dokumen) this.uploadedFileName.set(item.dokumen);
        this.selectedPengajuanNip.set(item.nip || '');
      } else {
        const dNip = defaultPeg?.nip || '';
        this.pengajuanForm.reset({
          tanggalPengajuan: this.getToday(),
          nip: dNip,
          namaPegawai: defaultPeg?.nama || '',
          jenisCuti: 'Cuti Tahunan',
          kodeCuti: 'CT',
          lamaCuti: 2,
          tanggalMulai: this.getToday(),
          tanggalSelesai: this.getToday(),
          sisaN2: 0,
          sisaN1: 0,
          sisaN: 12,
          alasanCuti: '',
          alamatSelamaCuti: '',
          telp: '',
          dokumen: '',
          atasanLangsung: atas?.namaPegawai || '',
          pejabatMenyetujui: setujui?.namaPegawai || '',
        });
        this.selectedPengajuanNip.set(dNip);
      }
    } else if (type === 'view_pengajuan' || type === 'cetak_surat') {
      this.selectedPengajuan.set(item || null);
      if (item) {
        this.verifForm.patchValue({status: item.status, catatanVerifikator: item.catatanVerifikator || ''});
      }
    } else if (type === 'user') {
      if (item) this.userForm.patchValue(item);
      else this.userForm.reset({role: 'Operator', password: '123'});
    }
  }

  closeModal() {
    this.activeModal.set(null);
    this.editingId.set(null);
    this.deleteTarget.set(null);
    this.selectedPengajuan.set(null);
  }

  // --- SUBMIT HANDLERS ---
  onSavePengaturan() {
    if (this.pengaturanForm.invalid) return;
    this.cuti.savePengaturan(this.pengaturanForm.value);
  }

  onSavePegawai() {
    if (this.pegawaiForm.invalid) {
      this.cuti.showToast('Lengkapi semua data pegawai wajib!', 'error');
      return;
    }
    const id = this.editingId();
    if (id) this.cuti.updatePegawai(id, this.pegawaiForm.value);
    else this.cuti.addPegawai(this.pegawaiForm.value);
    this.closeModal();
  }

  onSaveLibur() {
    if (this.liburForm.invalid) return;
    const id = this.editingId();
    if (id) this.cuti.updateHariLibur(id, this.liburForm.value);
    else this.cuti.addHariLibur(this.liburForm.value);
    this.closeModal();
  }

  onSavePejabat() {
    if (this.pejabatForm.invalid) return;
    const id = this.editingId();
    if (id) this.cuti.updateAtasanPejabat(id, this.pejabatForm.value);
    else this.cuti.addAtasanPejabat(this.pejabatForm.value);
    this.closeModal();
  }

  onSaveJenis() {
    if (this.jenisForm.invalid) return;
    const id = this.editingId();
    if (id) this.cuti.updateJenisCuti(id, this.jenisForm.value);
    else this.cuti.addJenisCuti(this.jenisForm.value);
    this.closeModal();
  }

  onSaveSisa() {
    if (this.sisaForm.invalid) return;
    const id = this.editingId();
    if (id) this.cuti.updateSisaCuti(id, this.sisaForm.value);
    else this.cuti.addSisaCuti(this.sisaForm.value);
    this.closeModal();
  }

  onSavePengajuan() {
    if (this.pengajuanForm.invalid) {
      this.cuti.showToast('Mohon lengkapi formulir pengajuan dengan benar', 'error');
      return;
    }
    const val = this.pengajuanForm.value;
    const tglMulai = new Date(val.tanggalMulai);
    const tglPengajuan = new Date(val.tanggalPengajuan);
    tglMulai.setHours(0,0,0,0);
    tglPengajuan.setHours(0,0,0,0);

    const diffTime = tglMulai.getTime() - tglPengajuan.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 3) {
      this.cuti.showToast('Tanggal pelaksanaan minimal 3 hari dari tanggal pengajuan!', 'error');
      return;
    }

    const id = this.editingId();
    if (id) {
      this.cuti.updatePengajuanCuti(id, val);
    } else {
      this.cuti.addPengajuanCuti({
        ...val,
        createdBy: this.cuti.currentUser()?.id || 'unknown'
      });
    }
    this.closeModal();
  }

  onSaveVerifikasi() {
    const target = this.selectedPengajuan();
    if (!target || !target.id) return;
    this.cuti.updatePengajuanCuti(target.id, this.verifForm.value);
    this.closeModal();
  }

  onSaveUser() {
    if (this.userForm.invalid) return;
    const id = this.editingId();
    if (id) this.cuti.updateUser(id, this.userForm.value);
    else this.cuti.addUser(this.userForm.value);
    this.closeModal();
  }

  // --- DELETE CONFIRMATION ---
  confirmDelete(type: string, id: string, title: string) {
    this.deleteTarget.set({type, id, title});
    this.activeModal.set('confirm_delete');
  }

  executeDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    const {type, id} = target;

    if (type === 'pegawai') this.cuti.deletePegawai(id);
    else if (type === 'libur') this.cuti.deleteHariLibur(id);
    else if (type === 'pejabat') this.cuti.deleteAtasanPejabat(id);
    else if (type === 'jenis') this.cuti.deleteJenisCuti(id);
    else if (type === 'sisa') this.cuti.deleteSisaCuti(id);
    else if (type === 'pengajuan') this.cuti.deletePengajuanCuti(id);
    else if (type === 'user') this.cuti.deleteUser(id);

    this.closeModal();
  }

  // --- EXPORT/IMPORT PEGAWAI ---
  exportPegawaiTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        nama: 'John Doe', nip: '199001012024011001', jabatan: 'Analis Kepegawaian',
        unitKerja: 'Bagian Umum Setda', status: 'PNS', jenisKelamin: 'Laki-laki', masaKerja: '5 Tahun'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Pegawai");
    XLSX.writeFile(wb, "Template_Data_Pegawai.xlsx");
  }

  importPegawaiExcel(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      this.cuti.showToast('Pilih satu file excel', 'error');
      return;
    }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let successCount = 0;
        data.forEach((row: any) => {
          if(row.nama && row.nip) {
            const pegawai: Partial<Pegawai> = {
              nama: row.nama,
              nip: String(row.nip),
              jabatan: row.jabatan || '-',
              unitKerja: row.unitKerja || 'Bagian Umum Setda',
              status: row.status || 'PNS',
              jenisKelamin: row.jenisKelamin || 'Laki-laki',
              masaKerja: String(row.masaKerja || '0 Tahun')
            };
            this.cuti.addPegawai(pegawai as Pegawai);
            successCount++;
          }
        });
        this.cuti.showToast(`Berhasil import ${successCount} data pegawai`, 'success');
      } catch(err) {
        this.cuti.showToast('Gagal memproses file excel', 'error');
      }
    };
    reader.readAsBinaryString(target.files[0]);
    event.target.value = '';
  }

  async onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      // Validation size (max 500 KB) for logo
      const maxSize = 500 * 1024;
      if (file.size > maxSize) {
        this.cuti.showToast('Ukuran file logo maksimal 500 KB', 'error');
        event.target.value = '';
        return;
      }
      
      const oldUrl = this.pengaturanForm.get(fieldName)?.value;

      try {
        this.cuti.showToast('Mengupload logo...', 'info');
        const url = await this.cuti.uploadFile('berkas', file);
        this.pengaturanForm.patchValue({
          [fieldName]: url
        });
        if (oldUrl) {
          await this.cuti.deleteFile(oldUrl);
        }
        this.cuti.showToast('Logo berhasil diupload', 'success');
      } catch (err: any) {
        this.cuti.showToast('Upload ke bucket gagal: ' + err.message, 'error');
        // Fallback to local base64
        const reader = new FileReader();
        reader.onload = () => {
          this.pengaturanForm.patchValue({
            [fieldName]: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  @ViewChild('fileInputImportSisa') fileInputImportSisa!: ElementRef<HTMLInputElement>;

  downloadTemplateSisa() {
    const data = [
      { NIP: '198001012010011001', 'Nama Pegawai': 'Joko Cuti', 'Tahun': this.cuti.yearN(), 'Sisa N-2': 0, 'Sisa N-1': 2, 'Sisa N': 12 }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Sisa_Cuti");
    XLSX.writeFile(wb, "Template_Sisa_Cuti.xlsx");
  }

  triggerImportSisa() {
    if (this.fileInputImportSisa) {
      this.fileInputImportSisa.nativeElement.click();
    }
  }

  onImportSisaCuti(event: any) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    
    const file = target.files[0];
    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let payloads: any[] = [];
        for (const row of data as any[]) {
          const nip = row['NIP'];
          const sisaN2 = parseInt(row['Sisa N-2']) || 0;
          const sisaN1 = parseInt(row['Sisa N-1']) || 0;
          const sisaN = row['Sisa N'] !== undefined ? parseInt(row['Sisa N']) : 12;
          const tahun = parseInt(row['Tahun']) || this.cuti.yearN();
          
          if (nip) {
            const peg = this.cuti.pegawai().find(p => p.nip === nip.toString() || p.nip === nip);
            if (peg) {
               payloads.push({
                  nip: peg.nip,
                  namaPegawai: peg.nama,
                  tahun: tahun,
                  sisaN2: sisaN2,
                  sisaN1: sisaN1,
                  sisaN: sisaN
               });
            }
          }
        }
        
        if (payloads.length > 0) {
          await this.cuti.importSisaCuti(payloads);
        } else {
          this.cuti.showToast('Tidak ada data yang valid untuk diimport', 'error');
        }
      } catch (err) {
        console.error(err);
        this.cuti.showToast('Gagal memproses file Excel', 'error');
      } finally {
        if (this.fileInputImportSisa) {
          this.fileInputImportSisa.nativeElement.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  }

  printDocument() {
    window.print();
  }

  toggleBerlakuUntuk(val: string) {
    const current = this.jenisForm.get('berlakuUntuk')?.value || '';
    let values = current ? current.split(',').map((v: string) => v.trim()).filter(Boolean) : [];
    
    if (values.includes(val)) {
      values = values.filter((v: string) => v !== val);
    } else {
      values.push(val);
    }

    this.jenisForm.get('berlakuUntuk')?.setValue(values.join(', '));
  }

  isBerlaku(val: string): boolean {
    const current = this.jenisForm.get('berlakuUntuk')?.value || '';
    const values = current.split(',').map((v: string) => v.trim());
    return values.includes(val);
  }
}

