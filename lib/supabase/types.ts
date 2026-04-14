export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      calibracoes: {
        Row: {
          corridas_analisadas: number
          created_at: string
          desvio_medio_antes: Json | null
          desvio_medio_depois: Json | null
          id: string
          justificativa: string
          parametros_new_id: string
          parametros_old_id: string
          user_id: string
        }
        Insert: {
          corridas_analisadas: number
          created_at?: string
          desvio_medio_antes?: Json | null
          desvio_medio_depois?: Json | null
          id?: string
          justificativa: string
          parametros_new_id: string
          parametros_old_id: string
          user_id: string
        }
        Update: {
          corridas_analisadas?: number
          created_at?: string
          desvio_medio_antes?: Json | null
          desvio_medio_depois?: Json | null
          id?: string
          justificativa?: string
          parametros_new_id?: string
          parametros_old_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calibracoes_parametros_new_id_fkey"
            columns: ["parametros_new_id"]
            isOneToOne: false
            referencedRelation: "parametros_forno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calibracoes_parametros_old_id_fkey"
            columns: ["parametros_old_id"]
            isOneToOne: false
            referencedRelation: "parametros_forno"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          c_max: number
          c_min: number
          cnpj: string | null
          created_at: string
          id: string
          mn_max: number
          nome: string
          p_max: number
          preco_gusa_ton: number
          s_max: number
          si_max: number
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          c_max: number
          c_min: number
          cnpj?: string | null
          created_at?: string
          id?: string
          mn_max: number
          nome: string
          p_max: number
          preco_gusa_ton: number
          s_max: number
          si_max: number
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          c_max?: number
          c_min?: number
          cnpj?: string | null
          created_at?: string
          id?: string
          mn_max?: number
          nome?: string
          p_max?: number
          preco_gusa_ton?: number
          s_max?: number
          si_max?: number
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      insumos: {
        Row: {
          al2o3_pct: number | null
          c_fixo_pct: number | null
          cao_pct: number | null
          created_at: string
          densidade_kg_m3: number | null
          fe_pct: number | null
          icms_credito: number | null
          id: string
          mgo_pct: number | null
          nome: string
          pis_credito: number | null
          preco_unit: number
          sio2_pct: number | null
          tipo: string
          unidade: string
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          al2o3_pct?: number | null
          c_fixo_pct?: number | null
          cao_pct?: number | null
          created_at?: string
          densidade_kg_m3?: number | null
          fe_pct?: number | null
          icms_credito?: number | null
          id?: string
          mgo_pct?: number | null
          nome: string
          pis_credito?: number | null
          preco_unit: number
          sio2_pct?: number | null
          tipo: string
          unidade?: string
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          al2o3_pct?: number | null
          c_fixo_pct?: number | null
          cao_pct?: number | null
          created_at?: string
          densidade_kg_m3?: number | null
          fe_pct?: number | null
          icms_credito?: number | null
          id?: string
          mgo_pct?: number | null
          nome?: string
          pis_credito?: number | null
          preco_unit?: number
          sio2_pct?: number | null
          tipo?: string
          unidade?: string
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      minerios: {
        Row: {
          al2o3_pct: number
          analise_validada: boolean
          cao_pct: number
          created_at: string
          fe_pct: number
          icms_credito_ton: number
          id: string
          mgo_pct: number
          mn_pct: number
          nome: string
          p_pct: number
          pis_credito_ton: number
          ppc_pct: number
          preco_ton: number
          sio2_pct: number
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          al2o3_pct: number
          analise_validada?: boolean
          cao_pct?: number
          created_at?: string
          fe_pct: number
          icms_credito_ton?: number
          id?: string
          mgo_pct?: number
          mn_pct: number
          nome: string
          p_pct: number
          pis_credito_ton?: number
          ppc_pct?: number
          preco_ton: number
          sio2_pct: number
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          al2o3_pct?: number
          analise_validada?: boolean
          cao_pct?: number
          created_at?: string
          fe_pct?: number
          icms_credito_ton?: number
          id?: string
          mgo_pct?: number
          mn_pct?: number
          nome?: string
          p_pct?: number
          pis_credito_ton?: number
          ppc_pct?: number
          preco_ton?: number
          sio2_pct?: number
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      parametros_forno: {
        Row: {
          al2o3_escoria_alvo_max: number
          al2o3_escoria_alvo_min: number
          al2o3_escoria_limite: number
          b2_alvo: number
          b2_max: number
          b2_min: number
          c_gusa_fixo: number
          consumo_minerio_dia: number
          corridas_por_dia: number
          created_at: string
          custo_fixo_dia: number
          deb_icms_ton: number
          deb_ipi_ton: number
          deb_pis_ton: number
          duracao_corrida_min: number
          fator_atencao: number
          fator_estavel: number
          fator_instavel: number
          frete_gusa_ton: number
          id: string
          mgo_al2o3_min: number
          particao_mn_gusa: number
          particao_p_gusa: number
          rend_fe_ref1: number
          rend_fe_ref2: number
          rend_ref1: number
          rend_ref2: number
          s_gusa_fixo: number
          si_coef_b2: number
          si_intercept: number
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          al2o3_escoria_alvo_max?: number
          al2o3_escoria_alvo_min?: number
          al2o3_escoria_limite?: number
          b2_alvo?: number
          b2_max?: number
          b2_min?: number
          c_gusa_fixo?: number
          consumo_minerio_dia?: number
          corridas_por_dia?: number
          created_at?: string
          custo_fixo_dia?: number
          deb_icms_ton?: number
          deb_ipi_ton?: number
          deb_pis_ton?: number
          duracao_corrida_min?: number
          fator_atencao?: number
          fator_estavel?: number
          fator_instavel?: number
          frete_gusa_ton?: number
          id?: string
          mgo_al2o3_min?: number
          particao_mn_gusa?: number
          particao_p_gusa?: number
          rend_fe_ref1?: number
          rend_fe_ref2?: number
          rend_ref1?: number
          rend_ref2?: number
          s_gusa_fixo?: number
          si_coef_b2?: number
          si_intercept?: number
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          al2o3_escoria_alvo_max?: number
          al2o3_escoria_alvo_min?: number
          al2o3_escoria_limite?: number
          b2_alvo?: number
          b2_max?: number
          b2_min?: number
          c_gusa_fixo?: number
          consumo_minerio_dia?: number
          corridas_por_dia?: number
          created_at?: string
          custo_fixo_dia?: number
          deb_icms_ton?: number
          deb_ipi_ton?: number
          deb_pis_ton?: number
          duracao_corrida_min?: number
          fator_atencao?: number
          fator_estavel?: number
          fator_instavel?: number
          frete_gusa_ton?: number
          id?: string
          mgo_al2o3_min?: number
          particao_mn_gusa?: number
          particao_p_gusa?: number
          rend_fe_ref1?: number
          rend_fe_ref2?: number
          rend_ref1?: number
          rend_ref2?: number
          s_gusa_fixo?: number
          si_coef_b2?: number
          si_intercept?: number
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      simulacoes: {
        Row: {
          analise_escoria_real: Json | null
          analise_gusa_real: Json | null
          bauxita_kg: number
          blend: Json
          calcario_kg: number
          carvao_densidade: number
          carvao_mdc: number
          classificacao: string
          cliente_id: string | null
          coque_kg: number
          corrida_timestamp: string | null
          created_at: string
          deleted_at: string | null
          dolomita_kg: number
          estabilidade: string
          id: string
          nome: string
          observacoes: string | null
          parametros_id: string
          quebras: Json
          resultado: Json
          simulacao_origem_id: string | null
          sucata_destino: string
          sucata_kg: number
          sucata_preco_ton: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analise_escoria_real?: Json | null
          analise_gusa_real?: Json | null
          bauxita_kg: number
          blend: Json
          calcario_kg: number
          carvao_densidade: number
          carvao_mdc: number
          classificacao: string
          cliente_id?: string | null
          coque_kg: number
          corrida_timestamp?: string | null
          created_at?: string
          deleted_at?: string | null
          dolomita_kg?: number
          estabilidade: string
          id?: string
          nome: string
          observacoes?: string | null
          parametros_id: string
          quebras: Json
          resultado: Json
          simulacao_origem_id?: string | null
          sucata_destino?: string
          sucata_kg?: number
          sucata_preco_ton?: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analise_escoria_real?: Json | null
          analise_gusa_real?: Json | null
          bauxita_kg?: number
          blend?: Json
          calcario_kg?: number
          carvao_densidade?: number
          carvao_mdc?: number
          classificacao?: string
          cliente_id?: string | null
          coque_kg?: number
          corrida_timestamp?: string | null
          created_at?: string
          deleted_at?: string | null
          dolomita_kg?: number
          estabilidade?: string
          id?: string
          nome?: string
          observacoes?: string | null
          parametros_id?: string
          quebras?: Json
          resultado?: Json
          simulacao_origem_id?: string | null
          sucata_destino?: string
          sucata_kg?: number
          sucata_preco_ton?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_parametros_id_fkey"
            columns: ["parametros_id"]
            isOneToOne: false
            referencedRelation: "parametros_forno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_simulacao_origem_id_fkey"
            columns: ["simulacao_origem_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
