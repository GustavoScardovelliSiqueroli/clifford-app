<template>
  <q-page class="fit column bg-primary align-center justify-center">
    <div class="row align-center justify-center">
      <q-btn color="negative" label="RESET DB" @click="resetDb"></q-btn>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { getDB, saveDB } from 'src/database/connection';
import { runMigrations } from 'src/database/migrations';

async function resetDb() {
  const db = await getDB();
  await db.execute('DROP TABLE clientes');
  await db.execute('DROP TABLE ajustes');
  await db.execute('DROP TABLE mensalidade_config');
  await db.execute('DROP TABLE cobrancas');
  await db.execute('DROP TABLE cobrancas_extras');

  await saveDB();
  await runMigrations();
  await saveDB();
}
</script>
