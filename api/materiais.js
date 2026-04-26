import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";

function norm(s) {
  return String(s || "").trim().toUpperCase();
}

function pep3FromRow(r) {
  const pep3 = r["PEP III"];
  if (pep3) return norm(pep3);
  const pep4 = r["PEP IV"];
  const p = norm(pep4);
  if (!p) return "";
  return p.replace(/\.[A-Z0-9]$/, "");
}

function parseCN52N(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets["CN52N"];
  if (!sheet) throw new Error("Aba CN52N não encontrada na planilha.");
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const byPep3 = new Map();
  for (const r of json) {
    const pep3 = pep3FromRow(r);
    if (!pep3) continue;
    if (!byPep3.has(pep3)) byPep3.set(pep3, []);
    byPep3.get(pep3).push(r);
  }
  return { rows: json, byPep3 };
}

function agruparMateriais(rows) {
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

function materialFromAggregated(m, idx) {
  const pep4 = String(m.pep ?? "").trim();
  const suffix = pep4.toUpperCase().match(/\.([A-Z0-9])$/)?.[1] || "";
  const ivLabel = suffix === "I" ? "ODI" : suffix === "M" ? "ODM" : suffix === "S" ? "ODS" : "";
  return {
    id: idx + 1,
    iv: ivLabel,
    pep: pep4,
    codigo: m.codigo ?? "",
    descricao: m.descricao ?? "",
    unidade: m.unidade ?? "",
    qtdSolicitada: Number(m.qtdSolicitada ?? 0) || 0,
    qtdBaixada: Number(m.qtdBaixada ?? 0) || 0,
    qtdFaltante: Number(m.qtdFaltante ?? 0) || 0
  };
}

async function ensureCache(excelPath) {
  const g = globalThis;
  if (!g.__materiaisCache) {
    g.__materiaisCache = { excelMtimeMs: 0, byPep3: new Map(), rows: [] };
  }
  const cache = g.__materiaisCache;
  const st = await stat(excelPath);
  const mtimeMs = st.mtimeMs || 0;
  if (cache.rows.length && cache.excelMtimeMs === mtimeMs) return cache;
  const parsed = parseCN52N(excelPath);
  g.__materiaisCache = { excelMtimeMs: mtimeMs, ...parsed };
  return g.__materiaisCache;
}

export default async function handler(req, res) {
  try {
    const pep = norm(req.query?.pep || "");
    if (!pep) {
      const raw = await readFile(path.join(process.cwd(), "server", "data", "materiais.json"), "utf-8");
      return res.status(200).json(JSON.parse(raw));
    }

    const requestedIv = String(req.query?.iv || "").trim().toUpperCase();
    const wantedSuffix = requestedIv === "ODM" ? "M" : requestedIv === "ODS" ? "S" : "I";

    const excelPath = process.env.EXCEL_PATH;
    if (!excelPath) {
      // On Vercel we can't rely on local user downloads; require explicit EXCEL_PATH.
      return res.status(200).json({ infoGeral: { pep }, materiais: [] });
    }

    const pep3 = pep.replace(/\.[A-Z0-9]$/, "");
    const cache = await ensureCache(excelPath);
    const rows = cache.byPep3.get(pep3) || [];
    const info = infoFromRows(rows);

    const filtered = rows.filter((r) => {
      const pep4 = String(r["PEP IV"] ?? "").trim().toUpperCase();
      const suffix = pep4.match(/\.([A-Z0-9])$/)?.[1] || "";
      return suffix === wantedSuffix;
    });

    const grouped = agruparMateriais(filtered);
    const materiais = grouped.map(materialFromAggregated);
    return res.status(200).json({ infoGeral: info, materiais });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || "Falha ao carregar materiais") });
  }
}

