# Geração de Imagem da Cobrança (Compartilhamento WhatsApp)

> Documento de especificação e guia de implementação para a funcionalidade de gerar uma imagem da cobrança e compartilhá-la via WhatsApp.

---

## 1. Visão Geral

Criar um botão "Compartilhar" em cada cobrança na tela de Cobranças que:

1. Gera uma imagem PNG com layout do comprovante (fundo preto, logo, dados da cobrança)
2. Abre o share sheet do Android com foco em WhatsApp para envio da imagem

---

## 2. Layout da Imagem (Design)

### 2.1 Especificações visuais

| Item         | Valor                       |
| ------------ | --------------------------- |
| Background   | `#000000` (preto sólido)    |
| Largura      | 800px                       |
| Altura       | Variável (conteúdo ~1100px) |
| Formato      | PNG                         |
| Cor do texto | `#FFFFFF` (branco)          |
| Fonte        | `Roboto`, sans-serif        |

### 2.2 Estrutura visual (top-down)

```
┌──────────────────────────────────────┐
│                                      │
│              ┌───────┐               │
│              │       │               │
│              │ LOGO  │  ← 250x250px  │
│              │       │    centralizado│
│              └───────┘               │
│                                      │
│    ─── CLIFFORD ATELIÊ ───           │
│                                      │
│  Curso: Artes Plásticas /            │
│  Artes Visuais / Desenho /           │
│  Aquarela / Pintura em Tela          │
│                                      │
│  ───────────────────────────         │
│                                      │
│  Aluno:      Maria Silva             │
│  Telefone:   (11) 99999-9999         │
│  Competência: Julho / 2026           │
│  Vencimento:  05/07/2026             │
│                                      │
│  Mensalidade:          R$ 150,00     │
│  Extra - Tela nova     R$  30,00     │
│                          ───────     │
│  TOTAL:                R$ 180,00     │
│                                      │
│  Status: ⚫ Pendente                 │
│                                      │
│  ───────────────────────────         │
│                                      │
│  Clifford Ateliê                     │
│  (11) 99999-9999                     │
│                                      │
└──────────────────────────────────────┘
```

### 2.3 Regras de layout

- **Logo**: redimensionada para ~250x250, centralizada no topo
- **Título do ateliê**: abaixo da logo, centralizado
- **Curso**: texto fixo em 2-3 linhas, centralizado
- **Linha divisória**: sutil, separa cabeçalho do conteúdo
- **Dados do cliente**: alinhados à esquerda
- **Valores**: mensalidade linha separada, cada extra em sua linha com indentação, total em destaque
- **Status**: badge visual (Pendente ou Pago)
- **Rodapé**: informações de contato do ateliê
- **Padding interno**: 40px nas laterais, 32px no topo/base

---

## 3. Stack Técnica

### 3.1 Dependências

**Obrigatória:**

```
html-to-image  ^1.11+   → render HTML → PNG
```

**Opcional (se Web Share API não for suficiente):**

```
@capacitor/share        → share sheet nativo Android
@capacitor/filesystem   → salvar imagem temporária para compartilhar
```

### 3.2 Compatibilidade

- **Capacitor WebView** (Android): Chrome WebView moderno, suporta Web Share API e html-to-image
- **Dev mode (browser)**: funciona em Chrome, Firefox, Safari para testes
- O `navigator.share()` com arquivos funciona no Android Chrome 61+

---

## 4. Arquivos Envolvidos

| Arquivo                                      | Ação                                              |
| -------------------------------------------- | ------------------------------------------------- |
| `package.json`                               | Adicionar `html-to-image`                         |
| `src/composables/useCompartilharCobranca.ts` | **CRIAR** — lógica de gerar imagem + compartilhar |
| `src/pages/ChargesPage.vue`                  | **EDITAR** — adicionar botão Compartilhar         |
| (se necessário) `@capacitor/share`           | **INSTALAR** + `npx cap sync`                     |

---

## 5. Especificação do Composable

### `src/composables/useCompartilharCobranca.ts`

#### Assinatura

```ts
interface CobrancaParaCompartilhar {
  id: number;
  nome: string;
  telefone: string;
  valor_mensalidade: number;
  total_extras: number;
  vencimento: string; // YYYY-MM-DD
  data_pagamento: string | null;
  competencia: string; // YYYY-MM
  extras?: { motivo: string; valor: number }[];
}

function useCompartilharCobranca(): {
  compartilhar: (cobranca: CobrancaParaCompartilhar) => Promise<void>;
  gerando: Ref<boolean>;
};
```

#### Fluxo interno

