<template>
  <span class="badge" :class="variantClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'
type BadgeSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  dot: false,
})

const variantClasses = computed(() => {
  const classes = ['badge', `badge--${props.variant}`, `badge--${props.size}`]
  if (props.dot) classes.push('badge--dot')
  return classes.join(' ')
})
</script>

<style scoped lang="scss">
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-badge);
  white-space: nowrap;
  line-height: 1;
  
  &--sm {
    height: 20px;
    padding: 0 var(--spacing-2);
    font-size: var(--font-size-caption);
  }
  
  &--md {
    height: 24px;
    padding: 0 var(--spacing-2);
    font-size: var(--font-size-caption-md);
  }
  
  &--lg {
    height: 28px;
    padding: 0 var(--spacing-3);
    font-size: var(--font-size-body-sm);
  }
}

.badge--dot {
  padding-left: var(--spacing-2);
  padding-right: var(--spacing-2);
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: var(--border-radius-circle);
    background: currentColor;
    margin-right: var(--spacing-2);
    flex-shrink: 0;
  }
  
  &.badge--sm::before { width: 5px; height: 5px; }
  &.badge--lg::before { width: 8px; height: 8px; }
}

// Variants
.badge--primary {
  background: rgba(var(--color-primary-rgb), 0.12);
  color: var(--color-primary);
}

.badge--secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.badge--success {
  background: rgba(var(--color-positive-rgb), 0.12);
  color: var(--color-positive);
}

.badge--warning {
  background: rgba(var(--color-warning-rgb), 0.12);
  color: #a07000;
}

.badge--error {
  background: rgba(var(--color-negative-rgb), 0.12);
  color: var(--color-negative);
}

.badge--outline {
  background: transparent;
  border: 1px solid currentColor;
}
</style>