<template>
  <div class="docs">
    <input
      ref="fileInput"
      type="file"
      class="docs__file-hidden"
      accept=".pdf,application/pdf,.dxf,.dwg"
      @change="onFile"
    />

    <div
      class="docs__view docs__drop"
      :data-dragging="dragging ? '1' : '0'"
      @click="abrirFicheiro()"
      @dragover.prevent
      @drop.prevent="onDrop"
      @dragenter.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
    >
      <p v-if="avisoDwg" class="docs__note" @click.stop>{{ avisoDwg }}</p>

      <div
        v-if="fontePdf"
        class="docs__pdf-wrap"
        :class="{ 'docs__pdf-wrap--zoomed': pdfZoom !== 1 }"
        @click.stop
        @wheel.capture="onPdfWheel"
      >
        <div
          ref="pdfPanBox"
          class="docs__pdf-pan"
          :data-panning="pdfPanning ? '1' : '0'"
          @pointerdown.capture="onPdfPointerDown"
          @pointermove.capture="onPdfPointerMove"
          @pointerup.capture="endPdfPan"
          @pointercancel.capture="endPdfPan"
          @pointerleave.capture="endPdfPan"
        >
          <div class="docs__pdf-scale" :style="pdfScaleStyle">
            <VuePdfEmbed
              :key="String(fontePdf || '')"
              :source="fontePdf"
              class="docs__pdf"
              :height="Math.max(1, Math.round(pdfBaseHeight))"
              :scale="pdfRenderScaleQuality"
              :page="1"
              :textLayer="false"
              :annotationLayer="false"
              @loaded="onPdfLoaded"
              @loading-failed="onPdfFailed"
            />
          </div>
        </div>
        <div v-if="pdfCarregando" class="docs__pdf-loading" aria-live="polite">Carregando…</div>
        <div v-if="pdfErro" class="docs__pdf-error" role="status">{{ pdfErro }}</div>
      </div>

      <div v-show="fonteDxf" ref="dxfBox" class="docs__dxf" aria-label="Pré-visualização DXF" @click.stop />

      <div v-if="!fontePdf && !fonteDxf && !avisoDwg" class="docs__empty" @click.stop>
        <span class="docs__empty-muted">Clique ou arraste um PDF ou DXF</span>
      </div>

      <div v-show="dragging" class="docs__drop-overlay" aria-hidden="true">Solte o arquivo</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import VuePdfEmbed from "vue-pdf-embed";
import { DxfViewer } from "dxf-viewer";
import { Color } from "three";

const fileInput = ref(null);
const dxfBox = ref(null);
const pdfPanBox = ref(null);
const fontePdf = ref(null);
const fonteDxf = ref(false);
const avisoDwg = ref("");
const dragging = ref(false);
const pdfBaseHeight = ref(720);
const pdfRenderScale = ref(1.25);
const pdfZoom = ref(1);
const pdfCarregando = ref(false);
const pdfErro = ref("");
const pdfPanning = ref(false);
let pdfPanPointerId = null;
let pdfPanStartX = 0;
let pdfPanStartY = 0;
let pdfPanStartScrollLeft = 0;
let pdfPanStartScrollTop = 0;
let dragDepth = 0;

let dxfViewer = null;
let objectUrlDxf = null;
let objectUrlPdf = null;

const pdfZoomRenderPart = computed(() => Math.min(2, Math.max(1, Number(pdfZoom.value) || 1)));

const pdfRenderScaleQuality = computed(() => {
  const base = Number(pdfRenderScale.value) || 1;
  return base * pdfZoomRenderPart.value;
});

const pdfCssZoom = computed(() => {
  const z = Number(pdfZoom.value) || 1;
  return z / pdfZoomRenderPart.value;
});

const pdfScaleStyle = computed(() => ({
  transform: `scale(${pdfCssZoom.value})`,
  transformOrigin: "top left"
}));

function detectarTipo(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (name.endsWith(".pdf") || type === "application/pdf") return "pdf";
  if (name.endsWith(".dxf")) return "dxf";
  if (name.endsWith(".dwg")) return "dwg";
  return "desconhecido";
}

function limparDxf() {
  if (dxfViewer) {
    try {
      dxfViewer.Destroy();
    } catch {
      /* ignore */
    }
    dxfViewer = null;
  }
  if (objectUrlDxf) {
    URL.revokeObjectURL(objectUrlDxf);
    objectUrlDxf = null;
  }
  fonteDxf.value = false;
  avisoDwg.value = "";
}

function limparPdf() {
  if (objectUrlPdf) {
    URL.revokeObjectURL(objectUrlPdf);
    objectUrlPdf = null;
  }
  fontePdf.value = null;
  pdfCarregando.value = false;
  pdfErro.value = "";
}

function abrirFicheiro() {
  fileInput.value?.click?.();
}

