const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

const startStr = "@if (activeModal() === 'cetak_surat' && selectedPengajuan(); as sc) {\n  @let peg = selectedPegawaiInfo();\n  @let isPPPK = peg?.status === 'PPPK' || peg?.status === 'CPPPK' || peg?.status === 'PPPK PW';";

const endStr = "}\n\n@if (activeModal() === 'user') {";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries", startIndex, endIndex);
  process.exit(1);
}

const replacement = startStr + `

  <!-- PDF VIEWER MODAL -->
  <div class="fixed inset-0 z-50 bg-[#323639] flex flex-col print:static print:bg-transparent print:block print:p-0">
    
    <!-- Viewer Toolbar (Hidden when printing) -->
    <div class="h-14 bg-[#323639] border-b border-black/20 flex items-center justify-between px-4 text-white shadow-sm print:hidden shrink-0">
      <div class="flex items-center gap-4">
        <button (click)="closeModal()" class="hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="font-medium text-sm truncate max-w-[200px] md:max-w-md">Pratinjau Surat Cuti - {{ sc.namaPegawai }}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <button (click)="printDocument()" class="hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors" title="Print / Download PDF">
          <mat-icon>print</mat-icon>
        </button>
        <button (click)="printDocument()" class="hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors" title="Download">
          <mat-icon>download</mat-icon>
        </button>
      </div>
    </div>

    <!-- Viewer Body -->
    <div class="flex-1 overflow-y-auto flex justify-center p-4 md:p-8 print:p-0 print:overflow-visible">
      
      <!-- F4 Paper Container -->
      <div class="bg-white text-black shadow-2xl shrink-0 print:shadow-none print:w-full print:max-w-none print:m-0" 
           style="width: 215.9mm; min-height: 330.2mm; padding: 10mm; font-family: 'Times New Roman', Times, serif;">
        
        <div class="text-[12px] flex justify-end print:text-[14px]">
          <div class="w-[350px]">
            @if (isPPPK) {
              <p>LAMPIRAN II<br>PERATURAN BADAN KEPEGAWAIAN NEGARA<br>REPUBLIK INDONESIA<br>NOMOR 7 TAHUN 2022<br>TENTANG TATA CARA PEMBERIAN CUTI PEGAWAI PEMERINTAH DENGAN PERJANJIAN KERJA</p>
            } @else {
              <p>ANAK LAMPIRAN 1.b<br>PERATURAN BADAN KEPEGAWAIAN NEGARA<br>REPUBLIK INDONESIA<br>NOMOR 24 TAHUN 2017<br>TENTANG<br>TATA CARA PEMBERIAN CUTI PEGAWAI NEGERI SIPIL</p>
            }
          </div>
        </div>

        <div class="text-center font-bold text-[14px] my-6 print:text-[16px]">
          @if (isPPPK) {
            <p>Formulir Permintaan dan Pemberian Cuti Pegawai Pemerintah Dengan Perjanjian Kerja</p>
          }
        </div>

        <div class="text-[12px] flex justify-end mb-6 print:text-[14px]">
          <div class="w-[350px]">
            <p>Demak, {{ sc.tanggalPengajuan | date:'dd MMMM yyyy' }}</p>
            <br>
            <p>Kepada<br>Yth. {{ sc.pejabatMenyetujui || 'Asisten Administrasi Umum Sekda' }}<br>di.<br>Demak</p>
          </div>
        </div>

        <div class="text-center font-bold text-[14px] mb-4 print:text-[16px]">
          <p class="underline">FORMULIR PERMINTAAN DAN PEMBERIAN CUTI</p>
        </div>

        <!-- Table I. DATA PEGAWAI -->
        <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
          <tr>
            <td colspan="4" class="border border-black px-2 py-1 font-bold">I. DATA PEGAWAI</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1 w-[15%]">Nama</td>
            <td class="border border-black px-2 py-1 w-[45%]">{{ sc.namaPegawai }}</td>
            <td class="border border-black px-2 py-1 w-[15%]">{{ isPPPK ? 'NI PPPK' : 'NIP' }}</td>
            <td class="border border-black px-2 py-1 w-[25%]">{{ sc.nip }}</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1">Jabatan</td>
            <td class="border border-black px-2 py-1">{{ peg?.jabatan || '-' }}</td>
            <td class="border border-black px-2 py-1">Masa Kerja</td>
            <td class="border border-black px-2 py-1">{{ peg?.masaKerja || '-' }}</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1">Unit Kerja</td>
            <td colspan="3" class="border border-black px-2 py-1">{{ peg?.unitKerja || cuti.pengaturan().namaInstansi }}</td>
          </tr>
        </table>

        <!-- Table II. JENIS CUTI -->
        @if (isPPPK) {
          <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
            <tr>
              <td colspan="2" class="border border-black px-2 py-1 font-bold">II. JENIS CUTI YANG DIAMBIL</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1 w-[80%]">Cuti Tahunan</td>
              <td class="border border-black px-2 py-1 text-center w-[20%] font-bold">{{ sc.kodeCuti === 'CT' ? '✔' : '-' }}</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1">Cuti Sakit</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CS' ? '✔' : '-' }}</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1">Cuti Melahirkan</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CM' ? '✔' : '-' }}</td>
            </tr>
          </table>
        } @else {
          <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
            <tr>
              <td colspan="4" class="border border-black px-2 py-1 font-bold">II. JENIS CUTI YANG DIAMBIL **</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1 w-[35%]">1. Cuti Tahunan</td>
              <td class="border border-black px-2 py-1 text-center w-[15%] font-bold">{{ sc.kodeCuti === 'CT' ? '✔' : '-' }}</td>
              <td class="border border-black px-2 py-1 w-[35%]">2. Cuti Besar</td>
              <td class="border border-black px-2 py-1 text-center w-[15%] font-bold">{{ sc.kodeCuti === 'CB' ? '✔' : '-' }}</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1">3. Cuti Sakit</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CS' ? '✔' : '-' }}</td>
              <td class="border border-black px-2 py-1">4. Cuti Melahirkan</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CM' ? '✔' : '-' }}</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1">5. Cuti Karena Alasan Penting</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CAP' ? '✔' : '-' }}</td>
              <td class="border border-black px-2 py-1">6. Cuti di Luar Tanggungan Negara</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CLTN' ? '✔' : '-' }}</td>
            </tr>
          </table>
        }

        <!-- Table III. ALASAN CUTI -->
        <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
          <tr>
            <td class="border border-black px-2 py-1 font-bold">III. ALASAN CUTI</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1">{{ sc.alasanCuti }}</td>
          </tr>
        </table>

        <!-- Table IV. LAMANYA CUTI -->
        <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
          <tr>
            <td colspan="4" class="border border-black px-2 py-1 font-bold">IV. LAMANYA CUTI</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1 w-[15%]">Selama</td>
            <td class="border border-black px-2 py-1 w-[35%]">{{ sc.lamaCuti }} (hari/bulan/tahun)*</td>
            <td class="border border-black px-2 py-1 w-[20%]">Mulai Tanggal</td>
            <td class="border border-black px-2 py-1 w-[30%]">{{ sc.tanggalMulai | date:'dd-MM-yyyy' }} <span class="mx-2">s/d</span> {{ sc.tanggalSelesai | date:'dd-MM-yyyy' }}</td>
          </tr>
        </table>

        <!-- Table V. CATATAN CUTI -->
        @if (isPPPK) {
          <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
            <tr>
              <td colspan="2" class="border border-black px-2 py-1 font-bold">V. CATATAN CUTI ***</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1 w-[80%]">1. Cuti Tahunan</td>
              <td class="border border-black px-2 py-1 text-center w-[20%] font-bold">{{ sc.kodeCuti === 'CT' ? '✔' : '-' }}</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1">2. Cuti Sakit</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CS' ? '✔' : '-' }}</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1">3. Cuti Karena Alasan Penting</td>
              <td class="border border-black px-2 py-1 text-center font-bold">{{ sc.kodeCuti === 'CAP' ? '✔' : '-' }}</td>
            </tr>
          </table>
        } @else {
          <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
            <tr>
              <td colspan="5" class="border border-black px-2 py-1 font-bold">V. CATATAN CUTI ***</td>
            </tr>
            <tr>
              <td colspan="3" class="border border-black px-2 py-1 w-[50%]">1. CUTI TAHUNAN</td>
              <td class="border border-black px-2 py-1 w-[40%]">2. CUTI BESAR</td>
              <td class="border border-black px-2 py-1 text-center w-[10%]">-</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1 text-center">Tahun</td>
              <td class="border border-black px-2 py-1 text-center">Sisa</td>
              <td class="border border-black px-2 py-1 text-center">Keterangan</td>
              <td class="border border-black px-2 py-1">3. CUTI SAKIT</td>
              <td class="border border-black px-2 py-1 text-center">-</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1 text-center">N - 2</td>
              <td class="border border-black px-2 py-1 text-center">{{ sc.sisaN2 }}</td>
              <td class="border border-black px-2 py-1"></td>
              <td class="border border-black px-2 py-1">4. CUTI MELAHIRKAN</td>
              <td class="border border-black px-2 py-1 text-center">-</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1 text-center">N - 1</td>
              <td class="border border-black px-2 py-1 text-center">{{ sc.sisaN1 }}</td>
              <td class="border border-black px-2 py-1"></td>
              <td class="border border-black px-2 py-1">5. CUTI KARENA ALASAN PENTING</td>
              <td class="border border-black px-2 py-1 text-center">-</td>
            </tr>
            <tr>
              <td class="border border-black px-2 py-1 text-center">N</td>
              <td class="border border-black px-2 py-1 text-center">{{ sc.sisaN }}</td>
              <td class="border border-black px-2 py-1"></td>
              <td class="border border-black px-2 py-1">6. CUTI DI LUAR TANGGUNGAN NEGARA</td>
              <td class="border border-black px-2 py-1 text-center">-</td>
            </tr>
          </table>
        }

        <!-- Table VI. ALAMAT -->
        <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
          <tr>
            <td colspan="3" class="border border-black px-2 py-1 font-bold">VI. ALAMAT SELAMA MENJALANKAN CUTI ***</td>
          </tr>
          <tr>
            <td class="border border-black border-t-0 px-2 py-1 align-top w-[45%]"></td>
            <td class="border border-black px-2 py-1 text-center w-[20%]">TELP</td>
            <td class="border border-black border-t-0 px-2 py-1 align-top w-[35%]"></td>
          </tr>
          <tr>
            <td class="border border-black border-t-0 px-2 py-1 align-top">{{ sc.alamatSelamaCuti }}</td>
            <td class="border border-black border-t-0 px-2 py-1 text-center align-top">{{ sc.telp }}</td>
            <td class="border border-black border-t-0 px-2 py-2 text-center align-top">
              <div class="flex flex-col items-center justify-between h-full pt-1 min-h-[80px]">
                <span>Hormat Saya,</span>
                <div class="mt-12 text-center">
                  <span class="underline block">({{ sc.namaPegawai }})</span>
                  <span>{{ isPPPK ? 'NI PPPK' : 'NIP' }} {{ sc.nip }}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Table VII. PERTIMBANGAN ATASAN LANGSUNG -->
        <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
          <tr>
            <td colspan="4" class="border border-black px-2 py-1 font-bold">VII. PERTIMBANGAN ATASAN LANGSUNG {{ isPPPK ? '**' : '' }}</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1 text-center w-[20%]">DISETUJUI</td>
            <td class="border border-black px-2 py-1 text-center w-[20%]">PERUBAHAN</td>
            <td class="border border-black px-2 py-1 text-center w-[25%]">DITANGGUHKAN</td>
            <td class="border border-black px-2 py-1 text-center w-[35%]">TIDAK DISETUJUI</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1 h-6"></td>
            <td class="border border-black px-2 py-1"></td>
            <td class="border border-black px-2 py-1"></td>
            <td class="border border-black px-2 py-1"></td>
          </tr>
          <tr>
            <td colspan="3" class="border border-black border-t-0 border-l-0 border-b-0 px-2 py-1"></td>
            <td class="border border-black border-t-0 px-2 py-2 text-center align-top h-24">
              <div class="flex flex-col items-center justify-between h-full pt-1">
                <span>Atasan Langsung,</span>
                <div class="mt-10 text-center">
                  <span class="underline block">({{ sc.atasanLangsung }})</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Table VIII. KEPUTUSAN PEJABAT YANG BERWENANG -->
        <table class="w-full border-collapse border border-black text-[12px] mb-2 print:text-[14px] print:mb-1">
          <tr>
            <td colspan="4" class="border border-black px-2 py-1 font-bold">VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI ** ***</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1 text-center w-[20%]">DISETUJUI</td>
            <td class="border border-black px-2 py-1 text-center w-[20%]">PERUBAHAN ****</td>
            <td class="border border-black px-2 py-1 text-center w-[25%]">DITANGGUHKAN ****</td>
            <td class="border border-black px-2 py-1 text-center w-[35%]">TIDAK DISETUJUI ****</td>
          </tr>
          <tr>
            <td class="border border-black px-2 py-1 h-6"></td>
            <td class="border border-black px-2 py-1"></td>
            <td class="border border-black px-2 py-1"></td>
            <td class="border border-black px-2 py-1"></td>
          </tr>
          <tr>
            <td colspan="3" class="border border-black border-t-0 border-l-0 border-b-0 px-2 py-1"></td>
            <td class="border border-black border-t-0 px-2 py-2 text-center align-top h-24">
              <div class="flex flex-col items-center justify-between h-full pt-1">
                <span>Pejabat Yang Memberikan Izin,</span>
                <div class="mt-10 text-center">
                  <span class="underline block">({{ sc.pejabatMenyetujui || 'Asisten Administrasi Umum Sekda' }})</span>
                  @if (!isPPPK) {
                    <span>NIP {{ cuti.pengaturan().nipKepalaOpd }}</span>
                  }
                </div>
              </div>
            </td>
          </tr>
        </table>

        @if (!isPPPK) {
          <div class="text-[10px] leading-tight print:text-[12px] mt-1">
            <p>Keterangan:</p>
            <p>* Silakan pilih salah satu atau lebih jenis cuti yang sesuai.</p>
            <p>** Silakan isi dengan jenis cuti yang diambil.</p>
            <p>*** Silakan isi dengan catatan cuti yang relevan.</p>
            <p>**** Silakan isi dengan keterangan tambahan jika diperlukan.</p>
            <p>N = Tahun berjalan</p>
            <p>N - 1 = Tahun sebelum tahun berjalan</p>
            <p>N - 2 = Tahun sebelum tahun berjalan</p>
          </div>
        }
      </div>
    </div>
  </div>
\n`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/app/app.html', code);
console.log("Patched successfully");
