const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

// Fix Table VI
code = code.replace(
  '<td class="border border-black border-t-0 px-2 py-1 align-top w-[45%]"></td>',
  '<td class="border border-black border-t-0 border-b-0 px-2 py-1 align-top w-[45%]"></td>'
);
code = code.replace(
  '<td class="border border-black border-t-0 px-2 py-1 align-top w-[35%]"></td>',
  '<td class="border border-black border-t-0 border-b-0 px-2 py-1 align-top w-[35%]"></td>'
);
code = code.replace(
  '<td class="border border-black px-2 py-1 text-center w-[20%]">TELP</td>',
  '<td class="border border-black border-b-0 px-2 py-1 text-center w-[20%]">TELP</td>'
);

// Fix Table VII (two instances)
code = code.replace(
  '<td class="border border-black px-2 py-1 h-6"></td>\n          <td class="border border-black px-2 py-1"></td>\n          <td class="border border-black px-2 py-1"></td>\n          <td class="border border-black px-2 py-1"></td>',
  '<td class="border border-black border-b-0 px-2 py-1 h-6"></td>\n          <td class="border border-black border-b-0 px-2 py-1"></td>\n          <td class="border border-black border-b-0 px-2 py-1"></td>\n          <td class="border border-black border-b-0 px-2 py-1"></td>'
);

// Second replace for Table VIII
code = code.replace(
  '<td class="border border-black px-2 py-1 h-6"></td>\n          <td class="border border-black px-2 py-1"></td>\n          <td class="border border-black px-2 py-1"></td>\n          <td class="border border-black px-2 py-1"></td>',
  '<td class="border border-black border-b-0 px-2 py-1 h-6"></td>\n          <td class="border border-black border-b-0 px-2 py-1"></td>\n          <td class="border border-black border-b-0 px-2 py-1"></td>\n          <td class="border border-black border-b-0 px-2 py-1"></td>'
);

fs.writeFileSync('src/app/app.html', code);
console.log("Patched borders successfully");
