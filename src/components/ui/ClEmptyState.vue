<template>
  <div class="empty-state" :class="alignmentClasses">
    <div v-if="icon" class="empty-state__icon" :class="iconSizeClass">
      <q-icon :name="icon" :size="iconSize" :color="iconColor" />
    </div>
    
    <div v-else-if="image" class="empty-state__image">
      <img :src="image" alt="" />
    </div>
    
    <h3 v-if="title" class="empty-state__title">{{ title }}</h3>
    
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    
    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions" />
    </div>
    
    <div v-else-if="actionLabel" class="empty-state__actions">
      <ClButton
        :variant="actionVariant"
        :size="actionSize"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </ClButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClButton from './ClButton.vue'

type EmptyStateSize = 'sm' | 'md' | 'lg'

interface Props {
  title?: string
  description?: string
  icon?: string
  iconColor?: string
  iconSize?: EmptyStateSize
  image?: string
  actionLabel?: string
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  actionSize?: 'sm' | 'md' | 'lg'
  align?: 'center' | 'start' | 'end'
}

interface Emits {
  action: []
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: 'lg',
  actionVariant: 'primary',
  actionSize: 'md',
  align: 'center',
})

defineEmits<Emits>()

const alignmentClasses = computed(() => `empty-state--${props.align}`)

const iconSizeClass = computed(() => `empty-state__icon--${props.iconSize}`)
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-16) var(--spacing-6);
  text-align: center;
  
  &--center {
    align-items: center;
    justify-content: center;
  }
  
  &--start {
    align-items: flex-start;
    justify-content: flex-start;
    text-align: left;
  }
  
  &--end {
    align-items: flex-end;
    justify-content: flex-end;
    text-align: right;
  }
}

.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-400);
  
  &--sm { width: 48px; height: 48px; }
  &--md { width: 64px; height: 64px; }
  &--lg { width: 80px; height: 80px; }
}

.empty-state__image {
  max-width: 100%;
  height: auto;
  opacity: 0.6;
}

.empty-state__title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  line-height: var(--line-height-tight);
}

.empty-state__description {
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
  max-width: 280px;
}

.empty-state__actions {
  display: flex;
  gap: var(--spacing-3);
  margin-top: var(--spacing-2);
  
  .empty-state--center & {
    justify-content: center;
  }
  
  .empty-state--start & {
    justify-content: flex-start;
  }
  
  .empty-state--end & {
    justify-content: flex-end;
  }
}
</style>