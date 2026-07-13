const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

// Table VI
code = code.replace(
  '<td class="border border-black border-t-0 border-b-0 px-2 py-1 align-top w-[45%]"></td>',
  '<td class="border border-black border-t-0 border-b-0 px-2 py-1 align-top w-[45%]"></td>'
);
code = code.replace(
  '<td class="border border-black border-b-0 px-2 py-1 text-center w-[20%]">TELP</td>',
  '<td class="border border-black border-b-0 px-2 py-1 text-center w-[15%]">TELP</td>'
);
code = code.replace(
  '<td class="border border-black border-t-0 border-b-0 px-2 py-1 align-top w-[35%]"></td>',
  '<td class="border border-black border-t-0 border-b-0 px-2 py-1 align-top w-[40%]"></td>'
);

// Table VII & VIII width replacement
code = code.replace(
  /<td class="border border-black px-2 py-1 text-center w-\[20%\]">DISETUJUI<\/td>/g,
  '<td class="border border-black px-2 py-1 text-center w-[15%]">DISETUJUI</td>'
);
code = code.replace(
  /<td class="border border-black px-2 py-1 text-center w-\[35%\]">TIDAK DISETUJUI(.*?)<\/td>/g,
  '<td class="border border-black px-2 py-1 text-center w-[40%]">TIDAK DISETUJUI$1</td>'
);

fs.writeFileSync('src/app/app.html', code);
console.log("Patched widths successfully");
