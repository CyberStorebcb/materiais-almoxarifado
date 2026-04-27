<template>
  <div class="list">
    <div v-if="loading" class="list__state" role="status" aria-live="polite">
      <div class="list__skeleton">
        <div class="sk sk--line" />
        <div class="sk sk--line" />
        <div class="sk sk--line" />
        <div class="sk sk--line" />
      </div>
      <span class="list__state-text">Carregando materiais…</span>
    </div>
    <div v-else-if="erro" class="list__state list__state--erro" role="status">{{ erro }}</div>
    <div v-else class="list__content">
      <section v-if="!somenteMateriais" class="order" aria-label="Informações do pedido">
        <div class="order__pep">
          <span class="order__pep-label">PEP</span>
          <input
            v-model="infoGeral.pep"
            class="order__pep-input"
            type="text"
            placeholder="MA-2601112UNR3.D.0012"
            autocomplete="off"
          />
        </div>

        <div class="order__grid" aria-label="Dados automáticos">
          <div class="order__field">
            <span class="order__label">NOTA</span>
            <div class="order__static">{{ infoGeral.nota || "" }}</div>
          </div>
          <div class="order__field">
            <span class="order__label">ODI</span>
            <div class="order__static">{{ infoGeral.odi || "" }}</div>
          </div>
          <div class="order__field">
            <span class="order__label">ODM</span>
            <div class="order__static">{{ infoGeral.odm || "" }}</div>
          </div>
          <div class="order__field">
            <span class="order__label">ODS</span>
            <div class="order__static">{{ infoGeral.ods || "" }}</div>
          </div>
        </div>

        <div class="order__actions">
          <button type="button" class="order__btn" :disabled="!String(infoGeral.pep || '').trim()" @click="registrar()">
            Registrar
          </button>
          <button
            type="button"
            class="order__btn order__btn--ghost"
            :disabled="!String(infoGeral.pep || '').trim() || !itens.length"
            @click="abrirAlterar()"
          >
            Alterar
          </button>
        </div>
      </section>

      <div v-if="alterarOpen" class="alt" role="dialog" aria-modal="true" aria-label="Alterar itens">
        <div class="alt__backdrop" @click="fecharAlterar()" />
        <div class="alt__panel">
          <div class="alt__header">
            <div class="alt__title">
              <h3>ALTERAR</h3>
              <div class="alt__meta">
                <span><strong>PEP:</strong> {{ String(infoGeral.pep || "").trim() }}</span>
                <span><strong>NOTA:</strong> {{ String(infoGeral.nota || "").trim() }}</span>
              </div>
            </div>
            <button type="button" class="alt__close" aria-label="Fechar" @click="fecharAlterar()">×</button>
          </div>

          <div class="alt__body">
            <div class="alt__form" aria-label="Dados da alteração">
              <label class="alt__field">
                <span class="alt__label">Motivo</span>
                <input v-model="alterarMotivo" class="alt__input" type="text" autocomplete="off" placeholder="Descreva o motivo da alteração" />
              </label>
              <label class="alt__field">
                <span class="alt__label">E-mail</span>
                <input
                  v-model="alterarEmail"
                  class="alt__input"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  placeholder="ex: nome@empresa.com"
                />
              </label>
            </div>

            <!-- Sugestões (baseadas nos materiais carregados deste PEP) -->
            <datalist id="alt-codigos">
              <option v-for="c in sugestCodigos" :key="c" :value="c" />
            </datalist>
            <datalist id="alt-desc">
              <option v-for="d in sugestDescricoes" :key="d" :value="d" />
            </datalist>

            <div class="alt__table-wrap" role="region" aria-label="Tabela de alteração">
              <table class="alt__table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descritivo</th>
                    <th class="alt__th-qtd">Quantidade</th>
                    <th class="alt__th-actions" aria-label="Ações"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in alterarRows" :key="r._id">
                    <td class="alt__td-cod">
                      <input
                        v-model="r.codigo"
                        class="alt__input alt__input--mono"
                        type="text"
                        autocomplete="off"
                        list="alt-codigos"
                        @input="syncLinhaPorCodigo(r)"
                        @blur="syncLinhaPorCodigo(r)"
                      />
                    </td>
                    <td>
                      <input
                        v-model="r.descritivo"
                        class="alt__input"
                        type="text"
                        autocomplete="off"
                        list="alt-desc"
                        @input="syncLinhaPorDescricao(r)"
                        @blur="syncLinhaPorDescricao(r)"
                      />
                    </td>
                    <td class="alt__td-qtd">
                      <input v-model="r.quantidade" class="alt__input alt__input--num" type="number" step="1" min="0" inputmode="numeric" />
                    </td>
                    <td class="alt__actions">
                      <button type="button" class="alt__delete" title="Remover linha" @click="removerAlterarRow(r._id)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6V4h8v2" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 6l-1 14H6L5 6" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11v6" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 11v6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="alt__tools">
              <button type="button" class="alt__tool" @click="adicionarAlterarRow()">Adicionar linha</button>
            </div>
          </div>

          <div class="alt__footer">
            <button type="button" class="alt__btn alt__btn--ghost" @click="fecharAlterar()">Cancelar</button>
            <button type="button" class="alt__btn alt__btn--ghost" @click="enviarAlteracaoOutlook()">Enviar e-mail</button>
            <button type="button" class="alt__btn" @click="salvarAlterar()">Salvar</button>
          </div>
        </div>
      </div>

      <section v-if="!somenteMateriais && registros.length" class="reg" aria-label="Registros">
        <div class="reg__header">
          <h3 class="reg__title">REGISTROS</h3>
          <div class="reg__tools">
            <button type="button" class="reg__tool" @click="copiarRegistrosEmail">Copiar</button>
            <button type="button" class="reg__tool" @click="enviarRegistrosOutlook">Enviar e-mail</button>
            <button type="button" class="reg__tool" @click="baixarRegistrosPdf">Baixar PDF</button>
            <button type="button" class="reg__clear" @click="limparRegistros">Limpar</button>
          </div>
        </div>
        <div class="reg__table-wrap" role="region" aria-label="Tabela de registros">
          <table class="reg__table">
            <thead>
              <tr>
                <th>PEP</th>
                <th>NOTA</th>
                <th>ODI</th>
                <th>ODM</th>
                <th>ODS</th>
                <th class="reg__th-actions" aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in registros" :key="r.id">
                <td class="reg__pep">{{ r.pep }}</td>
                <td>{{ r.nota }}</td>
                <td>{{ r.odi }}</td>
                <td>{{ r.odm }}</td>
                <td>{{ r.ods }}</td>
                <td class="reg__actions">
                  <button type="button" class="reg__delete" title="Apagar linha" @click="removerRegistro(r.id)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6V4h8v2" />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 6l-1 14H6L5 6"
                      />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11v6" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 11v6" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <header class="list__header">
        <div class="list__head-left">
          <h3 class="list__title">MATERIAIS</h3>
          <button
            type="button"
            class="list__head-eye"
            :aria-pressed="somenteMateriais ? 'true' : 'false'"
            :title="somenteMateriais ? 'Mostrar painel completo' : 'Mostrar somente a lista de materiais'"
            @click="somenteMateriais = !somenteMateriais"
          >
            <svg v-if="!somenteMateriais" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.58 10.58a2 2 0 002.83 2.83"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.88 5.09A10.2 10.2 0 0112 5c6 0 10 7 10 7a17.6 17.6 0 01-3.4 4.3M6.1 6.1A17.6 17.6 0 002 12s4 7 10 7a10.1 10.1 0 004.6-1.1"
              />
            </svg>
          </button>
        </div>
        <span class="list__meta">{{ itensFiltrados.length }} itens</span>
      </header>

      <div class="list__toolbar">
        <input v-model="q" class="list__search" type="search" placeholder="Buscar por código, descrição ou PEP" aria-label="Buscar materiais" />
      </div>

      <div class="list__table-wrap" role="region" aria-label="Tabela de materiais">
        <div v-if="itensFiltrados.length === 0" class="list__empty" role="status">
          Nenhum item encontrado para “{{ q.trim() }}”.
        </div>
        <table class="list__table">
          <thead>
            <tr>
              <th class="list__th-n">IV</th>
              <th>PEP</th>
              <th>
                <div class="list__th-cod">
                  <span>COD</span>
                  <button
                    type="button"
                    class="list__eye"
                    :aria-pressed="ocultarCodigos ? 'true' : 'false'"
                    :title="ocultarCodigos ? 'Exibir código completo' : 'Ocultar (mostrar só últimos 4)'"
                    @click="ocultarCodigos = !ocultarCodigos"
                  >
                    <svg v-if="!ocultarCodigos" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                      />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.58 10.58a2 2 0 002.83 2.83"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.88 5.09A10.2 10.2 0 0112 5c6 0 10 7 10 7a17.6 17.6 0 01-3.4 4.3M6.1 6.1A17.6 17.6 0 002 12s4 7 10 7a10.1 10.1 0 004.6-1.1"
                      />
                    </svg>
                  </button>
                </div>
              </th>
              <th>DESCRIÇÃO MATERIAL</th>
              <th>UMB</th>
              <th class="list__th-num">QTD SOL</th>
              <th class="list__th-num">QTD BAIX</th>
              <th class="list__th-num">QTD FALT</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, idx) in itensFiltrados" :key="m.id ?? idx">
              <td class="list__iv">
                <span
                  v-if="String(m.iv ?? '').trim()"
                  class="list__badge"
                  :data-iv="String(m.iv || '').toUpperCase()"
                >
                  {{ m.iv }}
                </span>
              </td>
              <td class="list__pep">{{ m.pep ?? "" }}</td>
              <td class="list__code">{{ formatarCodigo(m.codigo) }}</td>
              <td class="list__desc">{{ m.descricao ?? "" }}</td>
              <td class="list__umb">{{ m.unidade ?? "" }}</td>
              <td class="list__num">{{ formatarQtd(m.qtdSolicitada ?? m.quantidade ?? 0) }}</td>
              <td class="list__num">{{ formatarQtd(m.qtdBaixada ?? 0) }}</td>
              <td
                class="list__num"
                :class="faltVsSolClass(m.qtdSolicitada ?? m.quantidade ?? 0, m.qtdFaltante ?? 0)"
              >
                {{ formatarQtd(m.qtdFaltante ?? 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

const itens = ref([]);
const loading = ref(true);
const erro = ref("");
const q = ref("");
const ocultarCodigos = ref(false);
const REG_KEY = "materiais.registros.v1";
const registros = ref([]);
const somenteMateriais = ref(false);
const infoGeral = ref({
  pep: "",
  nota: "",
  odi: "",
  odm: "",
  ods: ""
});

const alterarOpen = ref(false);
const alterarRows = ref([]);
const alterarMotivo = ref("");
const alterarEmail = ref("");

const materiaisByCodigo = computed(() => {
  const map = new Map();
  for (const m of itens.value || []) {
    const codigo = String(m.codigo ?? "").trim();
    if (!codigo || map.has(codigo)) continue;
    map.set(codigo, {
      codigo,
      descricao: String(m.descricao ?? "").trim()
    });
  }
  return map;
});

const materiaisByDescricao = computed(() => {
  const map = new Map();
  for (const m of itens.value || []) {
    const desc = String(m.descricao ?? "").trim();
    if (!desc || map.has(desc)) continue;
    map.set(desc, {
      codigo: String(m.codigo ?? "").trim(),
      descricao: desc
    });
  }
  return map;
});

const sugestCodigos = computed(() => Array.from(materiaisByCodigo.value.keys()).sort());
const sugestDescricoes = computed(() => Array.from(materiaisByDescricao.value.keys()).sort());

function formatarQtd(n) {
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

function formatarCodigo(codigo) {
  const s = String(codigo ?? "").trim();
  if (!s) return "";
  if (!ocultarCodigos.value) return s;
  return s.slice(-4);
}

function faltVsSolClass(sol, falt) {
  const s = Number(sol) || 0;
  const f = Number(falt) || 0;
  if (f > s) return "list__num--bad";
  if (f < s) return "list__num--ok";
  return "list__num--warn";
}

async function carregarMateriaisPorPep(pep) {
  const p = String(pep || "").trim();
  if (!p) return;
  erro.value = "";
  loading.value = true;
  try {
    const r = await fetch(`/api/materiais?pep=${encodeURIComponent(p)}`);
    if (!r.ok) throw new Error("Resposta inválida");
    const data = await r.json();
    if (Array.isArray(data)) {
      itens.value = data;
      return;
    }
    infoGeral.value = { ...infoGeral.value, ...(data.infoGeral || {}) };
    itens.value = data.materiais || [];
  } catch {
    erro.value = "Não foi possível consultar materiais para este PEP.";
  } finally {
    loading.value = false;
  }
}

function abrirAlterar() {
  alterarMotivo.value = "";
  alterarEmail.value = "";
  // Abre em branco (usuário preenche)
  alterarRows.value = Array.from({ length: 8 }).map((_, idx) => ({
    _id: `${Date.now()}-${idx}-${Math.random().toString(16).slice(2)}`,
    codigo: "",
    descritivo: "",
    quantidade: 0
  }));
  alterarOpen.value = true;
}

function fecharAlterar() {
  alterarOpen.value = false;
}

function syncLinhaPorCodigo(row) {
  const codigo = String(row?.codigo ?? "").trim();
  if (!codigo) return;
  const m = materiaisByCodigo.value.get(codigo);
  if (!m) return;
  if (!String(row.descritivo ?? "").trim()) row.descritivo = m.descricao || "";
}

function syncLinhaPorDescricao(row) {
  const desc = String(row?.descritivo ?? "").trim();
  if (!desc) return;
  const m = materiaisByDescricao.value.get(desc);
  if (!m) return;
  if (!String(row.codigo ?? "").trim() && m.codigo) row.codigo = m.codigo;
}

function adicionarAlterarRow() {
  alterarRows.value = [
    ...alterarRows.value,
    {
      _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      codigo: "",
      descritivo: "",
      quantidade: 0
    }
  ];
}

function removerAlterarRow(id) {
  alterarRows.value = alterarRows.value.filter((r) => r._id !== id);
}

function salvarAlterar() {
  const pep = String(infoGeral.value.pep || "").trim();
  const novos = [];
  const vistos = new Set();
  for (const r of alterarRows.value) {
    const codigo = String(r.codigo ?? "").trim();
    const descritivo = String(r.descritivo ?? "").trim();
    const qtd = Math.max(0, Number(r.quantidade) || 0);
    if (!codigo && !descritivo && !qtd) continue;
    const key = codigo || `${descritivo}-${novos.length}`;
    if (codigo && vistos.has(codigo)) continue;
    if (codigo) vistos.add(codigo);
    novos.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      pep,
      codigo,
      descricao: descritivo,
      unidade: "",
      qtdSolicitada: qtd,
      qtdBaixada: 0,
      qtdFaltante: 0
    });
  }

  // Atualiza a lista exibida com o que foi preenchido
  itens.value = novos;
  fecharAlterar();
}

function registrar() {
  const pep = String(infoGeral.value.pep || "").trim();
  if (!pep) return;
  const row = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    pep,
    nota: String(infoGeral.value.nota || "").trim(),
    odi: String(infoGeral.value.odi || "").trim(),
    odm: String(infoGeral.value.odm || "").trim(),
    ods: String(infoGeral.value.ods || "").trim()
  };
  registros.value = [row, ...registros.value];
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(registros.value));
  } catch {
    /* ignore */
  }
}

