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

| Item         | Valor                                  |
| ------------ | -------------------------------------- |
| Background   | `#f5f5f5` (body), `#000000` (header)   |
| Largura      | 440px                                  |
| Altura       | Variável (conteúdo ~900px)             |
| Formato      | PNG                                    |
| Cor do texto | `#ffffff` no header, `#1a1a1a` no body |
| Fonte        | `Roboto`, Helvetica, Arial, sans-serif |

### 2.2 Estrutura visual (top-down)

```
┌──────────────────────────────────────┐
│                                      │
│            ┌───────────┐             │
│            │           │             │
│            │   LOGO    │  ← 250x250  │
│            │           │    central. │
│            └───────────┘             │
│                                      │
│  Artes Plásticas / Artes Visuais     │
│  Cursos: Aquarela / Desenho /        │
│  Pintura em Tela                     │
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
│  Status: ⚫ Pago em 05/07/2026       │  ← só aparece se pago
│                                      │
│  ┌──────────────────────────┐        │  ← fundo #f0f0f0
│  │  Clifford Ateliê • desde 1995     │
│  │  (11) 99999-9999                  │
│  └──────────────────────────┘        │
└──────────────────────────────────────┘
```

### 2.3 Regras de layout

- **Logo**: redimensionada para ~250px de largura, centralizada no topo (altura proporcional)
- **Categoria**: "Artes Plásticas / Artes Visuais" em branco, negrito, size 15px
- **Sub-cursos**: "Cursos: Aquarela / Desenho / Pintura em Tela" em cinza, size 12px
- **Linha divisória**: sutil, separa cabeçalho do conteúdo
- **Dados do cliente**: alinhados à esquerda
- **Valores**: mensalidade linha separada, cada extra em sua linha, total em destaque
- **Status**: badge visual "Pago em DD/MM/AAAA" (só aparece se paga)
- **Rodapé**: "Clifford Ateliê • desde 1995" + WhatsApp
- **Padding interno**: 32px nas laterais, 32px no topo/base

---

## 3. Stack Técnica

### 3.1 Dependências

**Obrigatórias:**

```
@capacitor/filesystem   → salvar imagem temporária
@capacitor/share        → share sheet nativo Android
```

**Sem dependências de renderização:** a imagem é gerada via **Canvas 2D API**, sem necessidade de bibliotecas externas.

### 3.2 Compatibilidade

- **Capacitor WebView** (Android): suporta Canvas 2D API e Web Share API
- **Dev mode (browser)**: funciona em Chrome, Firefox, Safari para testes
- O compartilhamento usa `@capacitor/share` com URI de arquivo salvo em cache

---

## 4. Arquivos Envolvidos

| Arquivo                                      | Ação                                              |
| -------------------------------------------- | ------------------------------------------------- |
| `src/composables/useCompartilharCobranca.ts` | Lógica de gerar imagem (Canvas 2D) + compartilhar |
| `src/pages/ChargesPage.vue`                  | Botão "Compartilhar" na listagem                  |

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
  ├─ 1. Carregar logo como base64 (fetch → blob → base64)
  │
  ├─ 2. Desenhar imagem em Canvas 2D:
  │    ├─ Cabeçalho preto: logo + categoria + sub-cursos
  │    ├─ Corpo branco: dados, valores, status, rodapé
  │    └─ canvas.toDataURL('image/png') → dataURL
  │
  ├─ 3. Salvar no cache via @capacitor/filesystem
  │
  ├─ 4. Compartilhar via @capacitor/share
  │    └─ Share.share({ url: saved.uri })
  │
  └─ 5. Remover arquivo temporário do cache
```

#### Tratamento da Logo

A logo está em `public/assets/logo.png` (499x500, RGBA, fundo transparente, escrita branca).

**Importante**: para aparecer no fundo preto da imagem gerada, a logo é carregada via `fetch`, convertida para base64, e então desenhada no Canvas via `drawImage()`.

Detalhes:

- A logo é carregada como `HTMLImageElement` a partir de uma data URL base64
- Desenhada no topo do Canvas, centralizada, com largura de 250px (altura proporcional)
- Se a logo não carregar, a seção é pulada (fallback seguro)

---

## 6. Layout Canvas da Imagem

A imagem é desenhada via **Canvas 2D API**. Abaixo está o layout renderizado, que serve como referência visual para o código em `useCompartilharCobranca.ts`:

```html
<div
  style="width:440px; background:#f5f5f5; font-family:Roboto, Helvetica, Arial, sans-serif; color:#1a1a1a;"
