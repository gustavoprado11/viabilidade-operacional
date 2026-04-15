-- Flag para indicar se o calcário foi informado manualmente pelo operador
-- ou recalculado automaticamente pelo motor para atingir B2 alvo.
-- Default false preserva comportamento anterior.

ALTER TABLE simulacoes
  ADD COLUMN calcario_manual BOOLEAN NOT NULL DEFAULT false;
