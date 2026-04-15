-- Fase 12.5: MDC passa a ser calculado a partir de cargas × peso / densidade.
-- Adiciona os dois novos campos ao registro da simulação. carvao_mdc permanece
-- (retrocompatibilidade + convênio com o motor). Registros antigos ficam com
-- NULL nos dois campos novos até serem re-editados.
ALTER TABLE simulacoes
  ADD COLUMN IF NOT EXISTS carvao_cargas_por_corrida NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS carvao_peso_por_carga_kg NUMERIC(8,2);
