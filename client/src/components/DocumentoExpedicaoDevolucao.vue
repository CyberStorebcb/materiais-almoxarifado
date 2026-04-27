<template>
  <div class="doc" :class="{ 'doc--blank': isBlank }">
    <header class="doc__top">
      <div class="doc__brand">
        <div class="doc__logos" aria-label="Logos">
          <div class="doc__logo">
            <img class="doc__logo-img doc__logo-img--eq" src="/templates/logo-equatorial.png" alt="Equatorial Energia" />
          </div>
          <div class="doc__logo">
            <img class="doc__logo-img doc__logo-img--cgb" src="/templates/logo-cgb.png" alt="CGB" />
          </div>
        </div>
      </div>

      <div class="doc__title">
        <div class="doc__title-line">Anexo I Controle expedição e devolução de materiais</div>
        <div class="doc__title-sub">CENTRO DISTRIBUIÇÃO / ALMOXARIFADO / DEPÓSITO TÉCNICO</div>
      </div>
    </header>

    <section class="doc__meta" aria-label="Dados do documento">
      <div class="meta">
        <div class="meta__head meta__cell"></div>
        <div class="meta__head meta__cell"></div>
        <div class="meta__head meta__cell meta__obs-head">OBSERVAÇÃO</div>

        <label class="meta__cell meta__a">
            <span class="meta__l">Contratada (Operador logístico / executora serviço de obra):</span>
            <input v-model="meta.contratada" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__b">
            <span class="meta__l">Data procesamento da reserva:</span>
            <input v-model="meta.dataProcReserva" class="meta__i" type="date" />
        </label>
        <div class="meta__cell meta__obs">
          <textarea v-model="meta.observacao" class="meta__ta" rows="9"></textarea>
        </div>

        <label class="meta__cell meta__c">
            <span class="meta__l">Município:</span>
            <input v-model="meta.municipio" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__d">
            <span class="meta__l">Horário procesamento da reserva:</span>
            <input v-model="meta.horaProcReserva" class="meta__i" type="time" />
        </label>

        <label class="meta__cell meta__e">
            <span class="meta__l">Localidade aplicação dos materiais:</span>
            <input v-model="meta.localidadeAplicacao" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__f">
            <span class="meta__l">Data planejada para saque dos materiais:</span>
            <input v-model="meta.dataPlanejadaSaque" class="meta__i" type="date" />
        </label>

        <label class="meta__cell meta__g">
            <span class="meta__l">Área / setor:</span>
            <input v-model="meta.areaSetor" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__h">
            <span class="meta__l">Horário planejado para saque dos materiais:</span>
            <input v-model="meta.horaPlanejadaSaque" class="meta__i" type="time" />
        </label>

        <label class="meta__cell meta__i">
            <span class="meta__l">Depósito (viatura ou eletricista) / equipe de campo:</span>
            <input v-model="meta.depositoEquipe" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__j">
            <span class="meta__l">Placa do veículo:</span>
            <input v-model="meta.placaVeiculo" class="meta__i" type="text" />
        </label>

        <label class="meta__cell meta__k">
            <span class="meta__l">Requisição:</span>
            <input v-model="meta.requisicao" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__l">
            <span class="meta__l">Data da requisição:</span>
            <input v-model="meta.dataRequisicao" class="meta__i" type="date" />
        </label>

        <label class="meta__cell meta__m">
            <span class="meta__l">Solicitado por:</span>
            <input v-model="meta.solicitadoPor" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__n">
            <span class="meta__l">Número da ocorrência NR/INC:</span>
            <input v-model="meta.nrInc" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__o">
            <span class="meta__l">Número do componente:</span>
            <input v-model="meta.numeroComponente" class="meta__i" type="text" />
        </label>

        <label class="meta__cell meta__p">
            <span class="meta__l">Autorizado por:</span>
            <input v-model="meta.autorizadoPor" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__q">
            <span class="meta__l">Número PEP da obra:</span>
            <input v-model="meta.pepObra" class="meta__i" type="text" />
        </label>
        <label class="meta__cell meta__r">
            <span class="meta__l">Data da devolução:</span>
            <input v-model="meta.dataDevolucao" class="meta__i" type="date" />
        </label>
      </div>
    </section>

    <section class="doc__table" aria-label="Itens">
      <div class="doc__table-head">
        <div class="doc__table-title">Controle quantitativo</div>
        <div class="doc__table-tools">
          <button type="button" class="doc__btn" @click="addRow()">Adicionar linha</button>
          <button type="button" class="doc__btn doc__btn--ghost" @click="clearRows()" :disabled="rows.length === 0">Limpar</button>
        </div>
      </div>

      <div class="doc__wrap" role="region" aria-label="Tabela do documento">
        <table class="t">
          <thead>
            <tr>
              <th class="t__n">Nº</th>
              <th class="t__code">Código</th>
              <th class="t__desc">Texto breve material</th>
              <th class="t__umb">UMB</th>
              <th class="t__qty">Qtd. Solicitada</th>
              <th class="t__qty">Qtd. Expedida</th>
              <th class="t__qty">Qtd. Baixada</th>
              <th class="t__qty">Qtd. Devolvida</th>
              <th class="t__serial">Serial (Trafo / regulador / medidor)</th>
              <th class="t__sap">Nº documento SAP</th>
              <th class="t__act" aria-label="Ações"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in printRows" :key="r.id">
              <td class="t__n">{{ i + 1 }}</td>
              <td><input v-model="r.codigo" class="t__i t__i--mono" type="text" /></td>
              <td><input v-model="r.descricao" class="t__i" type="text" /></td>
              <td><input v-model="r.umb" class="t__i t__i--sm" type="text" /></td>
              <td><input v-model="r.qtdSolic" class="t__i t__i--num" type="text" inputmode="decimal" /></td>
              <td><input v-model="r.qtdExp" class="t__i t__i--num" type="text" inputmode="decimal" /></td>
              <td><input v-model="r.qtdBaix" class="t__i t__i--num" type="text" inputmode="decimal" /></td>
              <td><input v-model="r.qtdDev" class="t__i t__i--num" type="text" inputmode="decimal" /></td>
              <td><input v-model="r.serial" class="t__i" type="text" /></td>
              <td><input v-model="r.sap" class="t__i" type="text" /></td>
              <td class="t__act">
                <button type="button" class="t__del" title="Remover linha" @click="removeRow(r.id)">×</button>
              </td>
            </tr>
            <tr v-if="rows.length === 0 && !isBlank">
              <td class="t__empty" colspan="11">Clique em “Adicionar linha” para começar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <footer class="doc__footer">
      <div class="sig">
        <div class="sig__line"></div>
        <div class="sig__l">Devolução</div>
      </div>
      <div class="sig">
        <div class="sig__line"></div>
        <div class="sig__l">Assinatura do Encarregado</div>
      </div>
      <div class="sig">
        <div class="sig__line"></div>
        <div class="sig__l">Assinatura do Conferente</div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  printPages: { type: Number, default: 1 }
});

