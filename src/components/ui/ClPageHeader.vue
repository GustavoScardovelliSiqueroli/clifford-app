<template>
  <header class="page-header" :class="{ 'page-header--lg': large, 'page-header--has-logo': logo }">
    <div class="page-header__content">
      <div class="page-header__main">
        <img v-if="logo" :src="logo" :alt="title" class="page-header__logo" />
        <h1 v-else class="page-header__title">{{ title }}</h1>
        <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
      </div>
      <div class="page-header__actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
  large?: boolean;
  logo?: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.page-header {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--spacing-4) var(--spacing-6);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);

  @media (min-width: 1024px) {
    padding: var(--spacing-6) var(--spacing-8);
  }
}

.page-header--lg {
  padding-top: var(--spacing-6);
  padding-bottom: var(--spacing-6);

  @media (min-width: 1024px) {
    padding-top: var(--spacing-8);
    padding-bottom: var(--spacing-8);
  }
}

.page-header__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
  flex-wrap: wrap;
  max-width: 1440px;
  margin: 0 auto;
}

.page-header__main {
  flex: 1;
  min-width: 0;
}

.page-header--has-logo {
  background: var(--color-black) !important;
  border-bottom: none;
  padding-top: 0;
  padding-bottom: 0;

  .page-header__content {
    align-items: stretch;
    max-width: none;
  }

  .page-header__main {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
}

.page-header__logo {
  display: block;
  height: var(--page-header-height);
  width: auto;
  padding: var(--spacing-2) 0;
  object-fit: contain;
  margin: 0;
}

@media (min-width: 1024px) {
  .page-header--has-logo {
    padding-top: 0;
    padding-bottom: 0;
  }

  .page-header__logo {
    height: var(--page-header-height-lg);
    padding: var(--spacing-3) 0;
  }
}

.page-header__title {
  font-size: var(--font-size-h6);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-1);
}

.page-header__subtitle {
  font-size: var(--font-size-caption-md);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
  margin: 0;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

@media (max-width: 599px) {
  .page-header__content {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header__actions {
    justify-content: flex-end;
  }
}
</style>
