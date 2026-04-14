-- ============================================================
-- Sistema de Análise de Lâminas — schema inicial
-- Referência: docs/Specs_Tecnicas_Sistema_Laminas.md seção 3.1
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================================
-- CADASTROS (versionados: valid_from/valid_to; valid_to IS NULL = versão ativa)
-- ============================================================

CREATE TABLE minerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  preco_ton NUMERIC(10,2) NOT NULL,
  fe_pct NUMERIC(5,2) NOT NULL,
  sio2_pct NUMERIC(5,2) NOT NULL,
  al2o3_pct NUMERIC(5,2) NOT NULL,
  p_pct NUMERIC(6,4) NOT NULL,
  mn_pct NUMERIC(6,4) NOT NULL,
  cao_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  mgo_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  ppc_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  pis_credito_ton NUMERIC(10,2) NOT NULL DEFAULT 0,
  icms_credito_ton NUMERIC(10,2) NOT NULL DEFAULT 0,
  analise_validada BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_minerios_user_ativo ON minerios(user_id) WHERE valid_to IS NULL;

CREATE TABLE insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('calcario','bauxita','dolomita','coque','carvao','outro')),
  preco_unit NUMERIC(10,2) NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'ton' CHECK (unidade IN ('ton','MDC')),
  fe_pct NUMERIC(5,2) DEFAULT 0,
  sio2_pct NUMERIC(5,2) DEFAULT 0,
  al2o3_pct NUMERIC(5,2) DEFAULT 0,
  cao_pct NUMERIC(5,2) DEFAULT 0,
  mgo_pct NUMERIC(5,2) DEFAULT 0,
  c_fixo_pct NUMERIC(5,2),
  densidade_kg_m3 NUMERIC(7,2),
  pis_credito NUMERIC(10,2) DEFAULT 0,
  icms_credito NUMERIC(10,2) DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insumos_user_ativo ON insumos(user_id) WHERE valid_to IS NULL;
CREATE INDEX idx_insumos_tipo_ativo ON insumos(user_id, tipo) WHERE valid_to IS NULL;

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  cnpj TEXT,
  p_max NUMERIC(5,3) NOT NULL,
  si_max NUMERIC(5,3) NOT NULL,
  mn_max NUMERIC(5,3) NOT NULL,
  s_max NUMERIC(5,3) NOT NULL,
  c_min NUMERIC(5,3) NOT NULL,
  c_max NUMERIC(5,3) NOT NULL,
  preco_gusa_ton NUMERIC(10,2) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_user_ativo ON clientes(user_id) WHERE valid_to IS NULL;

CREATE TABLE parametros_forno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  corridas_por_dia INT NOT NULL DEFAULT 16,
  duracao_corrida_min INT NOT NULL DEFAULT 90,
  consumo_minerio_dia NUMERIC(10,2) NOT NULL DEFAULT 225.5,
  b2_min NUMERIC(4,3) NOT NULL DEFAULT 0.80,
  b2_max NUMERIC(4,3) NOT NULL DEFAULT 0.85,
  b2_alvo NUMERIC(4,3) NOT NULL DEFAULT 0.825,
  al2o3_escoria_alvo_min NUMERIC(5,2) NOT NULL DEFAULT 12.0,
  al2o3_escoria_alvo_max NUMERIC(5,2) NOT NULL DEFAULT 16.0,
  al2o3_escoria_limite NUMERIC(5,2) NOT NULL DEFAULT 17.0,
  mgo_al2o3_min NUMERIC(4,3) NOT NULL DEFAULT 0.25,

  -- Coeficientes do modelo de rendimento
  rend_fe_ref1 NUMERIC(5,2) NOT NULL DEFAULT 63.33,
  rend_ref1 NUMERIC(5,4) NOT NULL DEFAULT 0.6235,
  rend_fe_ref2 NUMERIC(5,2) NOT NULL DEFAULT 62.60,
  rend_ref2 NUMERIC(5,4) NOT NULL DEFAULT 0.5926,

  -- Fatores de estabilidade
  fator_estavel NUMERIC(4,3) NOT NULL DEFAULT 1.00,
  fator_atencao NUMERIC(4,3) NOT NULL DEFAULT 0.95,
  fator_instavel NUMERIC(4,3) NOT NULL DEFAULT 0.88,

  -- Partição de contaminantes
  particao_p_gusa NUMERIC(4,3) NOT NULL DEFAULT 0.95,
  particao_mn_gusa NUMERIC(4,3) NOT NULL DEFAULT 0.65,
  si_intercept NUMERIC(5,3) NOT NULL DEFAULT 1.500,
  si_coef_b2 NUMERIC(5,3) NOT NULL DEFAULT -1.200,
  s_gusa_fixo NUMERIC(5,3) NOT NULL DEFAULT 0.025,
  c_gusa_fixo NUMERIC(5,3) NOT NULL DEFAULT 4.20,

  -- Custos fixos
  custo_fixo_dia NUMERIC(10,2) NOT NULL DEFAULT 27167,
  frete_gusa_ton NUMERIC(10,2) NOT NULL DEFAULT 50.75,

  -- Tributos débito sobre gusa
  deb_pis_ton NUMERIC(10,2) NOT NULL DEFAULT 212.13,
  deb_icms_ton NUMERIC(10,2) NOT NULL DEFAULT 312.72,
  deb_ipi_ton NUMERIC(10,2) NOT NULL DEFAULT 84.69,

  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parametros_user_ativo ON parametros_forno(user_id) WHERE valid_to IS NULL;

