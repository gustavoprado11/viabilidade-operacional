-- Faixas de desvio toleráveis / de alerta usadas pelo DesviosCard.
-- Parametrizáveis via F8 (Calibração) em vez de hardcoded no código.
-- Default: 5% tolerável, 15% alerta (acima = crítico).

ALTER TABLE parametros_forno
  ADD COLUMN desvio_tolerancia_pct NUMERIC(5,3) NOT NULL DEFAULT 0.05,
  ADD COLUMN desvio_atencao_pct NUMERIC(5,3) NOT NULL DEFAULT 0.15;
