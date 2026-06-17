# Plano de Execução: Módulo de Cobranças e Fluxo Mensal

Este documento descreve os próximos passos para implementar o módulo de cobranças conforme o plano de desenvolvimento fornecido.

## Resumo do Estado Atual

Com base na análise do projeto, constatamos que:
1. As tabelas `clientes` e `ajustes` já existem no banco de dados
2. A tabela `mensalidade_config` está documentada mas não foi criada nas migrations
3. Não existem tabelas `cobrancas` ou `cobrancas_extras`
4. Existem repositórios para `clientes` e `ajustes` seguindo um padrão consistente
5. Existem stores Pinia para `clientes` seguindo o padrão de Composition API
6. A página inicial (`IndexPage.vue`) atualmente contém apenas um componente de exemplo
7. O projeto usa Quasar Framework com padrões de UI já estabelecidos

## Próximos Passos

### Parte 1: Atualização das Migrations
**Arquivo:** `src/database/migrations.ts`
- Adicionar criação da tabela `mensalidade_config` (conforme documentação)
- Adicionar criação das tabelas `cobrancas` e `cobrancas_extras`
- Garantir que as migrações usem `IF NOT EXISTS` para não quebrar dados existentes

### Parte 2: Criação do Repositório de Cobranças
**Arquivo:** `src/database/repositories/cobranca-repository.ts`
- Criar novo repositório seguindo o padrão dos repositórios existentes
- Implementar os métodos obrigatórios:
  1. `obterCandidatosGeracao()` - query com LEFT JOIN e COALESCE para fallback
  2. `findByCompetencia(competencia: string)` - busca cobranças por mês
  3. `inserirCobrançasEmLote(cobrancas: any[])` - inserção em lote
  4. `atualizarStatusPagamento(id: number, dataPagamento: string | null)`
  5. `adicionarCobrancaExtra(idCobranca: number, motivo: string, valor: number)`

### Parte 3: Criação da Store do Pinia
**Arquivo:** `src/stores/cobranca-store.ts`
- Implementar store usando Composition API (`defineStore`)
- Definir estado: `cobrancasMensais` (array), `loading` (boolean), `competenciaAtual` (string)
- Implementar lógica central em `verificarEGerarCobrançasDoMes`:
  - Descobrir mês/ano atual
  - Buscar clientes elegíveis via repositório
  - Filtrar clientes que ainda não têm cobrança para o mês
  - Calcular data de vencimento com formatação correta
  - Salvar cobranças em lote
  - Atualizar estado da aplicação

### Parte 4: Interface de Usuário - Tela Inicial
**Arquivo:** `src/pages/IndexPage.vue`
- Substituir conteúdo atual por UI focada em cobranças mensais
- Implementar:
  1. Seletor de competência com botões de navegação (setas para esquerda/direita)
  2. Cards de resumo para cobranças pendentes e pagas
  3. Lista de alunos com:
     - Nome em destaque
     - Valor total (mensalidade + extras)
     - Status de vencimento/pagamento
     - Botão de ação ("Dar Baixa" para pendentes, indicador visual para pagos)
- Seguir diretrizes de UI/UX: botões grandes, textos claros, poucos cliques

### Parte 5: Modal de Cobranças Extras e Detalhes
- Implementar modal que abre ao clicar no card do aluno
- Funcionalidades:
  - Exibir histórico de extras da cobrança
  - Formulário para adicionar novo extra (motivo e valor)
  - Atualização reativa da tela principal após salvar

## Dependências e Considerações

1. **Sequência de Implementação:**
   - Parte 1 (Migrations) deve ser feita primeiro
   - Parte 2 (Repositório) depende das tabelas existentes
   - Parte 3 (Store) depende do repositório
   - Parte 4 (UI) depende da store
   - Parte 5 (Modal) depende da UI básica

2. **Padrões a Seguir:**
   - Seguir o padrão existente nos repositorios (`getDB`, `saveDB`)
   - Seguir o padrão existente nas stores (Composition API, refs)
   - Usar componentes Quasar conforme já utilizado no projeto
   - Manter consistência com estilos existentes (border-radius: 12px-14px, inputs outlined/dense)

3. **Validação:**
   - Após cada parte, verificar se não há erros de compilação
   - Testar funcionalidades isoladamente antes de integrar
   - Verificar se as regras de fallback estão funcionando corretamente

## Próximos Passos Imediatos

1. Atualizar o arquivo de migrations para incluir as tabelas necessárias
2. Criar o repositório de cobranças com os métodos especificados
3. Implementar a store Pinia para gerenciamento de estado
4. Redesenhar a página inicial com a interface de cobranças
5. Adicionar a funcionalidade de modal para cobranças extras