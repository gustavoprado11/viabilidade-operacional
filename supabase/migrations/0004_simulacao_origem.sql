-- Vínculo opcional de uma corrida real com a simulação que a originou.
-- ON DELETE SET NULL: se a simulação for hard-deletada (caso extraordinário),
-- a corrida perde a referência mas preserva o próprio snapshot.
-- Soft delete (deleted_at preenchido) não dispara a FK.

ALTER TABLE simulacoes
  ADD COLUMN simulacao_origem_id UUID
    REFERENCES simulacoes(id) ON DELETE SET NULL;

CREATE INDEX idx_simulacoes_origem
  ON simulacoes(simulacao_origem_id)
  WHERE simulacao_origem_id IS NOT NULL;