const meta = ref({
  contratada: "",
  municipio: "",
  localidadeAplicacao: "",
  areaSetor: "",
  depositoEquipe: "",
  requisicao: "",
  solicitadoPor: "",
  autorizadoPor: "",
  dataProcReserva: "",
  horaProcReserva: "",
  dataPlanejadaSaque: "",
  horaPlanejadaSaque: "",
  placaVeiculo: "",
  dataRequisicao: "",
  nrInc: "",
  numeroComponente: "",
  pepObra: "",
  dataDevolucao: "",
  observacao: ""
});

const rows = ref([]);

const isBlank = computed(() => {
  const m = meta.value || {};
  const hasMeta = Object.values(m).some((v) => String(v || "").trim());
  const hasRows = rows.value.some((r) => {
    const { id, ...rest } = r || {};
    return Object.values(rest).some((v) => String(v || "").trim());
  });
  return !hasMeta && !hasRows;
});

function blankRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    codigo: "",
    descricao: "",
    umb: "",
    qtdSolic: "",
    qtdExp: "",
    qtdBaix: "",
    qtdDev: "",
    serial: "",
    sap: ""
  };
}

const printRows = computed(() => {
  // Se estiver totalmente em branco, gera linhas extras para preenchimento manual no papel.
  if (isBlank.value) {
    const pages = Math.max(1, Math.min(20, Math.floor(Number(props.printPages) || 1)));
    const rowsPerPage = 22;
    const total = pages * rowsPerPage;
    return Array.from({ length: total }, (_, i) => ({
      id: `blank-${i + 1}`,
      codigo: "",
      descricao: "",
      umb: "",
      qtdSolic: "",
      qtdExp: "",
      qtdBaix: "",
      qtdDev: "",
      serial: "",
      sap: ""
    }));
  }
  return rows.value;
});

