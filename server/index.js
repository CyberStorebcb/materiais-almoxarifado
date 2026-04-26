import express from "express";
import cors from "cors";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const EXCEL_PATH =
  process.env.EXCEL_PATH || "c:\\Users\\ytalo\\Downloads\\01. NOVO MATERIAIS POR PEP.xlsm";

app.use(cors({ origin: true }));
app.use(express.json());

let cache = {
  loadedAtMs: 0,
  excelMtimeMs: 0,
  rows: [],
  byPep3: new Map()
};

function norm(s) {
  return String(s || "").trim().toUpperCase();
}

function pep3FromRow(r) {
  // Prefer the explicit PEP III column; fallback to split PEP IV.
  const pep3 = r["PEP III"] ?? r["pep iii"];
  if (pep3) return norm(pep3);
  const pep4 = r["PEP IV"] ?? r["pep iv"] ?? r["PEP IV "] ?? r["PEP IV"];
  const p = norm(pep4);
  if (!p) return "";
  // drop trailing ".I" ".M" etc if present
  return p.replace(/\.[A-Z0-9]$/, "");
}

function parseCN52N(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets["CN52N"];
  if (!sheet) throw new Error("Aba CN52N não encontrada na planilha.");
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  // Keep original keys, but we will access the main ones by exact labels seen in file.
  const byPep3 = new Map();
  for (const r of json) {
    const pep3 = pep3FromRow(r);
    if (!pep3) continue;
    if (!byPep3.has(pep3)) byPep3.set(pep3, []);
    byPep3.get(pep3).push(r);
  }
  return { rows: json, byPep3 };
}

async function ensureCache() {
  const st = await stat(EXCEL_PATH);
  const mtimeMs = st.mtimeMs || 0;
  if (cache.rows.length && cache.excelMtimeMs === mtimeMs) return;

  const { rows, byPep3 } = parseCN52N(EXCEL_PATH);
  cache = {
    loadedAtMs: Date.now(),
    excelMtimeMs: mtimeMs,
    rows,
    byPep3
  };
}

function materialFromRow(r, idx) {
  const pep4 = String(r["PEP IV"] ?? "").trim();
  const suffix = pep4.toUpperCase().match(/\.([A-Z0-9])$/)?.[1] || "";
  const ivLabel = suffix === "I" ? "ODI" : suffix === "M" ? "ODM" : suffix === "S" ? "ODS" : "";
  return {
    id: idx + 1,
    iv: ivLabel,
    pep: pep4,
    codigo: r["CÓDIGO"] ?? r["CODIGO"] ?? "",
    descricao: r["DESCRIÇÃO"] ?? r["DESCRICAO"] ?? "",
    unidade: r["UMB"] ?? "",
    qtdSolicitada: Number(r["QTD NECESSIDADE"] ?? 0) || 0,
    qtdBaixada: Number(r["QTD BAIXADA"] ?? 0) || 0,
    qtdFaltante: Number(r["QTD FALTA"] ?? 0) || 0,
    reserva: r["RESERVA"] ?? "",
    item: r["ITEM"] ?? ""
  };
}

function agruparMateriais(rows) {
  // A aba "CONSULTAR MATERIAIS" agrega por (PEP IV + CÓDIGO + UMB + DESCRIÇÃO).
  const groups = new Map();
  for (const r of rows) {
    const pep4 = String(r["PEP IV"] ?? "").trim();
    const codigo = String(r["CÓDIGO"] ?? r["CODIGO"] ?? "").trim();
    const descricao = String(r["DESCRIÇÃO"] ?? r["DESCRICAO"] ?? "").trim();
    const unidade = String(r["UMB"] ?? "").trim();
    const key = `${pep4}||${codigo}||${unidade}||${descricao}`;

    const acc =
      groups.get(key) ||
      ({
        pep: pep4,
        codigo,
        descricao,
        unidade,
        qtdSolicitada: 0,
        qtdBaixada: 0,
        qtdFaltante: 0
      });

    acc.qtdSolicitada += Number(r["QTD NECESSIDADE"] ?? 0) || 0;
    acc.qtdBaixada += Number(r["QTD BAIXADA"] ?? 0) || 0;
    acc.qtdFaltante += Number(r["QTD FALTA"] ?? 0) || 0;
    groups.set(key, acc);
  }

  // Ordena por código como o Excel tende a apresentar.
  return [...groups.values()].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
}

function infoFromRows(rows) {
  const r0 = rows?.[0] || {};
  const pep3 = pep3FromRow(r0);
  const info = {
    pep: pep3,
    nota: String(r0["NOTA"] ?? ""),
    odi: "",
    odm: "",
    ods: ""
  };

  // Na aba "CONSULTAR MATERIAIS", ODI/ODM/ODS representam o número da RESERVA
  // para cada tipo de PEP IV (.I/.M/.S) dentro do mesmo PEP III.
  for (const r of rows || []) {
    const pep4 = String(r["PEP IV"] ?? "").trim().toUpperCase();
    const suffix = pep4.match(/\.([A-Z0-9])$/)?.[1] || "";
    const reserva = String(r["RESERVA"] ?? "").trim();
    if (!reserva) continue;
    if (suffix === "I" && !info.odi) info.odi = reserva;
    if (suffix === "M" && !info.odm) info.odm = reserva;
    if (suffix === "S" && !info.ods) info.ods = reserva;
    if (info.odi && info.odm && info.ods) break;
  }

  return info;
}

app.get("/api/materiais", async (req, res) => {
  try {
    await ensureCache();
    const pep = norm(req.query.pep || "");
    if (!pep) {
      // fallback to existing demo json
      const raw = await readFile(join(__dirname, "data", "materiais.json"), "utf-8");
      const data = JSON.parse(raw);
      return res.json(data);
    }

    const pep3 = pep.replace(/\.[A-Z0-9]$/, "");
    const rows = cache.byPep3.get(pep3) || [];
    const info = infoFromRows(rows);

    // Default para bater com o Excel: se existir PEP IV ".I" (ODI), mostra ele.
    // Pode ser sobrescrito por ?iv=ODI|ODM|ODS
    const requestedIv = String(req.query.iv || "").trim().toUpperCase();
    const wantedSuffix = requestedIv === "ODM" ? "M" : requestedIv === "ODS" ? "S" : "I";

    const filtered = rows.filter((r) => {
      const pep4 = String(r["PEP IV"] ?? "").trim().toUpperCase();
      const suffix = pep4.match(/\.([A-Z0-9])$/)?.[1] || "";
      return suffix === wantedSuffix;
    });

    const grouped = agruparMateriais(filtered);
    const materiais = grouped.map((m, idx) =>
      materialFromRow(
        {
          "PEP IV": m.pep,
          "CÓDIGO": m.codigo,
          "DESCRIÇÃO": m.descricao,
          UMB: m.unidade,
          "QTD NECESSIDADE": m.qtdSolicitada,
          "QTD BAIXADA": m.qtdBaixada,
          "QTD FALTA": m.qtdFaltante,
          RESERVA: requestedIv === "ODM" ? info.odm : requestedIv === "ODS" ? info.ods : info.odi,
          ITEM: ""
        },
        idx
      )
    );
    res.json({ infoGeral: info, materiais });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || "Falha ao carregar materiais") });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, excelPath: EXCEL_PATH });
});

app.listen(PORT, () => {
  console.log(`API em http://localhost:${PORT}`);
});
