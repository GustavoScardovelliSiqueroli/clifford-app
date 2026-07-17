# Backup e Restauração do Banco de Dados

> Documento de especificação e guia de implementação para exportar e importar o banco de dados SQLite do aplicativo.

---

## 1. Visão Geral

Permitir que o usuário:

1. **Exporte** o banco de dados completo como um arquivo `.json`, compartilhável via WhatsApp, Drive, email, etc.
2. **Importe** um arquivo `.json` de backup para restaurar os dados no lugar do banco atual.

---

## 2. Stack Técnica

### 2.1 Dependências (já instaladas)

| Pacote                        | Versão | Uso                                                        |
| ----------------------------- | ------ | ---------------------------------------------------------- |
| `@capacitor-community/sqlite` | ^8.1.0 | `exportToJson()` / `importFromJson()` / `deleteDatabase()` |
| `@capacitor/filesystem`       | ^8.1.2 | Salvar o arquivo de backup no cache                        |
| `@capacitor/share`            | ^8.0.1 | Compartilhar o arquivo via share sheet nativo              |

### 2.2 API do Plugin SQLite

```ts
// Export — retorna JSON completo do banco
const json: capSQLiteJson = await db.exportToJson('full');

// Import — recria o banco a partir do JSON
const result: capSQLiteChanges = await CapacitorSQLite.importFromJson({
  jsonstring: stringifiedJson,
});

// Deletar banco (necessário antes de importar)
await CapacitorSQLite.deleteDatabase({ database: 'atelieDB' });
```

---

## 3. Estrutura do Backup

O `exportToJson('full')` retorna um objeto `JsonSQLite` com a estrutura:

```json
{
  "database": "atelieDB",
  "version": 1,
  "encrypted": false,
  "mode": "full",
  "tables": [
    {
      "name": "clientes",
      "schema": [
        { "cid": 0, "name": "id", "type": "INTEGER", "notnull": true, "pk": 1 },
        { "cid": 1, "name": "nome", "type": "TEXT", "notnull": true },
        { "cid": 2, "name": "telefone", "type": "TEXT" }
      ],
      "indexes": [],
      "triggers": [],
      "values": [
        [1, "Maria Silva", "(11) 99999-9999"],
        [2, "João Santos", "(11) 88888-8888"]
      ]
    },
    {
      "name": "cobrancas",
      "schema": [...],
      "values": [...]
    }
  ],
  "views": []
}
```

O arquivo salvo em disco será esse JSON completo, compacto e portável.

---

## 4. Composable

### `src/composables/useBackup.ts`

#### Assinatura

```ts
export function useBackup(): {
  exportarBackup: () => Promise<void>;
  importarBackup: () => Promise<void>;
  exportando: Ref<boolean>;
  importando: Ref<boolean>;
};
```

---

## 5. Exportação (Backup)

### Fluxo detalhado

```
exportarBackup()
  │
  ├─ 1. Obter conexão ativa: getDB()
  │
  ├─ 2. Exportar JSON: db.exportToJson('full')
  │    └─ Retorna { export: { database, version, tables, views } }
  │
  ├─ 3. Serializar: JSON.stringify(result.export)
  │
  ├─ 4. Salvar no cache: Filesystem.writeFile({
  │      path: `clifford-backup-${data}.json`,
  │      data: jsonString,
  │      directory: Directory.Cache
  │    })
  │    └─ Retorna { uri: 'file:///.../clifford-backup-2026-07-17.json' }
  │
  ├─ 5. Compartilhar: Share.share({
  │      title: 'Backup Clifford Ateliê',
  │      url: saved.uri,
  │      dialogTitle: 'Compartilhar backup'
  │    })
  │
  └─ 6. Limpar cache (async): Filesystem.deleteFile(...)
```

### Tratamento de erros

| Situação                   | Ação                                                |
| -------------------------- | --------------------------------------------------- |
| Falha ao exportar          | Toast de erro, log no console                       |
| Falha ao salvar no cache   | Toast de erro                                       |
| Usuário fechou share sheet | `AbortError` ignorado (como no compartilhar imagem) |

