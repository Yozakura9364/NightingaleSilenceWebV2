<template>
  <main class="ns-page nsarmoire-landing">
    <div class="ns-page-shell nsarmoire-landing__shell ns-animate ns-animate--fade-in-up ns-animate-visible">
      <section class="ns-workbench-panel ns-workbench-panel--solid nsarmoire-landing__intro">
        <div class="nsarmoire-landing__intro-copy">
          <header class="ns-workbench-panel__header">
            <h1 class="ns-title ns-heading-bloom">{{ t(tool.titleKey) }}</h1>
          </header>
          <p>{{ t(textKeys.nsarmoireLandingSummary) }}</p>
          <a
            class="ns-button ns-button--primary nsarmoire-landing__download"
            :href="helperReleaseUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              class="nsarmoire-landing__download-icon ns-pixel-icon"
              :style="downloadIconStyle"
              aria-hidden="true"
            ></span>
            <span>{{ t(textKeys.nsarmoireDownloadHelper) }}</span>
          </a>
        </div>

        <a
          class="nsarmoire-landing__preview"
          :href="workbenchPreview"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            :src="workbenchPreview"
            :alt="t(tool.titleKey)"
            width="1280"
            height="800"
            loading="lazy"
            decoding="async"
          />
        </a>
      </section>

      <section class="ns-workbench-panel ns-workbench-panel--solid nsarmoire-landing__guide">
        <header class="ns-workbench-panel__header">
          <h2 class="ns-workbench-panel__title">{{ t(textKeys.nsarmoireLandingGuide) }}</h2>
        </header>
        <ol>
          <li>{{ t(textKeys.nsarmoireHelperIdleMessage) }}</li>
          <li>{{ t(textKeys.nsarmoireHelperGameNotFoundMessage) }}</li>
          <li>{{ t(textKeys.nsarmoireHelperDresserNotLoadedMessage) }}</li>
        </ol>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import workbenchPreview from '@/assets/armoire/armoire-workbench-preview.webp'
import githubIcon from '@/assets/icons/pixelarticons/github.svg'
import { getRequiredFfxivTool } from '@/config/site'
import { armoireTextKeys as textKeys } from '@/locales/keys/armoire'
import { useLocale } from '@/stores/locale'

const helperReleaseUrl = 'https://github.com/Yozakura9364/NSArmoireButler/releases/latest'
const tool = getRequiredFfxivTool('armoire')
const { t } = useLocale()
const downloadIconStyle = {
  '--ns-pixel-icon-url': `url("${githubIcon}")`
} as CSSProperties
</script>

<style scoped>
.nsarmoire-landing {
  --nsarmoire-landing-frame: #000;

  background: var(--ns-body-background);
}

:global(:root[data-theme='night']) .nsarmoire-landing {
  --nsarmoire-landing-frame: var(--ns-pixel-border);
}

.nsarmoire-landing__shell {
  width: min(1100px, calc(100vw - 32px));
  padding-top: 24px;
}

.nsarmoire-landing__intro,
.nsarmoire-landing__guide {
  margin-top: 18px;
  border-color: var(--nsarmoire-landing-frame);
}

.nsarmoire-landing__intro {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(0, 520px);
  align-items: center;
  gap: 28px;
  margin-top: 0;
  padding: 24px;
}

.nsarmoire-landing__intro-copy {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 18px;
  min-width: 0;
}

.nsarmoire-landing__intro h1,
.nsarmoire-landing__intro p,
.nsarmoire-landing__guide h2 {
  margin: 0;
}

.nsarmoire-landing__intro p {
  max-width: 680px;
  color: var(--ns-color-text-muted);
  line-height: 1.75;
}

.nsarmoire-landing__download {
  width: fit-content;
  text-decoration: none;
}

.nsarmoire-landing__download-icon {
  width: 18px;
  height: 18px;
  background: currentColor;
  mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
}

.nsarmoire-landing__preview {
  display: block;
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  background: #fff;
  line-height: 0;
}

.nsarmoire-landing__preview:focus-visible {
  outline: 0;
  box-shadow: var(--ns-focus-ring);
}

.nsarmoire-landing__preview img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 8 / 5;
  object-fit: contain;
}

.nsarmoire-landing__guide {
  padding: 20px 24px 24px;
}

.nsarmoire-landing__guide ol {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  padding-left: 24px;
  line-height: 1.65;
}

@media (max-width: 820px) {
  .nsarmoire-landing__intro {
    grid-template-columns: 1fr;
  }

  .nsarmoire-landing__preview {
    max-width: none;
  }
}

@media (max-width: 680px) {
  .nsarmoire-landing__shell {
    width: min(100%, calc(100vw - 24px));
  }

  .nsarmoire-landing__intro,
  .nsarmoire-landing__guide {
    padding: 18px;
  }
}
</style>
