<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
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
    case 'sm': return '16px'
    case 'lg':
    case 'xl': return '20px'
    default: return '18px'
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

.btn--sm {
  height: var(--button-height-sm);
  padding: var(--button-padding-sm);
  font-size: var(--font-size-body-sm);
}

.btn--md {
  height: var(--button-height-md);
  padding: var(--button-padding-md);
  font-size: var(--font-size-body);
}

.btn--lg {
  height: var(--button-height-lg);
  padding: var(--button-padding-lg);
  font-size: var(--font-size-body-lg);
}

.btn--xl {
  height: var(--button-height-xl);
  padding: var(--button-padding-xl);
  font-size: var(--font-size-body-lg);
}

.btn--full {
  width: 100%;
}

.btn--round {
  border-radius: var(--border-radius-full) !important;
  padding-left: var(--button-height-md) !important;
  padding-right: var(--button-height-md) !important;
  
  &.btn--sm {
    padding-left: var(--button-height-sm) !important;
    padding-right: var(--button-height-sm) !important;
  }
  
  &.btn--lg {
    padding-left: var(--button-height-lg) !important;
    padding-right: var(--button-height-lg) !important;
  }
  
  &.btn--xl {
    padding-left: var(--button-height-xl) !important;
    padding-right: var(--button-height-xl) !important;
  }
}

.btn--icon-only {
  padding: 0 !important;
  width: var(--button-height-md);
  border-radius: var(--border-radius-full) !important;
  
  &.btn--sm {
    width: var(--button-height-sm);
  }
  
  &.btn--lg {
    width: var(--button-height-lg);
  }
  
  &.btn--xl {
    width: var(--button-height-xl);
  }
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

// Loading state
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
</style>