### Código esqueleto

```ts
import { getDB, sqlite } from 'src/database/connection';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

async function exportar(): Promise<void> {
  const db = await getDB();
  const json = await db.exportToJson('full');
  if (!json.export) throw new Error('Export retornou vazio');

  const dataStr = JSON.stringify(json.export);
  const hoje = new Date().toISOString().split('T')[0];
  const fileName = `clifford-backup-${hoje}.json`;

  const saved = await Filesystem.writeFile({
    path: fileName,
    data: dataStr,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'Backup Clifford Ateliê',
    url: saved.uri,
    dialogTitle: 'Compartilhar backup',
  });

  Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
}
```

### Nome do arquivo

`clifford-backup-YYYY-MM-DD.json`

Inclui data para facilitar identificação de versões.

---

## 6. Importação (Restore)

### Fluxo detalhado

```
importarBackup()
  │
  ├─ 1. Criar <input type="file" accept=".json"> oculto
  │    └─ Disparar click()
  │
  ├─ 2. Usuário seleciona arquivo .json
  │    └─ FileReader.readAsText(arquivo)
  │
  ├─ 3. Validar JSON: JSON.parse() → verificar se tem "tables"
  │    └─ Se inválido → erro "Arquivo de backup inválido"
  │
  ├─ 4. Confirmar com usuário:
  │    "Tem certeza? Todos os dados atuais serão substituídos."
  │
  ├─ 5. Fechar conexão atual:
  │    await sqlite.closeConnection(DB_NAME, false)
  │
  ├─ 6. Deletar banco atual:
  │    await CapacitorSQLite.deleteDatabase({ database: 'atelieDB' })
  │
  ├─ 7. Importar JSON:
  │    await CapacitorSQLite.importFromJson({ jsonstring: dataStr })
  │
  ├─ 8. Limpar variável global 'db' da connection.ts:
  │    db = null  (força recriação na próxima getDB())
  │
  └─ 9. Reload da página:
       window.location.reload()
```

### Validação do arquivo

```ts
function validarJson(data: unknown): data is JsonSQLite {
  return (
    typeof data === 'object' &&
    data !== null &&
    'database' in data &&
    'tables' in data &&
    Array.isArray((data as any).tables)
  );
}
```

### Diálogo de confirmação

Antes de restaurar, exibir um `ClDialog` perguntando:

> **Tem certeza?**
> Todos os dados atuais (clientes, cobranças, configurações) serão substituídos pelos dados do backup.

Ações: `[Cancelar]` | `[Restaurar]`

### Tratamento de erros

| Situação                              | Ação                               |
| ------------------------------------- | ---------------------------------- |
| Arquivo selecionado não é JSON válido | Toast "Arquivo inválido"           |
| JSON não é um backup válido           | Toast "Arquivo de backup inválido" |
| Falha ao deletar banco                | Toast de erro, interrompe          |
| Falha ao importar JSON                | Toast de erro, interrompe          |

---

## 7. UI na ConfigPage

### Layout da nova seção

Adicionar entre o card de configurações (salvar) e a zona de perigo (reset):

```html
<!-- Backup & Restore -->
<ClPageCard variant="elevated" class="backup-card">
  <div class="backup-section">
    <div class="backup-header">
      <q-icon name="folder" size="24px" color="primary" />
      <div>
        <h3 class="backup-title">Backup e Restauração</h3>
        <p class="backup-description">
          Exporte uma cópia do banco de dados ou restaure a partir de um backup
        </p>
      </div>
    </div>

    <div class="backup-actions">
      <ClButton
        variant="primary"
        icon="file_upload"
        label="Exportar Backup"
        :loading="exportando"
        @click="exportarBackup"
        size="lg"
        full-width
      />
      <ClButton
        variant="outline"
        icon="file_download"
        label="Restaurar Backup"
        :loading="importando"
        @click="confirmarImportacao"
        size="lg"
        full-width
      />
    </div>
  </div>
</ClPageCard>
```

