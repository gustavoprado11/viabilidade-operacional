-- Soft delete para simulações (simulação e corrida_real). Mantém reprodutibilidade
-- e auditoria; queries default filtram deleted_at IS NULL.

ALTER TABLE simulacoes
  ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_simulacoes_user_ativas
  ON simulacoes(user_id, created_at DESC)
  WHERE deleted_at IS NULL;