function limparRegistros() {
  registros.value = [];
  try {
    localStorage.removeItem(REG_KEY);
  } catch {
    /* ignore */
  }
}

function removerRegistro(id) {
  registros.value = registros.value.filter((r) => r.id !== id);
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(registros.value));
  } catch {
    /* ignore */
  }
}

function registrosToTsv() {
  const head = ["PEP", "NOTA", "ODI", "ODM", "ODS"].join("\t");
  const lines = registros.value.map((r) => [r.pep, r.nota, r.odi, r.odm, r.ods].join("\t"));
  return [head, ...lines].join("\n");
}

function registrosToEmailBody() {
  // Outlook costuma renderizar melhor com CRLF
  return registrosToTsv().replaceAll("\n", "\r\n");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registrosToHtmlTable() {
  const head = ["PEP", "NOTA", "ODI", "ODM", "ODS"];
  const rows = registros.value.map((r) => [r.pep, r.nota, r.odi, r.odm, r.ods]);

  const th = head
    .map(
      (h) =>
        `<th style="background:#1e293b;color:#ffffff;padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:700;font-size:12px;">${escapeHtml(h)}</th>`
    )
    .join("");

  const trs = rows
    .map((row, idx) => {
      const bg = idx % 2 ? "#f8fafc" : "#ffffff";
      const tds = row
        .map(
          (c, colIdx) =>
            `<td style="background:${bg};padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-size:12px;${colIdx === 0 ? "font-weight:700;" : ""}">${escapeHtml(
              c
            )}</td>`
        )
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  return `
<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #cbd5e1;width:100%;max-width:980px;">
  <thead><tr>${th}</tr></thead>
  <tbody>${trs}</tbody>
</table>`.trim();
}

function buildEmailMeta() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const pep = String(infoGeral.value.pep || "").trim();
  const subject = "BAIXAR OBRAS";

  // Extra: se tiver 1 registro, usar o PEP dele também (caso o usuário tenha limpado o campo).
  const firstPep = String(registros.value?.[0]?.pep || "").trim();
  const effectivePep = pep || firstPep;

  const introLines = [
    "Segue tabela para baixa de obras.",
    effectivePep ? `PEP: ${effectivePep}` : "",
    "",
    "(PDF gerado no clique — anexar o arquivo baixado.)",
    "",
  ].filter(Boolean);
  const body = `${introLines.join("\r\n")}${registrosToEmailBody() ? "\r\n" : ""}${registrosToEmailBody()}`;
  return { subject, body };
}

function downloadBlob(blob, filename, opts = {}) {
  const url = URL.createObjectURL(blob);
  const revokeAfterMs = Number(opts?.revokeAfterMs ?? 30_000);

  // Download
  const dlA = document.createElement("a");
  dlA.href = url;
  dlA.download = filename;
  document.body.appendChild(dlA);
  dlA.click();
  document.body.removeChild(dlA);

  setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
}

async function blobToBase64Lines(blob, lineLen = 76) {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const b64 = btoa(binary);
  const lines = [];
  for (let i = 0; i < b64.length; i += lineLen) lines.push(b64.slice(i, i + lineLen));
  return lines.join("\r\n");
}

function buildEml({ subject, htmlBody, attachmentBase64, attachmentFilename }) {
  const boundary = `----=_materiais_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  const to = String(arguments?.[0]?.to || "").trim();
  const headers = [
    to ? `To: ${to}` : "",
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    htmlBody,
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="${attachmentFilename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${attachmentFilename}"`,
    "",
    attachmentBase64,
    "",
    `--${boundary}--`,
    ""
  ].filter(Boolean);
  return headers.join("\r\n");
}

function alterarToHtmlTable(rows) {
  const head = ["CÓDIGO", "DESCRITIVO", "QUANTIDADE"];
  const th = head
    .map(
      (h) =>
        `<th style="background:#1e293b;color:#ffffff;padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:700;font-size:12px;">${escapeHtml(h)}</th>`
    )
    .join("");

  const trs = rows
    .map((row, idx) => {
      const bg = idx % 2 ? "#f8fafc" : "#ffffff";
      const tds = [
        `<td style="background:${bg};padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-size:12px;font-weight:700;">${escapeHtml(
          row.codigo
        )}</td>`,
        `<td style="background:${bg};padding:8px 10px;border:1px solid #cbd5e1;text-align:left;font-size:12px;">${escapeHtml(
          row.descritivo
        )}</td>`,
        `<td style="background:${bg};padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-size:12px;">${escapeHtml(
          row.quantidade
        )}</td>`
      ].join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  return `
<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #cbd5e1;width:100%;max-width:980px;">
  <thead><tr>${th}</tr></thead>
  <tbody>${trs}</tbody>
</table>`.trim();
}

async function gerarAlteracaoPdfBlob(rows) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableMod.default || autoTableMod;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const pep = String(infoGeral.value.pep || "").trim();
  const nota = String(infoGeral.value.nota || "").trim();
  const motivo = String(alterarMotivo.value || "").trim();

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.text("Alteração de Materiais", pageW / 2, 44, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`${dateStr} ${timeStr}`, pageW - marginX, 44, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  const metaY = 66;
  doc.text(`PEP: ${pep}`, marginX, metaY);
  doc.text(`NOTA: ${nota}`, marginX + 260, metaY);
  if (motivo) doc.text(`MOTIVO: ${motivo}`, marginX, metaY + 16);

  autoTable(doc, {
    head: [["CÓDIGO", "DESCRITIVO", "QUANTIDADE"]],
    body: rows.map((r) => [r.codigo, r.descritivo, String(r.quantidade)]),
    startY: motivo ? metaY + 32 : metaY + 22,
    margin: { left: marginX, right: marginX },
    tableWidth: "auto",
    styles: {
      fontSize: 10.5,
      cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
      textColor: [17, 24, 39],
      lineColor: [226, 232, 240],
      lineWidth: 0.6,
      valign: "middle",
      halign: "center"
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      lineColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 180, fontStyle: "bold" },
      1: { cellWidth: 520, halign: "left" },
      2: { cellWidth: 120, halign: "center" }
    }
  });

  const filename = `alteracao-${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}

async function enviarAlteracaoOutlook() {
  const to = String(alterarEmail.value || "").trim();
  const pep = String(infoGeral.value.pep || "").trim();
  const nota = String(infoGeral.value.nota || "").trim();
  const motivo = String(alterarMotivo.value || "").trim();

  const rows = alterarRows.value
    .map((r) => ({
      codigo: String(r.codigo ?? "").trim(),
      descritivo: String(r.descritivo ?? "").trim(),
      quantidade: Math.max(0, Number(r.quantidade) || 0)
    }))
    .filter((r) => r.codigo || r.descritivo || r.quantidade);

  const subject = "BAIXAR OBRAS";
  const { blob: pdfBlob, filename: pdfName } = await gerarAlteracaoPdfBlob(rows);

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const html = `
<div style="font-family:Segoe UI,Arial,sans-serif;font-size:13px;color:#0f172a;">
  <p style="margin:0 0 10px 0;"><strong>Alteração de materiais</strong></p>
  <p style="margin:0 0 6px 0;color:#334155;font-size:12px;"><strong>PEP:</strong> ${escapeHtml(pep)} &nbsp;&nbsp; <strong>NOTA:</strong> ${escapeHtml(
    nota
  )}</p>
  ${motivo ? `<p style="margin:0 0 12px 0;color:#334155;font-size:12px;"><strong>MOTIVO:</strong> ${escapeHtml(motivo)}</p>` : ""}
  <p style="margin:0 0 14px 0;color:#475569;font-size:12px;">Gerado em ${escapeHtml(dateStr)} ${escapeHtml(timeStr)}.</p>
  ${alterarToHtmlTable(rows)}
  <p style="margin:14px 0 0 0;color:#475569;font-size:12px;">PDF anexado: ${escapeHtml(pdfName)}</p>
</div>`.trim();

  const pdfB64Lines = await blobToBase64Lines(pdfBlob);
  const emlText = buildEml({
    to,
    subject,
    htmlBody: html,
    attachmentBase64: pdfB64Lines,
    attachmentFilename: pdfName
  });

  const emlBlob = new Blob([emlText], { type: "message/rfc822" });
  const emlFilename = `BAIXAR-OBRAS-ALTERACAO-${new Date().toISOString().slice(0, 10)}.eml`;
  downloadBlob(emlBlob, emlFilename, { revokeAfterMs: 60_000 });
}

async function gerarRegistrosPdfBlob() {
  const rows = registros.value.map((r) => [r.pep, r.nota, r.odi, r.odm, r.ods]);

  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableMod.default || autoTableMod;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.text("Registros de Materiais", pageW / 2, 44, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`${dateStr} ${timeStr}`, pageW - marginX, 44, { align: "right" });

  autoTable(doc, {
    head: [["PEP", "NOTA", "ODI", "ODM", "ODS"]],
    body: rows,
    startY: 66,
    margin: { left: marginX, right: marginX },
    tableWidth: "auto",
    styles: {
      fontSize: 10.5,
      cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
      textColor: [17, 24, 39],
      lineColor: [226, 232, 240],
      lineWidth: 0.6,
      valign: "middle",
      halign: "center"
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      lineColor: [30, 41, 59]
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 320, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 120, halign: "center" },
      2: { cellWidth: 120, halign: "center" },
      3: { cellWidth: 120, halign: "center" },
      4: { cellWidth: 120, halign: "center" }
    },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Total de linhas: ${rows.length}`, marginX, pageH - 24);
    }
  });

  const filename = `registros-${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}

async function enviarRegistrosOutlook() {
  // OBS: deeplink do Outlook preenche body como texto puro (não vira tabela).
  // Para ter tabela formatada + PDF anexado, geramos um .eml (Outlook abre pronto).
  const { subject } = buildEmailMeta();
  const { blob: pdfBlob, filename: pdfName } = await gerarRegistrosPdfBlob();

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const html = `
<div style="font-family:Segoe UI,Arial,sans-serif;font-size:13px;color:#0f172a;">
  <p style="margin:0 0 10px 0;">Segue tabela para baixa de obras.</p>
  <p style="margin:0 0 14px 0;color:#475569;font-size:12px;">Gerado em ${escapeHtml(dateStr)} ${escapeHtml(timeStr)}.</p>
  ${registrosToHtmlTable()}
  <p style="margin:14px 0 0 0;color:#475569;font-size:12px;">PDF anexado: ${escapeHtml(pdfName)}</p>