### Diálogo de confirmação de restore

```html
<ClDialog v-model="dialogImport" title="Restaurar Backup" show-footer="auto">
  <p class="dialog-message">
    <strong>ATENÇÃO:</strong> Todos os dados atuais serão substituídos pelos dados do backup. Esta
    ação <strong>não pode ser desfeita</strong>.
  </p>
  <p class="dialog-message">Deseja continuar?</p>

  <template #footer>
    <ClButton variant="ghost" @click="dialogImport = false">Cancelar</ClButton>
    <ClButton
      variant="destructive"
      label="Restaurar"
      :loading="importando"
      @click="importarBackup"
    />
  </template>
</ClDialog>
```

---

## 8. Tratamento da Conexão

A `connection.ts` atual mantém uma variável `db` global. Após deletar e importar o banco, precisamos resetá-la para que a próxima `getDB()` crie uma nova conexão.

**Modificação necessária em `connection.ts`:**

Exportar uma função para resetar a conexão:

```ts
// Atual (linha 10-11)
let db: SQLiteDBConnection | null = null;

// Adicionar
export function resetConnection(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

Ou, mais simples, no composable de backup, após o `importFromJson`, setar a variável para `null`. Mas como ela não é exportada, precisamos de um export.

**Solução simples:** adicionar `resetConnection()` em `connection.ts`.

---

## 9. Zona de Perigo

O botão de "RESETAR BANCO DE DADOS" deve ser mantido, mas com um aviso mais claro:

> **Zona de Perigo — Apenas para Desenvolvimento**
> Esta ação apaga todos os dados do sistema.
> Use apenas para testes durante o desenvolvimento.

Isso deixa claro que em produção o usuário deve usar **Backup/Restore** para gerenciar os dados.

---

## 10. Checklist de Implementação

### Fase 1: Backend (Composable)

- [ ] Criar `src/composables/useBackup.ts`
- [ ] Função `exportarBackup()` — export JSON + salvar cache + compartilhar
- [ ] Função `importarBackup()` — file picker + validar JSON + confirmar + importar
- [ ] Adicionar `resetConnection()` em `src/database/connection.ts`

### Fase 2: UI (ConfigPage)

- [ ] Adicionar seção "Backup e Restauração" com dois botões
- [ ] Adicionar diálogo de confirmação para restore
- [ ] Estilos da seção de backup

### Fase 3: Validação

- [ ] `npm run format`
- [ ] `npm run lint`
- [ ] `npx vue-tsc --noEmit`
- [ ] `npm run build`
- [ ] Testar exportação + compartilhamento em device/emulador
- [ ] Testar importação (arquivo exportado anteriormente)

---

## 11. Arquivos Envolvidos

| Arquivo                        | Ação                                                |
| ------------------------------ | --------------------------------------------------- |
| `src/composables/useBackup.ts` | **CRIAR** — lógica de exportar/importar             |
| `src/database/connection.ts`   | **EDITAR** — adicionar `resetConnection()`          |
| `src/pages/ConfigPage.vue`     | **EDITAR** — nova seção backup + diálogo de restore |

---

## 12. Referências

| Recurso                                      | Link                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| `@capacitor-community/sqlite` — exportToJson | [docs](https://github.com/capacitor-community/sqlite) |
| `@capacitor/filesystem` — writeFile          | [docs](https://capacitorjs.com/docs/apis/filesystem)  |
| `@capacitor/share` — share                   | [docs](https://capacitorjs.com/docs/apis/share)       |
| `connection.ts`                              | `src/database/connection.ts`                          |
| `ConfigPage.vue`                             | `src/pages/ConfigPage.vue`                            |

---

> **Nota para implementação:** Siga os padrões de `AGENTS.md` e `ChargesPage.vue`. Use CSS Variables (design tokens) e importe UI components do barrel `src/components/ui`.
