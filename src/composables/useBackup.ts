import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getDB, closeConnection } from 'src/database/connection';

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

export function useBackup() {
  const $q = useQuasar();
  const exportando = ref(false);
  const importando = ref(false);

  function notificar(tipo: 'positive' | 'negative', mensagem: string) {
    $q.notify({
      type: tipo,
      message: mensagem,
      icon: tipo === 'positive' ? 'check_circle' : 'error',
      progress: true,
    });
  }

  async function exportarBackup(): Promise<void> {
    if (exportando.value) return;
    exportando.value = true;

    try {
      const db = await getDB();
      const result = await db.exportToJson('full');
      if (!result.export) throw new Error('Export retornou vazio');

      const dataStr = JSON.stringify(result.export);
      const hoje = new Date().toISOString().split('T')[0] as string;
      const fileName = `clifford-backup-${hoje}.json`;

      const platform = Capacitor.getPlatform();

      if (platform === 'web') {
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        notificar('positive', 'Backup exportado com sucesso!');
        return;
      }

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: utf8ToBase64(dataStr),
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'Backup Clifford Ateliê',
        url: saved.uri,
        dialogTitle: 'Compartilhar backup',
      });

      notificar('positive', 'Backup exportado com sucesso!');

      Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Erro ao exportar backup:', error);
      notificar('negative', 'Erro ao exportar backup. Tente novamente.');
      throw error;
    } finally {
      exportando.value = false;
    }
  }

  async function importarBackup(jsonStr: string): Promise<void> {
    if (importando.value) return;
    importando.value = true;

    try {
      const parsed = JSON.parse(jsonStr);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('database' in parsed) ||
        !('tables' in parsed)
      ) {
        throw new Error('Arquivo de backup inválido');
      }

      await CapacitorSQLite.deleteDatabase({ database: 'atelieDB' });

      await closeConnection();

      await CapacitorSQLite.importFromJson({ jsonstring: jsonStr });

      notificar('positive', 'Backup restaurado com sucesso!');
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      notificar('negative', 'Erro ao restaurar backup. Verifique o arquivo.');
      throw error;
    } finally {
      importando.value = false;
    }
  }

  return { exportarBackup, importarBackup, exportando, importando };
}