>
  <!-- Cabeçalho preto -->
  <div style="background:#000000; padding:32px 32px 0; text-align:center;">
    <!-- Logo -->
    <div style="margin-bottom:24px;">
      <img src="{logoBase64}" style="width:250px; height:auto;" alt="Clifford Ateliê" />
    </div>

    <!-- Categoria -->
    <p style="font-size:15px; font-weight:700; margin:0 0 4px; color:#ffffff;">
      Artes Plásticas / Artes Visuais
    </p>

    <!-- Sub-cursos -->
    <p style="font-size:12px; margin:0 0 24px; color:#cccccc;">
      Cursos: Aquarela / Desenho / Pintura em Tela
    </p>
  </div>

  <!-- Corpo branco -->
  <div style="padding:12px 32px 0;">
    <!-- Dados do aluno -->
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 4px; font-size:15px; color:#555555;">
        <strong style="color:#555555;">Aluno:</strong>
        <span style="color:#1a1a1a;"> {nome}</span>
      </p>
      <p style="margin:0 0 4px; font-size:15px; color:#555555;">
        <strong>Telefone:</strong>
        <span style="color:#1a1a1a;"> {telefone}</span>
      </p>
      <p style="margin:0 0 4px; font-size:15px; color:#555555;">
        <strong>Competência:</strong>
        <span style="color:#1a1a1a;"> {mes} / {ano}</span>
      </p>
      <p style="margin:0; font-size:15px; color:#555555;">
        <strong>Vencimento:</strong>
        <span style="color:#1a1a1a;"> {vencimento_formatado}</span>
      </p>
    </div>

    <!-- Divisória -->
    <hr style="border:none; border-top:1px solid #e0e0e0; margin:0 0 16px;" />

    <!-- Valores -->
    <div style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:4px;">
        <span style="color:#555555;">Mensalidade</span>
        <span style="color:#1a1a1a;">R$ {valor_mensalidade}</span>
      </div>
      <!-- PARA CADA EXTRA: -->
      <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:2px;">
        <span style="color:#888888;">{extra.motivo}</span>
        <span style="color:#fbac25;">R$ {extra.valor}</span>
      </div>
      <hr style="border:none; border-top:1px dashed #cccccc; margin:8px 0;" />
      <div style="display:flex; justify-content:space-between; font-size:20px; font-weight:700;">
        <span style="color:#1a1a1a;">TOTAL</span>
        <span style="color:#fbac25;">R$ {total}</span>
      </div>
    </div>

    <!-- Status -->
    <div style="text-align:center; margin-bottom:24px;">
      <span
        style="display:inline-block; padding:4px 16px; border-radius:14px; font-size:13px; font-weight:700; {status_style}"
      >
        {status_texto}
      </span>
    </div>

    <!-- Rodapé (fundo cinza) -->
    <div style="background:#f0f0f0; padding:16px 32px 12px; text-align:center;">
      <p style="margin:0 0 2px; font-size:14px; font-weight:700; color:#1a1a1a;">
        Clifford Ateliê • desde 1995
      </p>
      <p style="margin:0; font-size:12px; color:#888888;">WhatsApp: {telefone_atelie}</p>
    </div>
  </div>
</div>
```

### Observações sobre o Canvas:

- O `drawText()` helper usa `ctx.fillText()` com as opções fornecidas (color, size, bold, align)
- O `drawMultiline()` helper quebra texto em `\n` e desenha linha a linha
- O header (logo + textos) tem fundo preto (`#000000`), o body tem fundo cinza claro (`#f5f5f5`)
- Valores em destaque usam a cor de acento `#fbac25`
- O telefone do ateliê é fixo em `FONE_CLIFFORD`

---

## 7. Integração na Página

### `ChargesPage.vue` — Botão Compartilhar

O botão "Compartilhar" está no bloco `charge-card__actions` de cada cobrança:

```vue
<ClButton
  variant="ghost"
  size="sm"
  icon="share"
  label="Compartilhar"
  :loading="gerando"
  @click="handleCompartilhar(cobranca)"
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
  ├─ Desenha no Canvas 2D (cabeçalho preto + corpo branco)
  ├─ canvas.toDataURL('image/png')
  ├─ Salva no cache via @capacitor/filesystem
  │
  ▼
@capacitor/share → Share Sheet nativo
  │
  └─ Android → Share Sheet → WhatsApp
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

- [ ] `src/composables/useCompartilharCobranca.ts` — Composable com Canvas 2D + Capacitor
- [ ] `src/pages/ChargesPage.vue` — Botão "Compartilhar" em cada cobrança
- [ ] Carregar extras antes de compartilhar via `cobrancaStore.carregarExtras()`
- [ ] Dependências: `@capacitor/filesystem`, `@capacitor/share`

### Validação

- [ ] `npm run lint`
- [ ] `npm run format`
- [ ] `npx vue-tsc --noEmit`
- [ ] `npm run build`
- [ ] Testar em device Android (ou emulador)
- [ ] Verificar qualidade da imagem gerada
- [ ] Verificar compartilhamento via WhatsApp

---

## 11. Referências

| Recurso                          | Link                                                                      |
| -------------------------------- | ------------------------------------------------------------------------- |
| Canvas 2D API (MDN)              | https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D |
| Capacitor Share Plugin           | https://capacitorjs.com/docs/apis/share                                   |
| Capacitor Filesystem Plugin      | https://capacitorjs.com/docs/apis/filesystem                              |
| Logo do projeto                  | `public/assets/logo.png` (499x500, RGBA, transparente)                    |
| Cores do sistema (design tokens) | `src/css/design-tokens.scss`                                              |
| Cores para a imagem              | header `#000000`, body `#f5f5f5`, texto `#1a1a1a`, destaque `#fbac25`     |

---

## 12. Notas Finais

- A logo **já está branca com fundo transparente**, ideal para o fundo preto do header — não precisa de tratamento adicional.
- A proporção 500px largura é desenhada em Canvas com scale 2x para ficar nítida em displays retina.
- O Canvas usa scale 2x (`ctx.scale(2,2)`) e o canvas real tem o dobro da resolução, garantindo qualidade.
- O compartilhamento usa `@capacitor/share` com arquivo salvo no cache do sistema — não depende de Web Share API.
- O telefone do ateliê é fixo em `FONE_CLIFFORD` dentro do composable.

---

> **Nota para implementação:** Siga os padrões do `AGENTS.md` e `ClientsPage.vue`. Use CSS Variables (design tokens) onde aplicável, importe UI components do barrel `src/components/ui`.
