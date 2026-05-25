<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
    <q-footer class="bg-white text-primary">
      <q-tabs no-caps active-color="primary" indicator-color="transparent" class="target-tabs">
        <q-route-tab to="/home" name="home" icon="home" label="Início" />
        <q-route-tab to="/busca" name="search" icon="search" label="Buscar" />
        <q-route-tab to="/perfil" name="profile" icon="person" label="Perfil" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts"></script>
