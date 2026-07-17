<template>
  <div class="avatar" :class="sizeClasses" :style="imageStyle" role="img" :aria-label="ariaLabel">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="avatar__image"
      @error="onImageError"
      loading="lazy"
    />

    <span v-else-if="!hasImageError" class="avatar__text">
      {{ initials }}
    </span>

    <q-icon v-else :name="fallbackIcon" :size="iconSize" class="avatar__icon" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  fallbackIcon?: string;
  shape?: 'circle' | 'square' | 'rounded';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  fallbackIcon: 'person',
  shape: 'circle',
});

const hasImageError = ref(false);

const sizeClasses = computed(() =>
  ['avatar', `avatar--${props.size}`, `avatar--${props.shape}`].join(' '),
);

const imageStyle = computed(() => ({
  backgroundColor: props.name ? generateColor(props.name) : undefined,
}));

const initials = computed(() => {
  if (!props.name) return '?';

  return props.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
});

const ariaLabel = computed(() => {
  if (props.alt) return props.alt;
  if (props.name) return `Avatar de ${props.name}`;
  return 'Avatar';
});

const iconSize = computed(() => {
  switch (props.size) {
    case 'xs':
      return '10px';
    case 'sm':
      return '14px';
    case 'lg':
      return '22px';
    case 'xl':
      return '26px';
    default:
      return '18px';
  }
});

function onImageError() {
  hasImageError.value = true;
}

function generateColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 60%, 45%)`;
}
</script>

<style scoped lang="scss">
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  user-select: none;
  padding: var(--spacing-1);
}

.avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar__text {
  font-size: var(--font-size-body-sm);
}

.avatar__icon {
  font-size: var(--font-size-body-sm);
}

// Sizes
.avatar--xs {
  width: var(--avatar-size-xs);
  height: var(--avatar-size-xs);
  font-size: var(--font-size-xs);
}

.avatar--sm {
  width: var(--avatar-size-sm);
  height: var(--avatar-size-sm);
  font-size: var(--font-size-caption);
}

.avatar--md {
  width: var(--avatar-size-md);
  height: var(--avatar-size-md);
  font-size: var(--font-size-body-sm);
}

.avatar--lg {
  width: var(--avatar-size-lg);
  height: var(--avatar-size-lg);
  font-size: var(--font-size-body);
}

.avatar--xl {
  width: var(--avatar-size-xl);
  height: var(--avatar-size-xl);
  font-size: var(--font-size-body-lg);
}

// Shapes
.avatar--circle {
  border-radius: var(--border-radius-full);
}

.avatar--square {
  border-radius: var(--border-radius-sm);
}

.avatar--rounded {
  border-radius: var(--border-radius-lg);
}
</style>
