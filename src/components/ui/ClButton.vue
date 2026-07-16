<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
    :aria-label="icon && !label ? label : undefined"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true">
      <q-spinner-dots :size="spinnerSize" color="currentColor" />
    </span>
    
    <span v-else-if="icon && !label" class="btn__icon" aria-hidden="true">
      <q-icon :name="icon" :size="iconSize" />
    </span>
    
    <span v-else class="btn__content">
      <q-icon v-if="icon" :name="icon" :size="iconSize" class="btn__icon" aria-hidden="true" />
      <span v-if="label" class="btn__label">{{ label }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QIcon, QSpinnerDots } from 'quasar'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  label?: string
  icon?: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  round?: boolean
}

interface Emits {
  click: [event: MouseEvent]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
  type: 'button',
  round: false,
})

const emit = defineEmits<Emits>()

const buttonClasses = computed(() => {
  const classes = ['btn', `btn--${props.variant}`, `btn--${props.size}`]
  if (props.fullWidth) classes.push('btn--full')
  if (props.round) classes.push('btn--round')
  if (props.loading) classes.push('btn--loading')
  if (props.disabled) classes.push('btn--disabled')
  if (props.icon && !props.label) classes.push('btn--icon-only')
  return classes.join(' ')
})

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'sm': return '16px'
    case 'lg':
    case 'xl': return '24px'
    default: return '20px'
  }
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return '18px'
    case 'lg':
    case 'xl': return '22px'
    default: return '20px'
  }
})

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped lang="scss">
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  border: none;
  border-radius: var(--border-radius-button);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-normal);
  cursor: pointer;
  transition: all var(--transition-button);
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}

// Tamanhos - Touch targets mínimos 44px (Material Design)
.btn--sm {
  height: 36px;
  min-height: 36px;
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-body-sm);
}

.btn--md {
  height: 44px;
  min-height: 44px;
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-body);
}

.btn--lg {
  height: 52px;
  min-height: 52px;
  padding: 0 var(--spacing-6);
  font-size: var(--font-size-body-lg);
}

.btn--xl {
  height: 60px;
  min-height: 60px;
  padding: 0 var(--spacing-8);
  font-size: var(--font-size-body-lg);
}

.btn--full {
  width: 100%;
}

.btn--round {
  border-radius: var(--border-radius-full) !important;
  padding-left: 44px !important;
  padding-right: 44px !important;
  
  &.btn--sm {
    padding-left: 36px !important;
    padding-right: 36px !important;
  }
  
  &.btn--lg {
    padding-left: 52px !important;
    padding-right: 52px !important;
  }
  
  &.btn--xl {
    padding-left: 60px !important;
    padding-right: 60px !important;
  }
}

// Botão apenas com ícone - padding adequado, não zero
.btn--icon-only {
  padding: 0 var(--spacing-3) !important;
  width: auto !important;
  min-width: 44px;
  border-radius: var(--border-radius-full) !important;
  
  &.btn--sm {
    min-width: 36px;
    padding: 0 var(--spacing-2) !important;
  }
  
  &.btn--lg {
    min-width: 52px;
    padding: 0 var(--spacing-4) !important;
  }
  
  &.btn--xl {
    min-width: 60px;
    padding: 0 var(--spacing-5) !important;
  }
}

.btn--loading {
  color: transparent !important;
  
  .btn__icon {
    opacity: 0;
  }
  
  .btn__label {
    opacity: 0;
  }
}

.btn__spinner {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  width: 100%;
}

.btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// Variants
.btn--primary {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  
  @media (hover: none) and (pointer: coarse) {
    &:active:not(:disabled) {
      background: var(--color-primary);
    }
  }
}

.btn--secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  
  &:hover:not(:disabled) {
    background: var(--color-surface-hover);
    border-color: var(--color-border-medium);
  }
}

.btn--outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  
  &:hover:not(:disabled) {
    background: rgba(var(--color-primary), 0.08);
  }
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  
  &:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
  
  @media (hover: none) and (pointer: coarse) {
    &:active:not(:disabled) {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
    }
  }
}

.btn--destructive {
  background: var(--color-negative);
  color: var(--color-white);
  
  &:hover:not(:disabled) {
    background: #a00012;
  }
}

.btn--success {
  background: var(--color-positive);
  color: var(--color-white);
  
  &:hover:not(:disabled) {
    background: #1a9c3b;
  }
}
</style>