function addRow() {
  rows.value.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    codigo: "",
    descricao: "",
    umb: "",
    qtdSolic: "",
    qtdExp: "",
    qtdBaix: "",
    qtdDev: "",
    serial: "",
    sap: ""
  });
}

function removeRow(id) {
  rows.value = rows.value.filter((r) => r.id !== id);
}

function clearRows() {
  rows.value = [];
}
</script>

<style scoped>
.doc {
  background: #ffffff;
  color: #0f172a;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  overflow: hidden;
}

.doc__top {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
}

.doc__logos {
  display: flex;
  align-items: center;
  gap: 10px;
}

.doc__logo {
  border-radius: 2px;
  padding: 1px 5px;
  background: #ffffff;
  display: grid;
  place-items: center;
  height: 46px;
  width: 150px;
}

.doc__logo-img {
  display: block;
  max-width: 100%;
  max-height: 34px;
  object-fit: contain;
}

.doc__logo-img--eq { max-height: 30px; }
.doc__logo-img--cgb { max-height: 34px; }

.doc__title {
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  gap: 4px;
}

.doc__title-line {
  font-weight: 800;
  font-size: 14px;
  color: #000000;
  line-height: 1.1;
}

.doc__title-sub {
  font-weight: 700;
  font-size: 12.5px;
  color: #000000;
  line-height: 1.1;
}

.doc__meta {
  padding: 12px 14px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
}

.meta {
  display: grid;
  gap: 0;
  border: 1px solid rgba(17, 24, 39, 0.55);
  border-radius: 2px;
  overflow: hidden;
  grid-template-columns: 1.05fr 0.9fr 0.95fr;
}

.meta__head {
  background: #f8fafc;
  font-weight: 900;
  font-size: 12px;
  color: #000000;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta__cell {
  border-right: 1px solid rgba(17, 24, 39, 0.55);
  border-bottom: 1px solid rgba(17, 24, 39, 0.55);
  padding: 5px 8px;
  min-width: 0;
}

.meta > .meta__cell:nth-child(3n) {
  border-right: none;
}

.meta__l {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #000000;
  margin-bottom: 2px;
  line-height: 1.05;
}

.meta__i {
  width: 100%;
  min-width: 0;
  padding: 6px 7px;
  border-radius: 2px;
  border: 1px solid rgba(17, 24, 39, 0.35);
  background: #ffffff;
  color: #0f172a;
  font-size: 12.5px;
  line-height: 1.1;
}

.meta__obs-head {
  justify-content: center;
}

.meta__obs {
  padding: 8px 10px;
  grid-column: 3;
  grid-row: 2 / span 5;
}

.meta__ta {
  width: 100%;
  min-height: 100%;
  resize: vertical;
  padding: 8px;
  border-radius: 2px;
  border: 1px solid rgba(17, 24, 39, 0.35);
  background: #ffffff;
  color: #0f172a;
  font-size: 12.5px;
  font-family: inherit;
  line-height: 1.2;
}

@media (max-width: 1000px) {
  .meta { grid-template-columns: 1fr; }
  .meta__head { justify-content: flex-start; padding-left: 10px; }
  .meta > .meta__cell:nth-child(3n) { border-right: 1px solid rgba(17, 24, 39, 0.55); }
  .meta__cell { border-right: none; }
  .meta__obs { grid-column: auto; grid-row: auto; }
}

.meta__a { grid-column: 1; grid-row: 2; }
.meta__b { grid-column: 2; grid-row: 2; }
.meta__c { grid-column: 1; grid-row: 3; }
.meta__d { grid-column: 2; grid-row: 3; }
.meta__e { grid-column: 1; grid-row: 4; }
.meta__f { grid-column: 2; grid-row: 4; }
.meta__g { grid-column: 1; grid-row: 5; }
.meta__h { grid-column: 2; grid-row: 5; }
.meta__i { grid-column: 1; grid-row: 6; }
.meta__j { grid-column: 2; grid-row: 6; }
.meta__k { grid-column: 1; grid-row: 7; }
.meta__l { grid-column: 2; grid-row: 7; }
.meta__m { grid-column: 1; grid-row: 8; }
.meta__n { grid-column: 2; grid-row: 8; }
.meta__o { grid-column: 3; grid-row: 8; }
.meta__p { grid-column: 1; grid-row: 9; }
.meta__q { grid-column: 2; grid-row: 9; }
.meta__r { grid-column: 3; grid-row: 9; }