function onPdfFailed(err) {
  pdfCarregando.value = false;
  pdfErro.value = "Não foi possível renderizar o PDF. Tente reabrir o arquivo.";
  console.error(err);
}

function onPdfLoaded(doc) {
  pdfCarregando.value = false;
  pdfErro.value = "";
  nextTick(() => {
    requestAnimationFrame(() => {
      ensurePanResizeObserver();
      atualizarBaseHeight();
    });
  });
}

function atualizarBaseHeight() {
  const el = pdfPanBox.value;
  if (!el) return;
  // Preenche o painel verticalmente (remove o “vazio” embaixo).
  pdfBaseHeight.value = Math.max(360, Math.floor(el.clientHeight - 24));
}

function atualizarRenderScale() {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  pdfRenderScale.value = Math.min(2, Math.max(1, dpr));
}

function onPdfWheel(e) {
  if (!e?.ctrlKey) return;
  // Ctrl+wheel normalmente controla o zoom do browser; aqui usamos para zoom do PDF.
  e.preventDefault();
  e.stopPropagation();

  const container = pdfPanBox.value;
  if (!container) return;

  const prev = Number(pdfZoom.value) || 1;
  const step = 1.12;
  const dir = e.deltaY < 0 ? 1 : -1;
  const next = Math.min(4, Math.max(0.6, dir > 0 ? prev * step : prev / step));
  if (Math.abs(next - prev) < 1e-6) return;

  const rect = container.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const contentX = container.scrollLeft + mouseX;
  const contentY = container.scrollTop + mouseY;
  const ratio = next / prev;

  pdfZoom.value = next;

  // Mantém o ponto sob o cursor aproximadamente fixo após o zoom.
  nextTick(() => {
    const c = pdfPanBox.value;
    if (!c) return;
    c.scrollLeft = contentX * ratio - mouseX;
    c.scrollTop = contentY * ratio - mouseY;
  });
}

function onPdfPointerDown(e) {
  // Só arrasta com botão principal do mouse / toque.
  if (!e) return;
  if (typeof e.button === "number" && e.button !== 0) return;
  const el = pdfPanBox.value;
  if (!el) return;

  pdfPanning.value = true;
  pdfPanPointerId = e.pointerId ?? null;
  pdfPanStartX = e.clientX;
  pdfPanStartY = e.clientY;
  pdfPanStartScrollLeft = el.scrollLeft;
  pdfPanStartScrollTop = el.scrollTop;

  try {
    el.setPointerCapture?.(e.pointerId);
  } catch {
    /* ignore */
  }
  e.preventDefault();
}

function onPdfPointerMove(e) {
  if (!pdfPanning.value) return;
  const el = pdfPanBox.value;
  if (!el) return;
  if (pdfPanPointerId != null && e.pointerId != null && e.pointerId !== pdfPanPointerId) return;

  const dx = e.clientX - pdfPanStartX;
  const dy = e.clientY - pdfPanStartY;
  el.scrollLeft = pdfPanStartScrollLeft - dx;
  el.scrollTop = pdfPanStartScrollTop - dy;
  e.preventDefault();
}

