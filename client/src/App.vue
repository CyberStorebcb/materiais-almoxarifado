<template>
  <div class="app">
    <header class="app__header">
      <div class="app__header-inner">
        <div class="app__title">
          <h1>Almoxarifado</h1>
          <p>Documentos (PDF e CAD) e inventário de materiais</p>
        </div>
        <nav class="app__actions" aria-label="Navegação rápida">
          <button class="chip" type="button" @click="scrollTo('docs')">Documentos</button>
          <button class="chip" type="button" @click="scrollTo('materiais')">Materiais</button>
        </nav>
      </div>
    </header>

    <main class="app__grid" :class="gridClass" aria-label="Conteúdo principal">
      <section
        v-if="previewMode !== 'hidden'"
        ref="docsEl"
        class="panel panel--docs"
        aria-label="Pré-visualização de documentos"
      >
        <header class="panel__header">
          <h2>Documentos</h2>
          <div class="panel__tools" aria-label="Controles do preview">
            <button class="chip chip--sm" type="button" @click="togglePreview">
              <span class="chip__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
              </span>
              Ocultar
            </button>
            <button class="chip chip--sm" type="button" @click="toggleCompact">
              <span class="chip__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3H5a2 2 0 00-2 2v3" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 3h3a2 2 0 012 2v3" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21H5a2 2 0 01-2-2v-3" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21h3a2 2 0 002-2v-3" />
                </svg>
              </span>
              {{ previewMode === "compact" ? "Normal" : "Compacto" }}
            </button>
          </div>
        </header>
        <FilePreviewPanel />
      </section>

      <section ref="materiaisEl" class="panel panel--materiais" aria-label="Lista de materiais">
        <header class="panel__header">
          <h2>Materiais</h2>
          <div v-if="previewMode === 'hidden'" class="panel__tools" aria-label="Controles do preview">
            <button class="chip chip--sm" type="button" @click="togglePreview">Mostrar preview</button>
          </div>
        </header>
        <ListaMateriais />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import FilePreviewPanel from "./components/FilePreviewPanel.vue";
import ListaMateriais from "./components/ListaMateriais.vue";

const docsEl = ref(null);
const materiaisEl = ref(null);
const previewMode = ref("full"); // 'full' | 'compact' | 'hidden'

function scrollTo(where) {
  const el = where === "docs" ? docsEl.value : materiaisEl.value;
  el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

function togglePreview() {
  previewMode.value = previewMode.value === "hidden" ? "full" : "hidden";
}

function toggleCompact() {
  if (previewMode.value === "hidden") return;
  previewMode.value = previewMode.value === "compact" ? "full" : "compact";
}

const gridClass = computed(() => {
  if (previewMode.value === "hidden") return "app__grid--single";
  if (previewMode.value === "compact") return "app__grid--compact";
  return "";
});
</script>

<style scoped>
.app {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.app__header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: clamp(0.9rem, 1.2vw, 1.1rem) clamp(0.9rem, 2vw, 1.5rem);
  border-bottom: 1px solid rgba(51, 65, 85, 0.9);
  background: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
}

.app__header-inner {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.app__title { min-width: 0; }
.app__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: end; }

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background 160ms var(--ease-out, ease), transform 160ms var(--ease-out, ease), box-shadow 160ms var(--ease-out, ease);
}

.chip__icon {
  width: 14px;
  height: 14px;
  margin-right: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.95;
}

.chip__icon svg {
  width: 14px;
  height: 14px;
}

.chip--sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
}

.chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chip:hover {
  background: var(--btn-bg-hover);
}

.chip:active {
  transform: translateY(1px);
}

.chip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--ring-soft);
}

.app__header h1 {
  margin: 0 0 0.25rem;
  font-size: clamp(1.25rem, 1.2rem + 0.7vw, 1.65rem);
  font-weight: 650;
  letter-spacing: -0.02em;
}

.app__header p {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.app__grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: var(--space-4);
  align-items: stretch;
  padding: clamp(0.9rem, 2vw, 1.6rem);
  width: 100%;
  overflow: auto;
  transition: grid-template-columns 220ms var(--ease-out, ease);
}

.app__grid--compact {
  grid-template-columns: 0.95fr 1.25fr;
}

.app__grid--single {
  grid-template-columns: 1fr;
}

@media (max-width: 960px) {
  .app__grid {
    grid-template-columns: 1fr;
  }
  .app__header-inner {
    align-items: start;
  }
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-3);
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel--docs,
.panel--materiais {
  scroll-margin-top: 92px;
}

.panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
}

.panel__tools {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: end;
}

.panel__header h2 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 600;
}

@media (max-width: 640px) {
  .app__grid { gap: var(--space-3); }
  .panel { padding: var(--space-3); }
  .app__actions { width: 100%; justify-content: start; }
}
</style>