.doc__table {
  padding: 12px 14px 14px;
}

.doc__table-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.doc__table-title {
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #334155;
}

.doc__table-tools {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: end;
}

.doc__btn {
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  background: #0f172a;
  color: #ffffff;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
}

.doc__btn--ghost {
  background: #ffffff;
  color: #0f172a;
}

.doc__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.doc__wrap {
  overflow: auto;
  border-radius: 2px;
  border: 1px solid rgba(17, 24, 39, 0.55);
}

.t {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.t th,
.t td {
  border-bottom: 1px solid rgba(17, 24, 39, 0.55);
  border-right: 1px solid rgba(17, 24, 39, 0.55);
  padding: 6px 6px;
  vertical-align: middle;
}

.t th:last-child,
.t td:last-child {
  border-right: none;
}

.t th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #1e293b;
  color: #ffffff;
  font-weight: 900;
  text-align: center;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.t__n {
  width: 44px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.t__code { width: 140px; }
.t__desc { min-width: 260px; }
.t__umb { width: 72px; text-align: center; }
.t__qty { width: 120px; text-align: center; }
.t__serial { min-width: 260px; }
.t__sap { width: 160px; }
.t__act { width: 44px; text-align: center; }

.t__i {
  width: 100%;
  padding: 6px 7px;
  border-radius: 2px;
  border: 1px solid rgba(17, 24, 39, 0.55);
  background: #ffffff;
  color: #000000;
  font-size: 11px;
  line-height: 1.15;
}

.t__i:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.20);
  border-color: rgba(37, 99, 235, 0.95);
}

.t__i:hover {
  border-color: rgba(17, 24, 39, 0.85);
}

.t__i--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.t__i--num {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.t__i--sm {
  text-align: center;
}

.t__del {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  background: rgba(239, 68, 68, 0.08);
  color: rgba(185, 28, 28, 0.95);
  font-weight: 900;
  cursor: pointer;
}

.t__empty {
  padding: 12px;
  text-align: center;
  color: #475569;
  font-weight: 700;
}

.doc__footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.95);
  background: #f8fafc;
}

.sig {
  display: grid;
  gap: 8px;
  align-content: end;
}

.sig__line {
  height: 1px;
  background: rgba(148, 163, 184, 0.95);
}

.sig__l {
  font-size: 11px;
  font-weight: 800;
  color: #334155;
  text-align: center;
}

@media (max-width: 1000px) {
  /* meta grid already adapts */
}

@media (max-width: 640px) {
  .doc__top { grid-template-columns: 1fr; }
  .doc__grid { grid-template-columns: 1fr; }
  .f--span2 { grid-column: span 1; }
  .doc__footer { grid-template-columns: 1fr; }
}

@media print {
  /* Para impressão: remove "caixinhas" internas e deixa linhas */
  .doc {
    font-size: 1.12em;
  }

  .doc__title-line {
    font-size: 16px;
  }

  .doc__title-sub {
    font-size: 13px;
  }

  .meta__l {
    font-size: 12px;
  }

  .meta__i,
  .meta__ta {
    font-size: 13px;
  }

  .t {
    font-size: 12px;
  }

  .t th {
    font-size: 12px;
  }

  .t__i {
    font-size: 12px;
  }

  .doc__btn,
  .t__del,
  .t__empty {
    display: none !important;
  }

  .doc,
  .meta,
  .doc__wrap {
    border-color: #111827 !important;
  }

  .meta__cell,
  .t th,
  .t td {
    border-color: #111827 !important;
  }

  .meta__i,
  .meta__ta,
  .t__i {
    border-color: #111827 !important;
    background: #ffffff !important;
    color: #111827 !important;
  }

  .meta__i,
  .t__i {
    border-width: 0 0 1px 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .meta__ta {
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .t th {
    position: static !important;
  }

  /* Mantém cabeçalho e caixas sem sombras */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
}
</style>

