# Clifford App

Aplicativo mobile **local-first** para controle financeiro e de cobranças do **Clifford Ateliê**.
Roda no dispositivo (sem backend), permite registrar clientes e cobranças, gerar a imagem do
lembrete e **enviar via WhatsApp** — com controle de quais cobranças caem em cada dia útil.

> 🔒 **Local-first:** os dados ficam no dispositivo. Não há servidor nem envio de dados para
> terceiros; a sincronização/backup é feito por **exportação e importação de JSON**.

## ✨ Funcionalidades

- Cadastro de clientes e lançamentos financeiros.
- Geração de **imagem de cobrança** pronta para envio.
- **Envio via WhatsApp** para os clientes.
- Organização de cobranças por **dia útil**.
- **Export/Import JSON** para backup e portabilidade dos dados.

## 🧱 Tecnologias

- **Quasar Framework** (Vue 3 + TypeScript)
- **Capacitor** (build mobile)
- Estado local no dispositivo (sem API)

## 📱 Screenshots

<!-- Adicione prints/GIF do app aqui (ajuda MUITO quem avalia o repositório) -->
| Tela inicial | Nova cobrança | Envio no WhatsApp |
| :---: | :---: | :---: |
| _em breve_ | _em breve_ | _em breve_ |

## 🧭 Decisões de projeto

- **Por que local-first?** O cliente é um ateliê pequeno, que precisa funcionar mesmo sem internet
  e não quer depender de infraestrutura. Menos custo, mais privacidade e zero latência.
- **Backup por JSON:** portabilidade simples, sem lock-in de plataforma.
- **WhatsApp como canal:** é onde o cliente final já está; evita construir um app de mensagens.

## 🚀 Como rodar

Requer **Node.js** e o CLI do Quasar.

```bash
git clone https://github.com/GustavoScardovelliSiqueroli/clifford-app.git
cd clifford-app
npm install        # ou yarn / pnpm

quasar dev         # desenvolvimento
quasar build       # build de produção
```

Para o build mobile, use o Capacitor:
```bash
quasar build -m capacitor -T android   # ou ios
```

## 🧹 Qualidade

```bash
npm run lint
npm run format
```
