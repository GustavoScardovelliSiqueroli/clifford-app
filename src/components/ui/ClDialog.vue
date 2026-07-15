<template>
  <q-dialog
    v-model="modelValue"
    :persistent="persistent"
    :maximized="maximized"
  >
    <div class="modal" :class="[fullMobile && 'modal--full-mobile']">
      <header v-if="showHeader && ($slots.header || title)" class="modal__header">
        <slot name="header">
          <h2 class="modal__title" :id="titleId">{{ title }}</h2>
        </slot>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Fechar"
          @click="close"
          class="modal__close"
        />
      </header>
      
      <main class="modal__content">
        <slot></slot>
      </main>
      
      <footer v-if="showFooter && $slots.footer" class="modal__footer">
        <slot name="footer"></slot>
      </footer>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QDialog, QBtn } from 'quasar'

interface Props {
  modelValue: boolean
  title?: string
  persistent?: boolean
  maximized?: boolean
  fullMobile?: boolean
  showHeader?: boolean
  showFooter?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped lang="scss">
.modal {
  max-width: var(--dialog-max-width);
  width: calc(100% - var(--spacing-8));
  border-radius: var(--dialog-border-radius);
  background: var(--color-white);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  
  &.modal--full-mobile {
    @media (max-width: #{$breakpoint-sm - 1px}) {
      max-width: 100vw;
      width: 100vw;
      border-radius: 0;
      margin: 0;
      max-height: 100vh;
      height: 100vh;
    }
  }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.modal__title {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-full);
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  
  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.modal__content {
  padding: var(--dialog-padding);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

:deep(.q-dialog__inner) {
  overflow-x: hidden !important;
  max-width: 100vw;
  border-radius: var(--dialog-border-radius);
  padding: var(--spacing-4);
  
  @media (max-width: #{$breakpoint-sm - 1px}) {
    padding: 0;
    border-radius: 0;
    max-height: 100vh;
  }
}

:deep(.q-dialog__backdrop) {
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.4);
}
</style>