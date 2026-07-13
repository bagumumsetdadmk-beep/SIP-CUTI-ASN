const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

const oldToolbar = `<div class="h-14 bg-[#323639] border-b border-black/20 flex items-center justify-between px-4 text-white shadow-sm print:hidden shrink-0">
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
    </div>`;

const newToolbar = `<div class="h-14 bg-[#323639] border-b border-black/30 flex items-center justify-between px-4 text-[#F1F3F4] text-[13px] print:hidden shrink-0 select-none">
      <div class="flex items-center gap-3">
        <button (click)="closeModal()" class="hover:bg-white/10 p-1.5 rounded flex items-center justify-center transition-colors" title="Back">
          <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center">menu</mat-icon>
        </button>
        <span class="font-medium truncate max-w-[150px] md:max-w-[200px] cursor-default">Formulir Cuti - {{ sc.namaPegawai }}.pdf</span>
      </div>
      
      <div class="hidden md:flex items-center gap-4 text-[#F1F3F4]">
        <div class="flex items-center gap-2">
          <span class="bg-[#202124] px-2 py-1 rounded text-center min-w-[36px]">1</span> / 1
        </div>
        <div class="w-[1px] h-4 bg-[#5F6368]"></div>
        <div class="flex items-center gap-1">
          <button class="hover:bg-white/10 p-1 rounded transition-colors"><mat-icon class="text-[18px] w-[18px] h-[18px]">remove</mat-icon></button>
          <span class="bg-[#202124] px-2 py-1 rounded text-center w-14">100%</span>
          <button class="hover:bg-white/10 p-1 rounded transition-colors"><mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon></button>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button (click)="printDocument()" class="hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors" title="Cetak Surat (Print)">
          <mat-icon class="text-[20px] w-5 h-5">print</mat-icon>
        </button>
        <button (click)="printDocument()" class="hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors" title="Unduh (Download PDF)">
          <mat-icon class="text-[20px] w-5 h-5">download</mat-icon>
        </button>
        <button class="hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors">
          <mat-icon class="text-[20px] w-5 h-5">more_vert</mat-icon>
        </button>
      </div>
    </div>`;

code = code.replace(oldToolbar, newToolbar);
fs.writeFileSync('src/app/app.html', code);
console.log("Toolbar patched successfully");