```
compartilhar(cobranca)
  │
  ├─ 1. Criar elemento <div> oculto no DOM
  │    └─ renderTemplate(cobranca) → HTML estruturado
  │
  ├─ 2. Carregar logo como base64 (fetch + canvas)
  │    └─ fetch('/assets/logo.png') → blob → base64
  │
  ├─ 3. html-to-image: toPng(elemento, { pixelRatio: 2 })
  │    └─ retorna dataURL base64
  │
  ├─ 4. Converter dataURL para File
  │    └─ dataURL → Blob → File("cobranca-{id}.png", "image/png")
  │
  ├─ 5. Compartilhar via Web Share API
  │    └─ navigator.share({
  │         files: [file],
  │         title: 'Cobrança Clifford Ateliê',
  │       })
  │
  └─ 6. Limpar elemento oculto do DOM
```

#### Tratamento da Logo

A logo está em `public/assets/logo.png` (499x500, RGBA, fundo transparente, escrita branca).

**Importante**: para aparecer no fundo preto da imagem gerada, a logo precisa ser carregada e convertida para base64 para ser embutida como `<img src="data:image/png;base64,...">` no template HTML.

```ts
async function carregarLogoBase64(): Promise<string> {
  const response = await fetch('/assets/logo.png');
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
```

---

## 6. Template HTML da Imagem

O template deve ser montado como uma string HTML completa com estilos inline (para funcionar no `html-to-image`):

```html
<div
  style="width:800px; background:#000000; padding:32px 40px; font-family:Roboto, sans-serif; color:#ffffff;"
>
  <!-- Logo -->
  <div style="text-align:center; margin-bottom:24px;">
    <img src="{logoBase64}" style="width:250px; height:auto;" alt="Clifford Ateliê" />
  </div>

  <!-- Título -->
  <h1
    style="text-align:center; font-size:18px; font-weight:700; letter-spacing:2px; margin:0 0 16px; text-transform:uppercase; color:#ffffff;"
  >
    Clifford Ateliê
  </h1>

  <!-- Curso -->
  <p style="text-align:center; font-size:14px; line-height:1.5; margin:0 0 24px; color:#cccccc;">
    Curso: Artes Plásticas / Artes Visuais / Desenho / Aquarela / Pintura em Tela
  </p>

  <!-- Divisória -->
  <hr style="border:none; border-top:1px solid #333333; margin:0 0 24px;" />

  <!-- Dados do aluno -->
  <div style="margin-bottom:20px;">
    <p style="margin:0 0 4px; font-size:14px; color:#ffffff;"><strong>Aluno:</strong> {nome}</p>
    <p style="margin:0 0 4px; font-size:14px; color:#ffffff;">
      <strong>Telefone:</strong> {telefone}
    </p>
    <p style="margin:0 0 4px; font-size:14px; color:#ffffff;">
      <strong>Competência:</strong> {mes} / {ano}
    </p>
    <p style="margin:0; font-size:14px; color:#ffffff;">
      <strong>Vencimento:</strong> {vencimento_formatado}
    </p>
  </div>

  <!-- Divisória -->
  <hr style="border:none; border-top:1px solid #333333; margin:0 0 20px;" />

  <!-- Valores -->
  <div style="margin-bottom:20px;">
    <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:4px;">
      <span style="color:#aaaaaa;">Mensalidade</span>
      <span style="color:#ffffff;">R$ {valor_mensalidade}</span>
    </div>
    <!-- PARA CADA EXTRA: -->
    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:2px;">
      <span style="color:#aaaaaa;">{extra.motivo}</span>
      <span style="color:#fbac25;">R$ {extra.valor}</span>
    </div>
    <hr style="border:none; border-top:1px dashed #555555; margin:8px 0;" />
    <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:700;">
      <span style="color:#ffffff;">TOTAL</span>
      <span style="color:#fbac25;">R$ {total}</span>
    </div>
  </div>

  <!-- Status -->
  <div style="text-align:center; margin-bottom:24px;">
    <span
      style="display:inline-block; padding:4px 16px; border-radius:12px; font-size:13px; font-weight:600; {status_style}"
    >
      {status_texto}
    </span>
  </div>

  <!-- Divisória -->
  <hr style="border:none; border-top:1px solid #333333; margin:0 0 20px;" />

  <!-- Rodapé -->
  <div style="text-align:center;">
    <p style="margin:0 0 2px; font-size:13px; font-weight:600; color:#ffffff;">Clifford Ateliê</p>
    <p style="margin:0; font-size:12px; color:#888888;">{telefone_atelie}</p>
  </div>
</div>
```

### Observações sobre estilos inline:

- O `html-to-image` respeita estilos CSS inline e regras @font-face
- Usar `display:flex` com `justify-content:space-between` para alinhar label + valor
- O `{telefone_atelie}` pode vir dos ajustes/config, ou ser fixo do estabelecimento

---

## 7. Integração na Página

### `ChargesPage.vue` — Botão Compartilhar

Adicionar no bloco `charge-card__actions`:

```vue
<ClButton
  variant="ghost"
  size="sm"
  icon="share"
  label="Compartilhar"
  @click="compartilhar(cobranca)"
  :disabled="cobrancaStore.loading"
/>
```

Import e função:

