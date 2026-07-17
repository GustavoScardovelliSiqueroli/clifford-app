**obs:**

- Se houver valor em mensalidade_config, ignorar valor de ajustes para mensalidade do cliente;
- Se houver dia_vencimento em mensalidade config, ignorar valor de ajustes para gerar a mensalidade desse cliente

```mermaid
erDiagram
  clientes {
    INTEGER id PK
    TEXT nome
    TEXT telefone
    TEXT birth_date
    TEXT obs
    INTEGER ativo
    TEXT created_at
  }
  ajustes {
    INTEGER id PK
    REAL valor_mensalidade
    INTEGER dia_vencimento
  }
  mensalidade_config {
    INTEGER id PK
    INTEGER cliente_id FK
    REAL valor
    INTEGER dia_vencimento
  }
  cobrancas {
    INTEGER id PK
    INTEGER cliente_id FK
    REAL valor_mensalidade
    TEXT vencimento
    TEXT data_pagamento
    TEXT competencia
  }
  cobrancas_extras {
    INTEGER id PK
    INTEGER id_cobranca FK
    TEXT motivo
    REAL valor
  }
  clientes ||--o{ mensalidade_config : "1 config por aluno"
  clientes ||--o{ cobrancas : "cobranças do aluno"
  cobrancas ||--o{ cobrancas_extras : "extras da cobrança"
```

```SQL
PRAGMA foreign_keys = ON;

CREATE TABLE clientes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT    NOT NULL,
  telefone   TEXT,
  birth_date TEXT,
  obs        TEXT,
  ativo      INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL
);

CREATE TABLE ajustes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  valor_mensalidade REAL    NOT NULL,
  dia_vencimento    INTEGER NOT NULL
);

CREATE TABLE mensalidade_config (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id     INTEGER NOT NULL REFERENCES clientes(id),
  valor          REAL,
  dia_vencimento INTEGER
);

CREATE TABLE cobrancas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id        INTEGER NOT NULL REFERENCES clientes(id),
  valor_mensalidade REAL    NOT NULL,
  vencimento        TEXT    NOT NULL,
  data_pagamento    TEXT,
  competencia       TEXT    NOT NULL
);

CREATE TABLE cobrancas_extras (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cobranca INTEGER NOT NULL REFERENCES cobrancas(id),
  motivo      TEXT    NOT NULL,
  valor       REAL    NOT NULL
);
```