</div>`.trim();

  const pdfB64Lines = await blobToBase64Lines(pdfBlob);
  const emlText = buildEml({
    subject,
    htmlBody: html,
    attachmentBase64: pdfB64Lines,
    attachmentFilename: pdfName
  });

  const emlBlob = new Blob([emlText], { type: "message/rfc822" });
  const emlFilename = `BAIXAR-OBRAS-${new Date().toISOString().slice(0, 10)}.eml`;

  // Apenas baixa o .eml (o usuário abre pelo gerenciador de downloads/Outlook)
  downloadBlob(emlBlob, emlFilename, { revokeAfterMs: 60_000 });
}

async function copiarRegistrosEmail() {
  const text = registrosToTsv();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback para ambientes sem clipboard permissions.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.setAttribute("readonly", "true");
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

async function baixarRegistrosPdf() {
  const { blob, filename } = await gerarRegistrosPdfBlob();
  downloadBlob(blob, filename);
}

const itensFiltrados = computed(() => {
  const query = q.value.trim().toLowerCase();
  const pep = String(infoGeral.value.pep || "").trim().toLowerCase();

  return itens.value.filter((m) => {
    const cod = String(m.codigo || "").toLowerCase();
    const desc = String(m.descricao || "").toLowerCase();
    const mPep = String(m.pep || "").toLowerCase();

    const matchQuery = !query || cod.includes(query) || desc.includes(query) || mPep.includes(query);
    const matchPep = !pep || mPep.includes(pep);
    return matchQuery && matchPep;
  });
});

onMounted(async () => {
  // Não carregar dados de demonstração automaticamente.
  // A lista deve ser preenchida apenas após digitar um PEP válido.
  try {
    const raw = localStorage.getItem(REG_KEY);
    if (raw) registros.value = JSON.parse(raw);
  } catch {
    registros.value = [];
  }
  loading.value = false;
});

let pepTimer = null;
watch(
  () => infoGeral.value.pep,
  (v) => {
    if (pepTimer) clearTimeout(pepTimer);
    pepTimer = setTimeout(() => carregarMateriaisPorPep(v), 450);
  }
);
</script>

<style scoped>
.list {
  min-height: 200px;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list__state {
  padding: 1.25rem 0.75rem;
  color: var(--muted);
  text-align: center;
  font-size: 0.9rem;
  display: grid;
  gap: 0.65rem;
  place-items: center;
}

.list__state--erro {
  color: #ff8a80;
}

.list__state-text {
  font-size: 0.85rem;
}

.list__skeleton {
  width: min(520px, 100%);
  display: grid;
  gap: 0.5rem;
}

.sk {
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.10) 30%,
    rgba(255, 255, 255, 0.06) 60%
  );
  background-size: 200% 100%;
  animation: sk 1.2s var(--ease-in-out, ease-in-out) infinite;
}

.sk--line:nth-child(2) { width: 92%; }
.sk--line:nth-child(3) { width: 86%; }
.sk--line:nth-child(4) { width: 78%; }

@keyframes sk {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}

.list__content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.list__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.list__head-left {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.list__head-eye {
  width: 30px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--btn-border);
  background: rgba(71, 85, 105, 0.16);
  color: var(--btn-text);
  cursor: pointer;
  transition: background 160ms var(--ease-out, ease), transform 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
  padding: 0;
  flex: 0 0 auto;
}

.list__head-eye:hover {
  background: rgba(71, 85, 105, 0.28);
}

.list__head-eye:active {
  transform: translateY(1px);
}

.list__head-eye:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ring-soft);
}

.list__head-eye svg {
  width: 14px;
  height: 14px;
}

.list__title {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.list__toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.order {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.order__pep {
  display: grid;
  gap: 0.5rem;
  padding-bottom: 0.9rem;
  margin-bottom: 0.9rem;
  border-bottom: 1px solid rgba(42, 53, 68, 0.65);
}

.order__pep-label {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.order__pep-input {
  width: 100%;
  min-width: 0;
  padding: 0.8rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 1rem;
  transition: border-color 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
}

.order__pep-input::placeholder {
  color: rgba(139, 154, 173, 0.55);
}

.order__pep-input:focus-visible {
  border-color: rgba(96, 165, 250, 0.75);
  box-shadow: 0 0 0 4px var(--ring-soft);
  outline: none;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
}

.order__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.order__btn {
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 160ms var(--ease-out, ease), transform 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
}

.order__btn:hover {
  background: var(--btn-bg-hover);
}

.order__btn:active {
  transform: translateY(1px);
}

.order__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.order__btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ring-soft);
}

.order__btn--ghost {
  background: rgba(71, 85, 105, 0.12);
}

.alt {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.alt__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.70);
}

.alt__panel {
  position: relative;
  width: min(980px, 100%);
  max-height: min(86vh, 860px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.96);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.alt__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.20);
}

.alt__title h3 {
  margin: 0;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-size: 0.95rem;
  font-weight: 800;
  color: rgba(226, 232, 240, 0.95);
}

.alt__meta {
  margin-top: 0.35rem;
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
  color: rgba(148, 163, 184, 0.95);
  font-size: 0.82rem;
}

.alt__meta strong {
  color: rgba(226, 232, 240, 0.92);
  font-weight: 700;
}

.alt__close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(71, 85, 105, 0.20);
  color: rgba(226, 232, 240, 0.9);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  display: inline-grid;
  place-items: center;
}

.alt__close:hover {
  background: rgba(71, 85, 105, 0.28);
}

.alt__body {
  padding: 0.9rem 1rem;
  min-height: 0;
  display: grid;
  gap: 0.75rem;
}

.alt__form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.alt__field {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.alt__label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.95);
}

.alt__table-wrap {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  background: rgba(2, 6, 23, 0.35);
}

.alt__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.alt__table th,
.alt__table td {
  padding: 0.55rem 0.65rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  text-align: left;
  white-space: nowrap;
}

.alt__table th {
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.98);
  color: rgba(148, 163, 184, 0.95);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  z-index: 1;
}

.alt__th-qtd,
.alt__td-qtd {
  text-align: right;
  width: 150px;
}

.alt__th-actions {
  width: 52px;
}

.alt__td-cod {
  width: 220px;
}

.alt__input {
  width: 100%;
  min-width: 0;
  padding: 0.48rem 0.55rem;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.30);
  color: rgba(226, 232, 240, 0.92);
  outline: none;
}

.alt__input:focus-visible {
  border-color: rgba(96, 165, 250, 0.75);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25);
}

.alt__input--mono {
  font-family: ui-monospace, monospace;
}

.alt__input--num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.alt__actions {
  text-align: right;
}

.alt__delete {
  width: 34px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 133, 0.35);
  background: rgba(248, 113, 133, 0.10);
  color: rgba(248, 113, 133, 0.95);
  cursor: pointer;
  padding: 0;
}

.alt__delete:hover {
  background: rgba(248, 113, 133, 0.18);
}

.alt__delete svg {
  width: 14px;
  height: 14px;
}

.alt__tools {
  display: flex;
  justify-content: flex-start;
}

.alt__tool {
  padding: 0.38rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(71, 85, 105, 0.18);
  color: rgba(226, 232, 240, 0.9);
  cursor: pointer;
  font-size: 0.82rem;
}

.alt__tool:hover {
  background: rgba(71, 85, 105, 0.26);
}

.alt__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.20);
}

.alt__btn {
  padding: 0.5rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(96, 165, 250, 0.18);
  color: rgba(226, 232, 240, 0.95);
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 650;
}

.alt__btn:hover {
  background: rgba(96, 165, 250, 0.24);
}

.alt__btn--ghost {
  background: rgba(71, 85, 105, 0.18);
}

.alt__btn--ghost:hover {
  background: rgba(71, 85, 105, 0.26);
}

.reg {
  margin-top: 0.25rem;
  padding: 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.reg__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.reg__tools {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: end;
}

.reg__title {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.reg__tool {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--btn-border);
  background: rgba(71, 85, 105, 0.12);
  color: var(--btn-text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 160ms var(--ease-out, ease), transform 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
}

.reg__tool:hover {
  background: rgba(71, 85, 105, 0.24);
}

.reg__tool:active {
  transform: translateY(1px);
}

.reg__tool:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ring-soft);
}

.reg__clear {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--btn-border);
  background: rgba(71, 85, 105, 0.12);
  color: var(--btn-text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 160ms var(--ease-out, ease), transform 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
}

.reg__clear:hover {
  background: rgba(71, 85, 105, 0.24);
}

.reg__clear:active {
  transform: translateY(1px);
}

.reg__clear:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ring-soft);
}

.reg__table-wrap {
  overflow: auto;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.reg__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.reg__table th,
.reg__table td {
  padding: 0.55rem 0.7rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}

.reg__th-actions {
  width: 44px;
}

.reg__actions {
  text-align: right;
}

.reg__delete {
  width: 30px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--btn-border);
  background: rgba(248, 113, 133, 0.10);
  color: rgba(248, 113, 133, 0.95);
  cursor: pointer;
  padding: 0;
  transition: background 160ms var(--ease-out, ease), transform 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
}

.reg__delete:hover {
  background: rgba(248, 113, 133, 0.18);
}

.reg__delete:active {
  transform: translateY(1px);
}

.reg__delete:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ring-soft);
}

.reg__delete svg {
  width: 14px;
  height: 14px;
}

.reg__table th {
  position: sticky;
  top: 0;
  background: var(--surface-2);
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  z-index: 1;
}

.reg__table tr:last-child td {
  border-bottom: none;
}

.reg__pep {
  font-family: ui-monospace, monospace;
}

.order__field {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.order__label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.order__input,
.order__static {
  width: 100%;
  min-width: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
}

.order__static {
  display: flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
  user-select: text;
  opacity: 0.95;
}

.list__search {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  transition: border-color 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
}

.list__search:focus-visible {
  border-color: rgba(61, 139, 253, 0.65);
  box-shadow: 0 0 0 4px var(--ring-soft);
  outline: none;
}

.list__search::placeholder {
  color: rgba(139, 154, 173, 0.75);
}

.list__meta {
  color: var(--muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

.list__table-wrap {
  overflow-y: auto;
  overflow-x: auto;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 8px;
  border: 1px solid var(--border);
  position: relative;
  scrollbar-gutter: stable;
}

.list__empty {
  position: sticky;
  top: 0;
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  font-size: 0.85rem;
  z-index: 2;
}

.list__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.list__table th,
.list__table td {
  padding: 0.6rem 0.7rem;
  text-align: center;
  border-bottom: 1px solid var(--border);
}

.list__table th {
  position: sticky;
  top: 0;
  background: var(--surface-2);
  color: var(--muted);
  font-weight: 600;
  z-index: 1;
  white-space: nowrap;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.list__th-cod {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.list__eye {
  width: 26px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--btn-border);
  background: rgba(71, 85, 105, 0.16);
  color: var(--btn-text);
  cursor: pointer;
  transition: background 160ms var(--ease-out, ease), transform 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
  padding: 0;
  flex: 0 0 auto;
}

.list__eye:hover {
  background: rgba(71, 85, 105, 0.28);
}

.list__eye:active {
  transform: translateY(1px);
}

.list__eye:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ring-soft);
}

.list__eye svg {
  width: 14px;
  height: 14px;
}

.list__table tbody tr {
  transition: background 140ms var(--ease-out, ease);
}

.list__table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}

.list__table tr:last-child td {
  border-bottom: none;
}

.list__code {
  font-family: ui-monospace, monospace;
  color: var(--accent);
  white-space: nowrap;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.list__iv {
  width: 2.5rem;
  font-variant-numeric: tabular-nums;
}

.list__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(71, 85, 105, 0.22); /* slate-600/alpha */
  color: rgba(226, 232, 240, 0.9);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.list__badge[data-iv="ODI"] { background: rgba(96, 165, 250, 0.16); border-color: rgba(96, 165, 250, 0.35); }
.list__badge[data-iv="ODM"] { background: rgba(167, 139, 250, 0.16); border-color: rgba(167, 139, 250, 0.35); }
.list__badge[data-iv="ODS"] { background: rgba(52, 211, 153, 0.14); border-color: rgba(52, 211, 153, 0.30); }

.list__pep {
  color: rgba(139, 154, 173, 0.92);
  white-space: nowrap;
}

.list__desc {
  min-width: 260px;
}

.list__umb {
  color: rgba(139, 154, 173, 0.92);
  white-space: nowrap;
}

.list__num {
  text-align: center;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.list__num--ok {
  color: rgba(52, 211, 153, 0.9);
}

.list__num--warn {
  color: rgba(251, 191, 36, 0.95);
}

.list__num--bad {
  color: rgba(251, 113, 133, 0.95);
}

.list__th-n { width: 2.5rem; }
.list__th-num { text-align: center; }

@media (max-width: 640px) {
  .list__table { font-size: 0.85rem; }
  .list__table th, .list__table td { padding: 0.55rem 0.55rem; }
  .order { padding: 0.85rem; }
  .order__grid { grid-template-columns: 1fr 1fr; }
  .list__desc { min-width: 220px; }
  .alt { padding: 0.75rem; }
  .alt__form { grid-template-columns: 1fr; }
}
</style>