function endPdfPan(e) {
  if (!pdfPanning.value) return;
  const el = pdfPanBox.value;
  pdfPanning.value = false;
  pdfPanPointerId = null;
  if (el && e?.pointerId != null) {
    try {
      el.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  }
}

function ensurePanResizeObserver() {
  if (typeof ResizeObserver === "undefined") return;
  const el = pdfPanBox.value;
  if (!el) return;
  if (ro) {
    ro.disconnect();
    ro = null;
  }
  ro = new ResizeObserver(() => atualizarBaseHeight());
  ro.observe(el);
}

let ro = null;
let onWindowResize = null;

onMounted(() => {
  atualizarRenderScale();
  onWindowResize = () => {
    atualizarRenderScale();
    atualizarBaseHeight();
  };
  window.addEventListener("resize", onWindowResize, { passive: true });
  atualizarBaseHeight();
  ensurePanResizeObserver();
});

async function carregarDxf(file) {
  limparDxf();
  if (!dxfBox.value) return;
  objectUrlDxf = URL.createObjectURL(file);
  dxfViewer = new DxfViewer(dxfBox.value, {
    autoResize: true,
    clearColor: new Color("#1a222d")
  });
  if (!dxfViewer.HasRenderer()) {
    avisoDwg.value = "Não foi possível criar o contexto WebGL para o DXF.";
    return;
  }
  await dxfViewer.Load({ url: objectUrlDxf });
  fonteDxf.value = true;
}

function onDragEnter() {
  dragDepth += 1;
  dragging.value = true;
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
}

async function aplicarArquivo(file) {
  if (!file) return;
  dragDepth = 0;
  dragging.value = false;

  const tipo = detectarTipo(file);
  if (tipo === "pdf") {
    limparDxf();
    limparPdf();
    avisoDwg.value = "";
    objectUrlPdf = URL.createObjectURL(file);
    fontePdf.value = objectUrlPdf;
    pdfCarregando.value = true;
    pdfErro.value = "";
    const pan = pdfPanBox.value;
    if (pan) {
      pan.scrollLeft = 0;
      pan.scrollTop = 0;
    }
    return;
  }

  if (tipo === "dwg") {
    limparDxf();
    avisoDwg.value =
      "DWG é um formato binário. Este painel suporta visualização de DXF. " +
      "No AutoCAD, use Salvar como para exportar DXF e carregue o arquivo aqui.";
    return;
  }

  if (tipo === "dxf") {
    limparPdf();
    pdfErro.value = "";
    avisoDwg.value = "";
    await nextTick();
    try {
      await carregarDxf(file);
    } catch (err) {
      console.error(err);
      avisoDwg.value = "Falha ao carregar o DXF. Verifique se o ficheiro é válido.";
    }
    return;
  }

  limparDxf();
  limparPdf();
  avisoDwg.value = "Formato não suportado. Envie um PDF, DXF ou DWG.";
}

async function onDrop(e) {
  const file = e.dataTransfer?.files?.[0];
  await aplicarArquivo(file);
}

async function onFile(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  await aplicarArquivo(file);
}

onBeforeUnmount(() => {
  if (ro) {
    ro.disconnect();
    ro = null;
  }
  if (onWindowResize) {
    window.removeEventListener("resize", onWindowResize);
    onWindowResize = null;
  }
  limparDxf();
  limparPdf();
});
</script>

<style scoped>
.docs {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  flex: 1 1 auto;
}

.docs__file-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.docs__view {
  flex: 1 1 auto;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: visible;
  background: var(--surface);
  display: flex;
  flex-direction: column;
}

.docs__drop {
  position: relative;
  cursor: pointer;
  flex: 1 1 auto;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.docs__drop[data-dragging="1"] {
  outline: 2px solid rgba(96, 165, 250, 0.65);
  outline-offset: 2px;
}

.docs__drop-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(13, 17, 23, 0.55);
  color: var(--text);
  font-weight: 700;
  letter-spacing: 0.02em;
  font-size: 0.95rem;
  pointer-events: none;
  backdrop-filter: blur(3px);
}

.docs__empty {
  padding: 1.5rem 1rem;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 36rem;
}

.docs__empty-muted {
  color: var(--muted);
}

.docs__note {
  margin: 0;
  padding: 0.75rem 0.9rem;
  background: #2a2118;
  color: #ffc46b;
  font-size: 0.8rem;
  line-height: 1.45;
  border-bottom: 1px solid var(--border);
}

.docs__pdf-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: default;
}

.docs__pdf-pan {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  background: var(--surface);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12px;
  cursor: grab;
  user-select: none;
}

.docs__pdf-pan[data-panning="1"] {
  cursor: grabbing;
}

.docs__pdf-scale {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.docs__pdf {
  display: block;
  width: 100%;
  min-height: 200px;
  box-sizing: border-box;
}

.docs__pdf-pan :deep(.vue-pdf-embed) {
  display: block;
  width: 100%;
  max-width: 100%;
}

.docs__pdf-pan :deep(.vue-pdf-embed__page) {
  display: block;
  position: relative;
  width: 100% !important;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.docs__pdf-pan :deep(canvas) {
  display: block;
  max-width: 100%;
  height: auto;
}

.docs__pdf-wrap--zoomed .docs__pdf-pan {
  justify-content: flex-start;
}

.docs__pdf-wrap--zoomed .docs__pdf-scale {
  width: fit-content;
}

.docs__pdf-wrap--zoomed .docs__pdf,
.docs__pdf-wrap--zoomed .docs__pdf-pan :deep(.vue-pdf-embed),
.docs__pdf-wrap--zoomed .docs__pdf-pan :deep(.vue-pdf-embed__page) {
  width: auto !important;
  max-width: none;
}

.docs__pdf-wrap--zoomed .docs__pdf-pan :deep(canvas) {
  max-width: none;
}

.docs__pdf-loading,
.docs__pdf-error {
  position: absolute;
  left: 12px;
  right: 12px;
  z-index: 2;
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  font-size: 0.85rem;
  border: 1px solid var(--border);
  pointer-events: none;
}

.docs__pdf-loading {
  top: 12px;
  background: rgba(20, 28, 37, 0.85);
  color: var(--text);
  backdrop-filter: blur(5px);
}

.docs__pdf-error {
  top: 12px;
  background: rgba(60, 20, 20, 0.55);
  color: #ffcdd2;
}

.docs__dxf {
  width: 100%;
  height: clamp(520px, 75vh, 980px);
  min-height: 240px;
  position: relative;
  cursor: grab;
}
</style>
