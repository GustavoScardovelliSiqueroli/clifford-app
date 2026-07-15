<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>

    <footer class="bottom-nav" role="navigation" aria-label="Navegação principal">
      <q-tabs
        class="bottom-nav__tabs"
        align="justify"
        active-color="primary"
        indicator-color="transparent"
        no-caps
        dense
      >
        <q-route-tab
          v-for="route in navRoutes"
          :key="route.path"
          :to="route.path"
          :ripple="false"
          class="bottom-nav__item"
          :class="{ 'bottom-nav__item--active': isActive(route.path) }"
          :aria-current="isActive(route.path) ? 'page' : undefined"
        >
          <q-icon :name="route.icon" class="bottom-nav__icon" aria-hidden="true" />
          <span class="bottom-nav__label">{{ route.label }}</span>
        </q-route-tab>
      </q-tabs>
    </footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

const navRoutes = [
  { path: '/', icon: 'home', label: 'Início' },
  { path: '/clientes', icon: 'group', label: 'Clientes' },
  { path: '/cobrancas', icon: 'receipt_long', label: 'Cobranças' },
  { path: '/configuracoes', icon: 'tune', label: 'Ajustes' },
] as const;

function isActive(path: string) {
  return route.path === path || (path !== '/' && route.path.startsWith(path));
}
</script>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--color-white);
  border-top: 1px solid var(--color-border-light);
  box-shadow:
    0 -4px 24px rgba(0, 0, 0, 0.12),
    0 -2px 8px rgba(0, 0, 0, 0.06);
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav__tabs {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-2) var(--spacing-4) var(--spacing-3);
  height: auto;
  min-height: 56px;

  .q-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    padding: var(--spacing-2) var(--spacing-3);
    min-height: 56px;
    border-radius: var(--border-radius-button);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    transition: all var(--transition-fast);
    background: transparent;
    border: none;
    min-width: 0;
    text-align: center;

    &:hover {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
    }

    &:active {
      transform: scale(0.98);
    }

    &.q-tab--active {
      color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.1);
    }

    &.bottom-nav__item--active {
      color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.1);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }
}

.bottom-nav__icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}

.bottom-nav__label {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (min-width: 600px) {
  .bottom-nav__tabs {
    padding: var(--spacing-2) var(--spacing-6) var(--spacing-3);
  }

  .bottom-nav__tabs .q-tab {
    padding: var(--spacing-2) var(--spacing-4);
    min-height: 60px;
  }

  .bottom-nav__icon {
    font-size: 26px;
  }

  .bottom-nav__label {
    font-size: var(--font-size-body-sm);
  }
}

// Landscape orientation on mobile - compact mode
@media (max-height: 500px) and (orientation: landscape) {
  .bottom-nav__tabs {
    padding: var(--spacing-1) var(--spacing-3);
  }

  .bottom-nav__tabs .q-tab {
    min-height: 48px;
    padding: var(--spacing-1) var(--spacing-2);
    gap: 2px;
  }

  .bottom-nav__icon {
    font-size: 20px;
  }

  .bottom-nav__label {
    font-size: var(--font-size-xs);
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .bottom-nav {
    border-top-width: 2px;
  }

  .bottom-nav__tabs .q-tab--active,
  .bottom-nav__tabs .bottom-nav__item--active {
    background: var(--color-primary);
    color: var(--color-white);
  }
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  .bottom-nav__tabs .q-tab {
    transition: none;
  }

  .bottom-nav__tabs .q-tab:active {
    transform: none;
  }
}
</style>
