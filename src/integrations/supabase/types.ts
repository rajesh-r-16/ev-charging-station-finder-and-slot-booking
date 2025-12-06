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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          end_time: string
          id: string
          slot_number: number
          start_time: string
          station_id: string
          status: string
          total_amount: number
          total_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          slot_number: number
          start_time: string
          station_id: string
          status?: string
          total_amount: number
          total_hours: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          slot_number?: number
          start_time?: string
          station_id?: string
          status?: string
          total_amount?: number
          total_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      charging_session_emissions: {
        Row: {
          avg_carbon_intensity_g_per_kwh: number
          booking_id: string
          carbon_offset_purchased: boolean | null
          created_at: string | null
          energy_consumed_kwh: number
          id: string
          renewable_energy_percent: number | null
          session_end: string
          session_start: string
          station_id: string
          total_carbon_emissions_kg: number
          user_id: string
        }
        Insert: {
          avg_carbon_intensity_g_per_kwh: number
          booking_id: string
          carbon_offset_purchased?: boolean | null
          created_at?: string | null
          energy_consumed_kwh: number
          id?: string
          renewable_energy_percent?: number | null
          session_end: string
          session_start: string
          station_id: string
          total_carbon_emissions_kg: number
          user_id: string
        }
        Update: {
          avg_carbon_intensity_g_per_kwh?: number
          booking_id?: string
          carbon_offset_purchased?: boolean | null
          created_at?: string | null
          energy_consumed_kwh?: number
          id?: string
          renewable_energy_percent?: number | null
          session_end?: string
          session_start?: string
          station_id?: string
          total_carbon_emissions_kg?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charging_session_emissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charging_session_emissions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      charging_slots: {
        Row: {
          connector_type: string
          created_at: string | null
          current_booking_id: string | null
          id: string
          last_status_update: string | null
          power_output_kw: number
          slot_number: number
          station_id: string
          status: string
        }
        Insert: {
          connector_type?: string
          created_at?: string | null
          current_booking_id?: string | null
          id?: string
          last_status_update?: string | null
          power_output_kw?: number
          slot_number: number
          station_id: string
          status?: string
        }
        Update: {
          connector_type?: string
          created_at?: string | null
          current_booking_id?: string | null
          id?: string
          last_status_update?: string | null
          power_output_kw?: number
          slot_number?: number
          station_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "charging_slots_current_booking_id_fkey"
            columns: ["current_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charging_slots_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      charging_stations: {
        Row: {
          address: string
          amenities: string[] | null
          available_slots: number
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          owner_user_id: string | null
          price_per_hour: number
          total_slots: number
        }
        Insert: {
          address: string
          amenities?: string[] | null
          available_slots?: number
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          owner_user_id?: string | null
          price_per_hour: number
          total_slots?: number
        }
        Update: {
          address?: string
          amenities?: string[] | null
          available_slots?: number
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          owner_user_id?: string | null
          price_per_hour?: number
          total_slots?: number
        }
        Relationships: []
      }
      grid_carbon_intensity: {
        Row: {
          carbon_intensity_g_per_kwh: number
          created_at: string | null
          energy_mix: Json | null
          id: string
          region: string
          source: string | null
          timestamp: string
        }
        Insert: {
          carbon_intensity_g_per_kwh: number
          created_at?: string | null
          energy_mix?: Json | null
          id?: string
          region: string
          source?: string | null
          timestamp: string
        }
        Update: {
          carbon_intensity_g_per_kwh?: number
          created_at?: string | null
          energy_mix?: Json | null
          id?: string
          region?: string
          source?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      operator_settlements: {
        Row: {
          created_at: string | null
          id: string
          net_payout: number
          payout_date: string | null
          period_end: string
          period_start: string
          platform_fee: number
          sessions_count: number
          station_id: string
          status: string
          total_energy_kwh: number
          total_revenue: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          net_payout?: number
          payout_date?: string | null
          period_end: string
          period_start: string
          platform_fee?: number
          sessions_count?: number
          station_id: string
          status?: string
          total_energy_kwh?: number
          total_revenue?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          net_payout?: number
          payout_date?: string | null
          period_end?: string
          period_start?: string
          platform_fee?: number
          sessions_count?: number
          station_id?: string
          status?: string
          total_energy_kwh?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "operator_settlements_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_analytics: {
        Row: {
          failure_reason: string | null
          id: string
          payment_id: string
          payment_method: string
          processing_time_ms: number | null
          station_id: string
          success: boolean
          timestamp: string | null
        }
        Insert: {
          failure_reason?: string | null
          id?: string
          payment_id: string
          payment_method: string
          processing_time_ms?: number | null
          station_id: string
          success: boolean
          timestamp?: string | null
        }
        Update: {
          failure_reason?: string | null
          id?: string
          payment_id?: string
          payment_method?: string
          processing_time_ms?: number | null
          station_id?: string
          success?: boolean
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_analytics_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_analytics_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          payment_date: string
          payment_method: string
          payment_status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          payment_date?: string
          payment_method: string
          payment_status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          payment_date?: string
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics: {
        Row: {
          active_users: number | null
          avg_session_duration_minutes: number | null
          carbon_saved_kg: number | null
          created_at: string | null
          date: string
          id: string
          peak_demand_hour: number | null
          total_energy_kwh: number | null
          total_revenue: number | null
          total_sessions: number | null
        }
        Insert: {
          active_users?: number | null
          avg_session_duration_minutes?: number | null
          carbon_saved_kg?: number | null
          created_at?: string | null
          date: string
          id?: string
          peak_demand_hour?: number | null
          total_energy_kwh?: number | null
          total_revenue?: number | null
          total_sessions?: number | null
        }
        Update: {
          active_users?: number | null
          avg_session_duration_minutes?: number | null
          carbon_saved_kg?: number | null
          created_at?: string | null
          date?: string
          id?: string
          peak_demand_hour?: number | null
          total_energy_kwh?: number | null
          total_revenue?: number | null
          total_sessions?: number | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          active: boolean | null
          base_price_per_hour: number
          condition: Json
          created_at: string | null
          id: string
          multiplier: number
          rule_type: string
          station_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_price_per_hour: number
          condition: Json
          created_at?: string | null
          id?: string
          multiplier?: number
          rule_type: string
          station_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_price_per_hour?: number
          condition?: Json
          created_at?: string | null
          id?: string
          multiplier?: number
          rule_type?: string
          station_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          vehicle_model: string | null
          vehicle_number: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          vehicle_model?: string | null
          vehicle_number?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          vehicle_model?: string | null
          vehicle_number?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      route_plans: {
        Row: {
          created_at: string | null
          end_location: Json
          id: string
          optimization_mode: string
          start_location: Json
          total_carbon_kg: number
          total_cost: number
          total_distance_km: number
          total_duration_minutes: number
          user_id: string
          vehicle_profile_id: string
          waypoints: Json
        }
        Insert: {
          created_at?: string | null
          end_location: Json
          id?: string
          optimization_mode: string
          start_location: Json
          total_carbon_kg: number
          total_cost: number
          total_distance_km: number
          total_duration_minutes: number
          user_id: string
          vehicle_profile_id: string
          waypoints: Json
        }
        Update: {
          created_at?: string | null
          end_location?: Json
          id?: string
          optimization_mode?: string
          start_location?: Json
          total_carbon_kg?: number
          total_cost?: number
          total_distance_km?: number
          total_duration_minutes?: number
          user_id?: string
          vehicle_profile_id?: string
          waypoints?: Json
        }
        Relationships: [
          {
            foreignKeyName: "route_plans_vehicle_profile_id_fkey"
            columns: ["vehicle_profile_id"]
            isOneToOne: false
            referencedRelation: "vehicle_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_metrics: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string | null
          failed_sessions: number | null
          id: string
          metric_date: string
          sla_compliance_score: number | null
          station_id: string
          successful_sessions: number | null
          uptime_percent: number
          violations: Json | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string | null
          failed_sessions?: number | null
          id?: string
          metric_date: string
          sla_compliance_score?: number | null
          station_id: string
          successful_sessions?: number | null
          uptime_percent: number
          violations?: Json | null
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string | null
          failed_sessions?: number | null
          id?: string
          metric_date?: string
          sla_compliance_score?: number | null
          station_id?: string
          successful_sessions?: number | null
          uptime_percent?: number
          violations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_metrics_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      station_demand_logs: {
        Row: {
          current_price_per_hour: number
          demand_score: number
          id: string
          occupancy_percent: number
          station_id: string
          timestamp: string | null
        }
        Insert: {
          current_price_per_hour: number
          demand_score?: number
          id?: string
          occupancy_percent: number
          station_id: string
          timestamp?: string | null
        }
        Update: {
          current_price_per_hour?: number
          demand_score?: number
          id?: string
          occupancy_percent?: number
          station_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "station_demand_logs_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      station_telemetry: {
        Row: {
          active_sessions: number | null
          avg_charging_speed_kw: number | null
          energy_delivered_kwh: number | null
          fault_count: number | null
          id: string
          station_id: string
          status: string
          temperature_celsius: number | null
          timestamp: string | null
          uptime_percent: number
        }
        Insert: {
          active_sessions?: number | null
          avg_charging_speed_kw?: number | null
          energy_delivered_kwh?: number | null
          fault_count?: number | null
          id?: string
          station_id: string
          status: string
          temperature_celsius?: number | null
          timestamp?: string | null
          uptime_percent: number
        }
        Update: {
          active_sessions?: number | null
          avg_charging_speed_kw?: number | null
          energy_delivered_kwh?: number | null
          fault_count?: number | null
          id?: string
          station_id?: string
          status?: string
          temperature_celsius?: number | null
          timestamp?: string | null
          uptime_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "station_telemetry_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "charging_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_carbon_reports: {
        Row: {
          avg_carbon_intensity_g_per_kwh: number
          comparison_to_gasoline_kg: number | null
          created_at: string | null
          id: string
          report_period_end: string
          report_period_start: string
          sessions_count: number
          total_carbon_emissions_kg: number
          total_energy_consumed_kwh: number
          user_id: string
        }
        Insert: {
          avg_carbon_intensity_g_per_kwh: number
          comparison_to_gasoline_kg?: number | null
          created_at?: string | null
          id?: string
          report_period_end: string
          report_period_start: string
          sessions_count: number
          total_carbon_emissions_kg: number
          total_energy_consumed_kwh: number
          user_id: string
        }
        Update: {
          avg_carbon_intensity_g_per_kwh?: number
          comparison_to_gasoline_kg?: number | null
          created_at?: string | null
          id?: string
          report_period_end?: string
          report_period_start?: string
          sessions_count?: number
          total_carbon_emissions_kg?: number
          total_energy_consumed_kwh?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      v2g_enrollments: {
        Row: {
          available_capacity_kwh: number
          created_at: string | null
          id: string
          max_discharge_rate_kw: number
          min_battery_reserve_percent: number
          participation_hours: Json
          status: string
          total_earnings: number | null
          total_energy_sold_kwh: number | null
          updated_at: string | null
          user_id: string
          vehicle_profile_id: string
        }
        Insert: {
          available_capacity_kwh: number
          created_at?: string | null
          id?: string
          max_discharge_rate_kw?: number
          min_battery_reserve_percent?: number
          participation_hours: Json
          status?: string
          total_earnings?: number | null
          total_energy_sold_kwh?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_profile_id: string
        }
        Update: {
          available_capacity_kwh?: number
          created_at?: string | null
          id?: string
          max_discharge_rate_kw?: number
          min_battery_reserve_percent?: number
          participation_hours?: Json
          status?: string
          total_earnings?: number | null
          total_energy_sold_kwh?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2g_enrollments_vehicle_profile_id_fkey"
            columns: ["vehicle_profile_id"]
            isOneToOne: false
            referencedRelation: "vehicle_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v2g_grid_transactions: {
        Row: {
          carbon_offset_kg: number
          earnings: number
          energy_discharged_kwh: number
          enrollment_id: string
          grid_demand_level: string | null
          grid_price_per_kwh: number
          id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          carbon_offset_kg: number
          earnings: number
          energy_discharged_kwh: number
          enrollment_id: string
          grid_demand_level?: string | null
          grid_price_per_kwh: number
          id?: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          carbon_offset_kg?: number
          earnings?: number
          energy_discharged_kwh?: number
          enrollment_id?: string
          grid_demand_level?: string | null
          grid_price_per_kwh?: number
          id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v2g_grid_transactions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "v2g_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      v2v_listings: {
        Row: {
          available_energy_kwh: number
          available_from: string
          available_until: string
          created_at: string | null
          id: string
          location: Json
          max_transfer_kwh: number
          min_transfer_kwh: number
          price_per_kwh: number
          provider_user_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          available_energy_kwh: number
          available_from: string
          available_until: string
          created_at?: string | null
          id?: string
          location: Json
          max_transfer_kwh: number
          min_transfer_kwh?: number
          price_per_kwh: number
          provider_user_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          available_energy_kwh?: number
          available_from?: string
          available_until?: string
          created_at?: string | null
          id?: string
          location?: Json
          max_transfer_kwh?: number
          min_transfer_kwh?: number
          price_per_kwh?: number
          provider_user_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      v2v_transactions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          energy_transferred_kwh: number
          id: string
          listing_id: string
          provider_user_id: string
          receiver_user_id: string
          started_at: string | null
          status: string
          total_cost: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          energy_transferred_kwh: number
          id?: string
          listing_id: string
          provider_user_id: string
          receiver_user_id: string
          started_at?: string | null
          status?: string
          total_cost: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          energy_transferred_kwh?: number
          id?: string
          listing_id?: string
          provider_user_id?: string
          receiver_user_id?: string
          started_at?: string | null
          status?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "v2v_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v2v_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_profiles: {
        Row: {
          avg_consumption_kwh_per_km: number
          battery_capacity_kwh: number
          connector_types: string[]
          created_at: string | null
          current_soc_percent: number
          id: string
          max_charging_rate_kw: number
          updated_at: string | null
          user_id: string
          vehicle_model: string
        }
        Insert: {
          avg_consumption_kwh_per_km?: number
          battery_capacity_kwh: number
          connector_types?: string[]
          created_at?: string | null
          current_soc_percent?: number
          id?: string
          max_charging_rate_kw?: number
          updated_at?: string | null
          user_id: string
          vehicle_model: string
        }
        Update: {
          avg_consumption_kwh_per_km?: number
          battery_capacity_kwh?: number
          connector_types?: string[]
          created_at?: string | null
          current_soc_percent?: number
          id?: string
          max_charging_rate_kw?: number
          updated_at?: string | null
          user_id?: string
          vehicle_model?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "station_owner" | "user"
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
    Enums: {
      app_role: ["admin", "station_owner", "user"],
    },
  },
} as const
