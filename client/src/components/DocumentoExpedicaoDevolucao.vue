<template>
  <div class="doc">
    <header class="doc__top">
      <div class="doc__brand">
        <div class="doc__logos" aria-hidden="true">
          <div class="doc__logo doc__logo--a">equatorial</div>
          <div class="doc__logo doc__logo--b">CGB</div>
        </div>
      </div>

      <div class="doc__title">
        <div class="doc__title-line">Anexo I Controle expedição e devolução de materiais</div>
        <div class="doc__title-sub">CENTRO DISTRIBUIÇÃO / ALMOXARIFADO / DEPÓSITO TÉCNICO</div>
      </div>
    </header>

    <section class="doc__meta" aria-label="Dados do documento">
      <div class="meta">
        <div class="meta__row meta__row--head">
          <div class="meta__cell meta__cell--l"></div>
          <div class="meta__cell meta__cell--m"></div>
          <div class="meta__cell meta__cell--r meta__obs-head">OBSERVAÇÃO</div>
        </div>

        <div class="meta__row">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Contratada (Operador logístico / executora serviço de obra):</span>
            <input v-model="meta.contratada" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Data procesamento da reserva:</span>
            <input v-model="meta.dataProcReserva" class="meta__i" type="date" />
          </label>
          <div class="meta__cell meta__cell--r meta__obs" :style="{ gridRow: 'span 6' }">
            <textarea v-model="meta.observacao" class="meta__ta" rows="9"></textarea>
          </div>
        </div>

        <div class="meta__row">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Município:</span>
            <input v-model="meta.municipio" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Horário procesamento da reserva:</span>
            <input v-model="meta.horaProcReserva" class="meta__i" type="time" />
          </label>
        </div>

        <div class="meta__row">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Localidade aplicação dos materiais:</span>
            <input v-model="meta.localidadeAplicacao" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Data planejada para saque dos materiais:</span>
            <input v-model="meta.dataPlanejadaSaque" class="meta__i" type="date" />
          </label>
        </div>

        <div class="meta__row">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Área / setor:</span>
            <input v-model="meta.areaSetor" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Horário planejado para saque dos materiais:</span>
            <input v-model="meta.horaPlanejadaSaque" class="meta__i" type="time" />
          </label>
        </div>

        <div class="meta__row">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Depósito (viatura ou eletricista) / equipe de campo:</span>
            <input v-model="meta.depositoEquipe" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Placa do veículo:</span>
            <input v-model="meta.placaVeiculo" class="meta__i" type="text" />
          </label>
        </div>

        <div class="meta__row">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Requisição:</span>
            <input v-model="meta.requisicao" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Data da requisição:</span>
            <input v-model="meta.dataRequisicao" class="meta__i" type="date" />
          </label>
        </div>

        <div class="meta__row meta__row--bottom">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Solicitado por:</span>
            <input v-model="meta.solicitadoPor" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Número da ocorrência NR/INC:</span>
            <input v-model="meta.nrInc" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--r2">
            <span class="meta__l">Número do componente:</span>
            <input v-model="meta.numeroComponente" class="meta__i" type="text" />
          </label>
        </div>

        <div class="meta__row meta__row--bottom">
          <label class="meta__cell meta__cell--l">
            <span class="meta__l">Autorizado por:</span>
            <input v-model="meta.autorizadoPor" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--m">
            <span class="meta__l">Número PEP da obra:</span>
            <input v-model="meta.pepObra" class="meta__i" type="text" />
          </label>
          <label class="meta__cell meta__cell--r2">
            <span class="meta__l">Data da devolução:</span>
            <input v-model="meta.dataDevolucao" class="meta__i" type="date" />
          </label>
        </div>
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
            <tr v-for="(r, i) in rows" :key="r.id">
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
            <tr v-if="rows.length === 0">
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
import { ref } from "vue";

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
  display: grid;
  gap: 8px;
}

.doc__logo {
  border: 1px solid rgba(203, 213, 225, 0.95);
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  font-size: 13px;
  text-transform: uppercase;
  color: #111827;
  background: #f8fafc;
}

.doc__title {
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  gap: 4px;
}

.doc__title-line {
  font-weight: 800;
  font-size: 13px;
}

.doc__title-sub {
  font-weight: 700;
  font-size: 12px;
  color: #334155;
}

.doc__meta {
  padding: 12px 14px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
}

.meta {
  display: grid;
  gap: 0;
  border: 1px solid rgba(203, 213, 225, 0.95);
  border-radius: 10px;
  overflow: hidden;
}

.meta__row {
  display: grid;
  grid-template-columns: 1.05fr 0.9fr 0.95fr;
  gap: 0;
}

.meta__row--head .meta__cell {
  background: #f8fafc;
  font-weight: 900;
  font-size: 11px;
  color: #111827;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta__cell {
  border-right: 1px solid rgba(203, 213, 225, 0.95);
  border-bottom: 1px solid rgba(203, 213, 225, 0.95);
  padding: 8px 10px;
  min-width: 0;
}

.meta__row .meta__cell:last-child {
  border-right: none;
}

.meta__l {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #334155;
  margin-bottom: 6px;
}

.meta__i {
  width: 100%;
  min-width: 0;
  padding: 8px 9px;
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
}

.meta__obs-head {
  justify-content: center;
}

.meta__obs {
  padding: 8px 10px;
}

.meta__ta {
  width: 100%;
  min-height: 100%;
  resize: vertical;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  font-size: 12px;
  font-family: inherit;
}

.meta__cell--r2 {
  border-right: none;
}

@media (max-width: 1000px) {
  .meta__row {
    grid-template-columns: 1fr;
  }
  .meta__row--head .meta__cell {
    justify-content: flex-start;
    padding-left: 10px;
  }
  .meta__cell {
    border-right: none;
  }
}

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
  border-radius: 12px;
  border: 1px solid rgba(203, 213, 225, 0.95);
}

.t {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.t th,
.t td {
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
  border-right: 1px solid rgba(226, 232, 240, 0.95);
  padding: 8px 8px;
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
  font-weight: 800;
  text-align: center;
  font-size: 11px;
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
  padding: 7px 8px;
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  font-size: 12px;
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
</style>