```ts
import { useCompartilharCobranca } from 'src/composables/useCompartilharCobranca';

const { compartilhar, gerando } = useCompartilharCobranca();

async function handleCompartilhar(c: CobrancaComCliente) {
  const extras = c.total_extras > 0 ? await cobrancaStore.carregarExtras(c.id as number) : [];
  await compartilhar({
    id: c.id as number,
    nome: c.nome,
    telefone: c.telefone,
    valor_mensalidade: c.valor_mensalidade,
    total_extras: c.total_extras ?? 0,
    vencimento: c.vencimento,
    data_pagamento: c.data_pagamento ?? null,
    competencia: c.competencia,
    extras: extras.map((e) => ({ motivo: e.motivo, valor: e.valor })),
  });
}
```

---

## 8. Fluxo de Dados

```
  Usuário clica em "Compartilhar"
          │
          ▼
  Buscar extras associados (se houver)
          │
          ▼
  useCompartilharCobranca.compartilhar()
          │
          ├─ Carrega logo base64 do /assets/logo.png
          ├─ Constrói template HTML
          ├─ Cria <div> oculta no <body>
          ├─ htmlToImage.toPng(div, { pixelRatio: 2 })
          ├─ Remove div do DOM
          ├─ Converte PNG → File
          │
          ▼
  navigator.share({ files: [file], title: 'Cobrança' })
          │
          ├─ Android → Share Sheet → WhatsApp
          │
          └─ Fallback se Web Share API não suportar files:
             Toaster "Imagem gerada" + botão "Baixar"
```

---

## 9. Tratamento de Erros e Casos de Borda

| Situação                            | Ação                                         |
| ----------------------------------- | -------------------------------------------- |
| Web Share API não suportada         | Gerar imagem e oferecer download manual      |
| Logo não carregou                   | Gerar sem logo (apenas texto do título)      |
| Cobrança sem extras                 | Ocultar seção de extras, total = mensalidade |
| Valor zerado                        | Exibir "R$ 0,00" normalmente                 |
| Vencimento inválido                 | Exibir data como está ou "—"                 |
| Dispositivo sem WhatsApp            | Share sheet mostra apps disponíveis          |
| Geração em andamento (duplo clique) | `gerando.value` desabilita botão             |

---

## 10. Checklist de Implementação

### Fase 1: Setup

- [ ] `npm install html-to-image`
- [ ] (opcional) `npm install @capacitor/share @capacitor/filesystem`
- [ ] (opcional) `npx cap sync`

### Fase 2: Composable

- [ ] Criar `src/composables/useCompartilharCobranca.ts`
- [ ] Função `carregarLogoBase64()`
- [ ] Função `montarTemplate(cobranca, logoBase64)`: montar HTML string
- [ ] Função `gerarImagem(elemento)`: htmlToImage.toPng
- [ ] Função `compartilhar(cobranca)`: fluxo completo
- [ ] Fallback para browsers sem Web Share

### Fase 3: Integração

- [ ] Adicionar botão "Compartilhar" em `ChargesPage.vue`
- [ ] Import e usar o composable
- [ ] Carregar extras antes de compartilhar

### Fase 4: Validação

- [ ] `npm run lint`
- [ ] `npm run format`
- [ ] `npx vue-tsc --noEmit`
- [ ] `npm run build`
- [ ] Testar em device Android (ou emulador)
- [ ] Verificar qualidade da imagem gerada
- [ ] Verificar compartilhamento via WhatsApp

---

## 11. Referências

| Recurso                          | Link                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| html-to-image (npm)              | https://www.npmjs.com/package/html-to-image                      |
| Web Share API (MDN)              | https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share |
| Can I Use — Web Share API        | https://caniuse.com/web-share                                    |
| Capacitor Share Plugin           | https://capacitorjs.com/docs/apis/share                          |
| Capacitor Filesystem Plugin      | https://capacitorjs.com/docs/apis/filesystem                     |
| Logo do projeto                  | `public/assets/logo.png` (499x500, RGBA, transparente)           |
| Cores do sistema (design tokens) | `src/css/design-tokens.scss`                                     |
| Cores para a imagem              | fundo `#000000`, texto `#ffffff`, destaque `#fbac25`             |

---

## 12. Notas Finais

- A logo **já está branca com fundo transparente**, ideal para o fundo preto — não precisa de tratamento adicional.
- A proporção 800px largura × altura variável é ideal para visualização no WhatsApp.
- O `pixelRatio: 2` no html-to-image garante imagem nítida em displays retina.
- Se o `navigator.share({ files })` não estiver disponível, fazer download automático como fallback:

```ts
if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title: 'Cobrança Clifford Ateliê' });
} else {
  // Fallback: download automático
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `cobranca-${cobranca.id}.png`;
  link.click();
}
```

---

> **Nota para implementação:** Siga os padrões do `AGENTS.md` e `ClientsPage.vue`. Use CSS Variables (design tokens) onde aplicável, importe UI components do barrel `src/components/ui`.
