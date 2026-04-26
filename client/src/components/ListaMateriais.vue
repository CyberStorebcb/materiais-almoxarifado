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
      <section class="order" aria-label="Informações do pedido">
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
        </div>
      </section>

      <section v-if="registros.length" class="reg" aria-label="Registros">
        <div class="reg__header">
          <h3 class="reg__title">REGISTROS</h3>
          <button type="button" class="reg__clear" @click="limparRegistros">Limpar</button>
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in registros" :key="r.id">
                <td class="reg__pep">{{ r.pep }}</td>
                <td>{{ r.nota }}</td>
                <td>{{ r.odi }}</td>
                <td>{{ r.odm }}</td>
                <td>{{ r.ods }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <header class="list__header">
        <h3 class="list__title">MATERIAIS</h3>
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
const infoGeral = ref({
  pep: "",
  nota: "",
  odi: "",
  odm: "",
  ods: ""
});

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

.reg__title {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
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
}
</style>
