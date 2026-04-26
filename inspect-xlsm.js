const XLSX = require("xlsx");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node inspect-xlsm.js <path-to-xlsm>");
  process.exit(1);
}

const wb = XLSX.readFile(filePath, { cellDates: true });
const sh = wb.Sheets["CONSULTAR MATERIAIS"];
if (!sh) {
  console.error("Sheet not found: CONSULTAR MATERIAIS");
  console.log("Sheets:", wb.SheetNames);
  process.exit(1);
}

const get = (a) => (sh[a] ? sh[a].v : undefined);
const cells = [
  "B14",
  "C14",
  "D14",
  "E14",
  "F14",
  "B15",
  "C15",
  "D15",
  "E15",
  "F15",
  "B16",
  "C16",
  "D16",
  "E16",
  "F16",
  "B18",
  "C18",
  "D18",
  "E18",
  "F18",
  "B20",
  "C20",
  "D20",
  "E20",
  "F20"
];

const out = {};
for (const c of cells) out[c] = get(c);
console.log("cells:", out);

const ref = sh["!ref"];
console.log("ref:", ref);
const range = XLSX.utils.decode_range(ref);
const r0 = range.s.r;
const r1 = Math.min(range.s.r + 120, range.e.r);
const c0 = range.s.c;
const c1 = Math.min(range.s.c + 25, range.e.c);

const rows = [];
for (let r = r0; r <= r1; r++) {
  const row = { r: r + 1 };
  let has = false;
  for (let c = c0; c <= c1; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const v = get(addr);
    if (v !== undefined && String(v) !== "") {
      row[addr] = v;
      has = true;
    }
  }
  if (has) rows.push(row);
}

console.log("non-empty sample rows:", rows.slice(0, 40));

