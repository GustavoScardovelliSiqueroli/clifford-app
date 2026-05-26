<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-grey-7 q-px-sm q-py-sm shadow-1">
      <q-tabs
        no-caps
        align="justify"
        active-color="primary"
        indicator-color="transparent"
        class="rounded-borders"
      >
        <q-route-tab
          :ripple="false"
          class="modern-tab"
          to="/"
          name="home"
          icon="home"
          label="Início"
        />

        <q-route-tab
          :ripple="false"
          class="modern-tab"
          to="/clientes"
          name="clients"
          icon="group"
          label="Clientes"
        />

        <q-route-tab
          :ripple="false"
          class="modern-tab"
          to="/cobrancas"
          name="charges"
          icon="receipt_long"
          label="Cobranças"
        />

        <q-route-tab
          :ripple="false"
          class="modern-tab"
          to="/configuracoes"
          name="settings"
          icon="tune"
          label="Ajustes"
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts"></script>

<style scoped>
.modern-tab {
  flex: 1 1 0%;
  min-width: 0;
  border-radius: 16px;
  margin-top: 5px;
  transition:
    transform 0.22s ease,
    background-color 0.22s ease;
}

/* remove a cara material do "underline" */
.modern-tab.q-tab--active {
  transform: translateY(-4px) scale(1.02);
  background: rgba(0, 0, 0, 0.06);
}
</style>
