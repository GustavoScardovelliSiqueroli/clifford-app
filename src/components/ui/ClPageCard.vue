<template>
  <section class="page-card" :class="variantClasses">
    <header v-if="$slots.header" class="page-card__header">
      <slot name="header"></slot>
    </header>

    <div class="page-card__content">
      <slot></slot>
    </div>

    <footer v-if="$slots.footer" class="page-card__footer">
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'borderless' | 'elevated' | 'flat';
  padded?: boolean;
}

const props = defineProps<Props>();

const variantClasses = computed(() => ({
  'page-card--default': props.variant === 'default' || !props.variant,
  'page-card--borderless': props.variant === 'borderless',
  'page-card--elevated': props.variant === 'elevated',
  'page-card--flat': props.variant === 'flat',
  'page-card--padded': props.padded !== false,
}));
</script>

<style scoped lang="scss">
.page-card {
  background: var(--color-surface-primary);
  border-radius: var(--border-radius-card);
  overflow: hidden;
  transition:
    box-shadow var(--transition-card),
    transform var(--transition-card);

  &:active {
    box-shadow: var(--shadow-card-active);
    transform: scale(0.99);
  }
}

.page-card--default {
  border: 1px solid var(--color-surface-border);
  box-shadow: var(--shadow-card);
}

.page-card--borderless {
  border: none;
  box-shadow: none;
}

.page-card--elevated {
  border: none;
  box-shadow: var(--shadow-lg);
}

.page-card--flat {
  border: 1px solid var(--color-surface-border);
  box-shadow: none;
  background: var(--color-bg-tertiary);
}

.page-card--padded > .page-card__header,
.page-card--padded > .page-card__content,
.page-card--padded > .page-card__footer {
  padding: var(--card-padding);
}

.page-card__header {
  padding: var(--card-padding);
  padding-bottom: 0;
  border-bottom: 1px solid var(--color-surface-border);
  margin-bottom: var(--card-padding);
}

.page-card__content {
  padding: var(--card-padding);
}

.page-card__footer {
  padding: var(--card-padding);
  padding-top: 0;
  border-top: 1px solid var(--color-surface-border);
  margin-top: var(--card-padding);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

@media (min-width: 1024px) {
  .page-card--padded > .page-card__header,
  .page-card--padded > .page-card__content,
  .page-card--padded > .page-card__footer {
    padding: var(--spacing-6);
  }

  .page-card__header {
    padding: var(--spacing-6);
    padding-bottom: 0;
    margin-bottom: var(--spacing-6);
  }

  .page-card__content {
    padding: var(--spacing-6);
  }

  .page-card__footer {
    padding: var(--spacing-6);
    padding-top: 0;
    margin-top: var(--spacing-6);
  }
}
</style>
