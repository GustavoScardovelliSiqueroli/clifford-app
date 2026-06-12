import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/clientes',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ClientsPage.vue') }],
  },
  {
    path: '/cobrancas',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ChargesPage.vue') }],
  },
  {
    path: '/configuracoes',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ConfigPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
