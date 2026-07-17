<template>
  <div class="loading-state" :class="alignmentClasses">
    <div class="loading-state__spinner" :style="{ color: color }">
      <q-spinner-dots :size="spinnerSize" :color="color" />
    </div>

    <p v-if="label" class="loading-state__label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type LoadingSize = 'sm' | 'md' | 'lg';

interface Props {
  label?: string;
  size?: LoadingSize;
  color?: string;
  align?: 'center' | 'start' | 'end';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  align: 'center',
});

const alignmentClasses = computed(() => `loading-state--${props.align}`);

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return '32px';
    case 'lg':
      return '64px';
    default:
      return '48px';
  }
});
</script>

<style scoped lang="scss">
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-16) var(--spacing-6);

  &--center {
    align-items: center;
    justify-content: center;
  }

  &--start {
    align-items: flex-start;
    justify-content: flex-start;
  }

  &--end {
    align-items: flex-end;
    justify-content: flex-end;
  }
}

.loading-state__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state__label {
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-tertiary);
  text-align: center;
}
</style>
