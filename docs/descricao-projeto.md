
# Descrição do Projeto

Estou desenvolvendo um aplicativo Android local-first para gerenciamento financeiro de um ateliê de pintura.

O sistema será utilizado por apenas um usuário: o proprietário do ateliê, um homem de aproximadamente 60 anos com pouca familiaridade com tecnologia. Por isso, o aplicativo deve priorizar simplicidade extrema, clareza visual e facilidade de uso.

O aplicativo será totalmente offline, sem dependência de servidores, autenticação ou sincronização em nuvem.

## Objetivo Inicial

O principal objetivo do sistema é controlar a cobrança das mensalidades dos alunos do ateliê.

Além da mensalidade, o aplicativo também deve permitir registrar cobranças adicionais, como:

* valor da tela utilizada em um novo quadro;
* custos extras relacionados ao uso excessivo de tintas;
* outras cobranças complementares ocasionais.

## Plataforma e Arquitetura

### Plataforma

* Android

### Arquitetura

* Local-first
* Offline-first
* Sem backend
* Sem APIs externas obrigatórias
* Todos os dados armazenados localmente no dispositivo

## Stack Tecnológica

* Vue 3
* Quasar Framework
* Pinia
* Capacitor
* SQLite

## Características do Sistema

* Aplicativo mobile simples;
* Apenas um usuário;
* Sem login;
* Sem controle de permissões;
* Sem múltiplos perfis;
* Navegação simples e direta;
* Poucas telas;
* Fluxos rápidos e intuitivos.

## Funcionalidades Principais

### Gestão de alunos

* Cadastro de alunos;
* Informações básicas de contato;
* Observações opcionais;
* Histórico financeiro simples.

### Controle de mensalidades

* Cadastro do valor da mensalidade;
* Controle de reajuste anual;
* Controle de vencimento;
* Vencimento padrão no quinto dia útil do mês;
* Registro manual de pagamento;
* Histórico de pagamentos.

### Cobranças adicionais

* Registro de cobranças extras;
* Associação da cobrança ao aluno;
* Descrição e valor da cobrança.

### Gestão financeira

* Visualização de pagamentos pendentes;
* Visualização de pagamentos realizados;
* Edição de cobranças anteriores quando necessário.

### Geração de cobrança

* Geração de PDF da cobrança;
* Compartilhamento do PDF via WhatsApp.

### Backup

* Exportação do banco de dados para arquivo local;
* Possibilidade futura de restauração/importação do backup.

## Requisitos Não Funcionais

### Simplicidade

O sistema deve ser extremamente simples de utilizar:

* poucos elementos por tela;
* textos claros;
* botões grandes;
* baixo número de cliques;
* evitar menus complexos;
* evitar configurações avançadas.

### Performance

* Inicialização rápida;
* Funcionamento fluido em aparelhos Android intermediários;
* Operação offline integral.

### Persistência

* Dados armazenados em SQLite local;
* Nenhuma dependência de internet para funcionamento.

## Fluxo Principal Esperado

1. Selecionar aluno;
2. Visualizar situação financeira;
3. Registrar mensalidade ou cobrança extra;
4. Marcar pagamento;
5. Gerar PDF da cobrança;
6. Compartilhar via WhatsApp.

## Possíveis Expansões Futuras

* Relatórios financeiros;
* Controle de materiais;
* Agenda simples;
* Estatísticas de pagamentos;
* Backup automático;
* Exportação para Excel/PDF;
* Temas visuais com maior acessibilidade.
