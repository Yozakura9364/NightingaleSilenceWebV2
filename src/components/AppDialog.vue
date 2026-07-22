<template>
  <Teleport to="body">
    <div
      v-if="state.visible"
      ref="overlayRef"
      class="app-dialog-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="state.title"
      :aria-describedby="describedById"
      @click.self="onOverlayClick"
      @keydown.esc="onEsc"
    >
      <section class="app-dialog-window">
        <div class="app-dialog-window__bar">
          <span class="app-dialog-window__title">
            <span class="app-dialog-window__icon" aria-hidden="true"></span>
            {{ state.title }}
          </span>
        </div>

        <div class="app-dialog-window__body">
          <p id="app-dialog-message" class="app-dialog-window__message">{{ state.message }}</p>

          <input
            v-if="state.mode === 'prompt'"
            ref="inputRef"
            v-model="inputValue"
            class="app-dialog-window__input"
            type="text"
            @keydown.enter="onConfirm"
          />

          <div class="app-dialog-window__actions" :class="{ 'app-dialog-window__actions--center': state.mode === 'alert' }">
            <button
              v-if="state.mode !== 'alert'"
              ref="cancelBtnRef"
              class="app-dialog-window__btn"
              type="button"
              @click="onCancel"
            >
              {{ cancelText }}
            </button>
            <button
              ref="confirmBtnRef"
              class="app-dialog-window__btn app-dialog-window__btn--primary"
              type="button"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { coreTextKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import { useFocusTrap } from '@/composables/useFocusTrap'
import type { DialogState } from '@/composables/useDialog'

const props = defineProps<{
  state: DialogState
  locale?: { ok?: string; cancel?: string }
}>()

const emit = defineEmits<{
  close: [result: string | boolean | null]
}>()

const { t } = useLocale()
const overlayRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const confirmBtnRef = ref<HTMLButtonElement | null>(null)
const cancelBtnRef = ref<HTMLButtonElement | null>(null)
const inputValue = ref('')

const visible = computed(() => props.state.visible)
const describedById = 'app-dialog-message'

const confirmText = computed(() => props.locale?.ok ?? t(coreTextKeys.ok))
const cancelText = computed(() => props.locale?.cancel ?? t(coreTextKeys.cancel))

useFocusTrap(overlayRef, visible)

watch(
  () => props.state.visible,
  async (visible) => {
    if (visible) {
      inputValue.value = props.state.value ?? ''
      await nextTick()
      if (props.state.mode === 'prompt') {
        inputRef.value?.focus()
        inputRef.value?.select()
      } else if (props.state.mode === 'alert') {
        confirmBtnRef.value?.focus()
      } else {
        cancelBtnRef.value?.focus()
      }
    }
  }
)

function onConfirm() {
  if (props.state.mode === 'alert') {
    emit('close', null)
  } else if (props.state.mode === 'confirm') {
    emit('close', true)
  } else {
    emit('close', inputValue.value)
  }
}

function onCancel() {
  if (props.state.mode === 'confirm') {
    emit('close', false)
  } else {
    emit('close', null)
  }
}

function onEsc() {
  onCancel()
}

function onOverlayClick() {
  if (props.state.mode === 'alert') {
    onConfirm()
  }
}
</script>

<style scoped>
.app-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--ns-color-bg) 62%, transparent);
  backdrop-filter: blur(4px);
  animation: app-dialog-fade-in 140ms ease;
}

@keyframes app-dialog-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.app-dialog-window {
  display: grid;
  min-width: 300px;
  max-width: 420px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-window-bg);
  box-shadow: var(--ns-pixel-window-shadow);
  animation: app-dialog-slide-in 180ms ease;
}

@keyframes app-dialog-slide-in {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.app-dialog-window__bar {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px;
  border-bottom: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bar-bg);
}

.app-dialog-window__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: var(--ns-pixel-window-title-color);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-shadow: var(--ns-pixel-window-title-shadow);
}

.app-dialog-window__icon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border: var(--ns-pixel-window-icon-border);
  background: var(--ns-pixel-window-icon-bg);
  box-shadow: var(--ns-pixel-window-icon-shadow);
}

.app-dialog-window__body {
  display: grid;
  gap: 16px;
  padding: 20px 18px 16px;
}

.app-dialog-window__message {
  margin: 0;
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.app-dialog-window__input {
  width: 100%;
  padding: 8px 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: border-color var(--ns-transition-fast);
  box-shadow: var(--ns-control-inset-shadow);
}

.app-dialog-window__input:focus {
  border-color: var(--ns-pixel-border-cyan);
  box-shadow: var(--ns-control-inset-shadow), 0 0 0 3px rgba(99, 217, 220, 0.22);
}

.app-dialog-window__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.app-dialog-window__actions--center {
  justify-content: center;
}

.app-dialog-window__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 18px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  box-shadow: var(--ns-pixel-soft-shadow);
  cursor: pointer;
  user-select: none;
  text-decoration: none;
  transition:
    transform var(--ns-transition-fast),
    border-color var(--ns-transition-fast),
    background var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.app-dialog-window__btn:hover {
  transform: translate(-1px, -1px);
  border-color: var(--ns-pixel-border-accent);
  background: var(--ns-pixel-hover-surface);
  box-shadow: var(--ns-pixel-button-shadow-hover);
}

.app-dialog-window__btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.app-dialog-window__btn:focus-visible {
  outline: 0;
  box-shadow: var(--ns-pixel-button-shadow-hover), var(--ns-focus-ring);
}

.app-dialog-window__btn--primary {
  border-color: var(--ns-pixel-border);
  background: linear-gradient(135deg, var(--ns-color-accent), var(--ns-color-cyan));
  color: var(--ns-color-on-accent);
  text-shadow: var(--ns-control-primary-text-shadow);
}

.app-dialog-window__btn--primary:hover {
  background: linear-gradient(135deg, var(--ns-color-accent-strong), var(--ns-color-cyan));
  border-color: var(--ns-pixel-border);
}
</style>
