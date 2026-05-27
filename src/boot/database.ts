import { boot } from 'quasar/wrappers';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { runMigrations } from 'src/database/migrations'; // ← adicionar

const sqlite = new SQLiteConnection(CapacitorSQLite);
export { sqlite };

export default boot(async () => {
  if (Capacitor.getPlatform() === 'web') {
    const { defineCustomElements } = await import('jeep-sqlite/loader');
    defineCustomElements(window);

    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });

    const jeepEl = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepEl);
    await customElements.whenDefined('jeep-sqlite');
    await new Promise((r) => setTimeout(r, 200));
    await sqlite.initWebStore();
  }

  await runMigrations(); // ← adicionar
});
