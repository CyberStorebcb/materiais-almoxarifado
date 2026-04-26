import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";

const DROPBOX_METADATA_URL = "https://api.dropboxapi.com/2/files/get_metadata";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DROPBOX_SHARED_META_URL = "https://api.dropboxapi.com/2/sharing/get_shared_link_metadata";
const DROPBOX_SHARED_FILE_URL = "https://content.dropboxapi.com/2/sharing/get_shared_link_file";

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

function parseCN52NFromBuffer(buf) {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
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

async function dropboxGetMetadata({ token, filePath }) {
  const r = await fetch(DROPBOX_METADATA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ path: filePath })
  });
  if (!r.ok) throw new Error(`Dropbox metadata falhou (${r.status})`);
  return await r.json();
}

async function dropboxDownload({ token, filePath }) {
  const r = await fetch(DROPBOX_DOWNLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path: filePath })
    }
  });
  if (!r.ok) throw new Error(`Dropbox download falhou (${r.status})`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

async function dropboxGetSharedLinkMetadata({ token, url }) {
  const r = await fetch(DROPBOX_SHARED_META_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });
  if (!r.ok) throw new Error(`Dropbox shared_link metadata falhou (${r.status})`);
  return await r.json();
}

async function dropboxDownloadSharedLink({ token, url }) {
  const r = await fetch(DROPBOX_SHARED_FILE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ url })
    }
  });
  if (!r.ok) throw new Error(`Dropbox shared_link download falhou (${r.status})`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

async function ensureDropboxCache({ token, filePath, ttlMs }) {
  const g = globalThis;
  if (!g.__dropboxExcelCache) {
    g.__dropboxExcelCache = {
      checkedAtMs: 0,
      rev: "",
      rows: [],
      byPep3: new Map()
    };
  }
  const cache = g.__dropboxExcelCache;
  const now = Date.now();

  // TTL para evitar bater no Dropbox em toda requisição
  if (cache.rows.length && now - cache.checkedAtMs < ttlMs) return cache;

  const meta = await dropboxGetMetadata({ token, filePath });
  const rev = String(meta?.rev || meta?.content_hash || "");

  // Se não mudou, só atualiza a data de checagem
  if (cache.rows.length && rev && cache.rev === rev) {
    cache.checkedAtMs = now;
    return cache;
  }

  const buf = await dropboxDownload({ token, filePath });
  const parsed = parseCN52NFromBuffer(buf);
  g.__dropboxExcelCache = {
    checkedAtMs: now,
    rev: rev || cache.rev,
    ...parsed
  };
  return g.__dropboxExcelCache;
}

async function ensureDropboxSharedLinkCache({ token, url, ttlMs }) {
  const g = globalThis;
  if (!g.__dropboxSharedExcelCache) {
    g.__dropboxSharedExcelCache = {
      checkedAtMs: 0,
      rev: "",
      rows: [],
      byPep3: new Map()
    };
  }
  const cache = g.__dropboxSharedExcelCache;
  const now = Date.now();

  if (cache.rows.length && now - cache.checkedAtMs < ttlMs) return cache;

  const meta = await dropboxGetSharedLinkMetadata({ token, url });
  const rev = String(meta?.rev || meta?.content_hash || meta?.server_modified || meta?.client_modified || "");

  if (cache.rows.length && rev && cache.rev === rev) {
    cache.checkedAtMs = now;
    return cache;
  }

  const buf = await dropboxDownloadSharedLink({ token, url });
  const parsed = parseCN52NFromBuffer(buf);
  g.__dropboxSharedExcelCache = {
    checkedAtMs: now,
    rev: rev || cache.rev,
    ...parsed
  };
  return g.__dropboxSharedExcelCache;
}

function toDirectDownloadUrl(url) {
  const u = new URL(url);
  // Dropbox shared link: ensure dl=1 for direct download.
  u.searchParams.set("dl", "1");
  return u.toString();
}

async function ensureDirectLinkCache({ url, ttlMs }) {
  const g = globalThis;
  if (!g.__directExcelCache) {
    g.__directExcelCache = {
      checkedAtMs: 0,
      etag: "",
      lastModified: "",
      rows: [],
      byPep3: new Map()
    };
  }
  const cache = g.__directExcelCache;
  const now = Date.now();
  if (cache.rows.length && now - cache.checkedAtMs < ttlMs) return cache;

  const directUrl = toDirectDownloadUrl(url);
  const r = await fetch(directUrl, { method: "GET", redirect: "follow" });
  if (!r.ok) throw new Error(`Download direto do Dropbox falhou (${r.status})`);

  const etag = r.headers.get("etag") || "";
  const lastModified = r.headers.get("last-modified") || "";

  // Se o servidor fornecer ETag/Last-Modified e não mudou, só renova o TTL.
  if (cache.rows.length && ((etag && etag === cache.etag) || (lastModified && lastModified === cache.lastModified))) {
    cache.checkedAtMs = now;
    return cache;
  }

  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);
  const parsed = parseCN52NFromBuffer(buf);
  g.__directExcelCache = {
    checkedAtMs: now,
    etag: etag || cache.etag,
    lastModified: lastModified || cache.lastModified,
    ...parsed
  };
  return g.__directExcelCache;
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

    const pep3 = pep.replace(/\.[A-Z0-9]$/, "");

    // Prefer Dropbox in production (Vercel)
    const dropboxToken = process.env.DROPBOX_ACCESS_TOKEN;
    const dropboxPath = process.env.DROPBOX_FILE_PATH;
    const dropboxSharedLink = process.env.DROPBOX_SHARED_LINK;
    const dropboxDirectLink = process.env.DROPBOX_SHARED_LINK_DIRECT;
    const ttlMs = Number(process.env.DROPBOX_TTL_MS || 60_000);

    let rows = [];
    if (dropboxDirectLink) {
      const cache = await ensureDirectLinkCache({ url: dropboxDirectLink, ttlMs });
      rows = cache.byPep3.get(pep3) || [];
    } else if (dropboxToken && dropboxSharedLink) {
      const cache = await ensureDropboxSharedLinkCache({ token: dropboxToken, url: dropboxSharedLink, ttlMs });
      rows = cache.byPep3.get(pep3) || [];
    } else if (dropboxToken && dropboxPath) {
      const cache = await ensureDropboxCache({ token: dropboxToken, filePath: dropboxPath, ttlMs });
      rows = cache.byPep3.get(pep3) || [];
    } else {
      // Fallback local para desenvolvimento
      const excelPath = process.env.EXCEL_PATH;
      if (!excelPath) {
        return res.status(200).json({ infoGeral: { pep }, materiais: [] });
      }
      const cache = await ensureCache(excelPath);
      rows = cache.byPep3.get(pep3) || [];
    }

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