-- ============================================================
-- SIMULAÇÕES E CORRIDAS (snapshot imutável do input + resultado)
-- ============================================================

CREATE TABLE simulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('simulacao','corrida_real')),

  -- Inputs do blend (snapshot)
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  blend JSONB NOT NULL,                   -- [{minerio_id, pct}]
  carvao_mdc NUMERIC(8,3) NOT NULL,
  carvao_densidade NUMERIC(7,2) NOT NULL,
  coque_kg NUMERIC(10,2) NOT NULL,
  calcario_kg NUMERIC(10,2) NOT NULL,
  bauxita_kg NUMERIC(10,2) NOT NULL,
  dolomita_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  quebras JSONB NOT NULL,                 -- {minerio, carvao, coque, fundentes}
  estabilidade TEXT NOT NULL CHECK (estabilidade IN ('estavel','atencao','instavel')),

  -- Sucata
  sucata_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  sucata_preco_ton NUMERIC(10,2) NOT NULL DEFAULT 0,
  sucata_destino TEXT NOT NULL DEFAULT 'venda' CHECK (sucata_destino IN ('venda','reprocesso')),

  -- Resultado calculado (snapshot completo)
  resultado JSONB NOT NULL,
  classificacao TEXT NOT NULL CHECK (classificacao IN ('viavel','alerta','inviavel')),
  parametros_id UUID NOT NULL REFERENCES parametros_forno(id) ON DELETE RESTRICT,

  -- Para corridas reais
  corrida_timestamp TIMESTAMPTZ,
  observacoes TEXT,
  analise_gusa_real JSONB,                -- {p, si, mn, s, c}
  analise_escoria_real JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_simulacoes_user ON simulacoes(user_id);
CREATE INDEX idx_simulacoes_tipo ON simulacoes(user_id, tipo);
CREATE INDEX idx_simulacoes_created ON simulacoes(user_id, created_at DESC);

CREATE TRIGGER simulacoes_updated_at
  BEFORE UPDATE ON simulacoes
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- CALIBRAÇÕES (log de ajustes do modelo)
-- ============================================================

CREATE TABLE calibracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  parametros_old_id UUID NOT NULL REFERENCES parametros_forno(id) ON DELETE RESTRICT,
  parametros_new_id UUID NOT NULL REFERENCES parametros_forno(id) ON DELETE RESTRICT,
  justificativa TEXT NOT NULL,
  corridas_analisadas INT NOT NULL,
  desvio_medio_antes JSONB,
  desvio_medio_depois JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calibracoes_user ON calibracoes(user_id, created_at DESC);

-- ============================================================
-- RLS (Row Level Security) — filtro por auth.uid()
-- ============================================================

ALTER TABLE minerios ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_forno ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own data" ON minerios         FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON insumos          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON clientes         FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON parametros_forno FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON simulacoes       FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON calibracoes      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
