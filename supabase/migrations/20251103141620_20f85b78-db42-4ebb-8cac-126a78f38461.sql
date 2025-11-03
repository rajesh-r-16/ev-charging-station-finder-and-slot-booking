-- ============================================
-- ENHANCED CHARGER DISCOVERY & REAL-TIME AVAILABILITY
-- ============================================

-- Add real-time slot tracking
CREATE TABLE IF NOT EXISTS public.charging_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  current_booking_id UUID REFERENCES public.bookings(id),
  power_output_kw NUMERIC NOT NULL DEFAULT 50,
  connector_type TEXT NOT NULL DEFAULT 'CCS2',
  last_status_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(station_id, slot_number)
);

-- Enable RLS
ALTER TABLE public.charging_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view charging slots"
  ON public.charging_slots FOR SELECT
  USING (true);

-- Add real-time updates
ALTER TABLE public.charging_slots REPLICA IDENTITY FULL;

-- ============================================
-- BATTERY-AWARE ROUTE PLANNER
-- ============================================

-- Vehicle profiles for route planning
CREATE TABLE IF NOT EXISTS public.vehicle_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_model TEXT NOT NULL,
  battery_capacity_kwh NUMERIC NOT NULL,
  current_soc_percent NUMERIC NOT NULL DEFAULT 80 CHECK (current_soc_percent >= 0 AND current_soc_percent <= 100),
  max_charging_rate_kw NUMERIC NOT NULL DEFAULT 150,
  avg_consumption_kwh_per_km NUMERIC NOT NULL DEFAULT 0.18,
  connector_types TEXT[] NOT NULL DEFAULT ARRAY['CCS2'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vehicle profiles"
  ON public.vehicle_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Route plans with SoC targets
CREATE TABLE IF NOT EXISTS public.route_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_profile_id UUID NOT NULL REFERENCES public.vehicle_profiles(id) ON DELETE CASCADE,
  start_location JSONB NOT NULL, -- {lat, lng, address}
  end_location JSONB NOT NULL,
  optimization_mode TEXT NOT NULL CHECK (optimization_mode IN ('fastest', 'cheapest', 'lowest_carbon')),
  total_distance_km NUMERIC NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  total_cost NUMERIC NOT NULL,
  total_carbon_kg NUMERIC NOT NULL,
  waypoints JSONB NOT NULL, -- array of {station_id, arrival_soc, departure_soc, charging_time_minutes, cost, carbon_kg}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.route_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own route plans"
  ON public.route_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DYNAMIC PRICING SYSTEM
-- ============================================

-- Pricing rules for demand-based pricing
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('time_of_day', 'demand_based', 'congestion', 'event_based')),
  base_price_per_hour NUMERIC NOT NULL,
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  condition JSONB NOT NULL, -- {time_range, occupancy_threshold, etc}
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (active = true);

-- Demand tracking for congestion control
CREATE TABLE IF NOT EXISTS public.station_demand_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  occupancy_percent NUMERIC NOT NULL,
  current_price_per_hour NUMERIC NOT NULL,
  demand_score NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX idx_station_demand_timestamp ON public.station_demand_logs(station_id, timestamp DESC);

-- ============================================
-- V2V MARKETPLACE
-- ============================================

-- V2V energy sharing listings
CREATE TABLE IF NOT EXISTS public.v2v_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location JSONB NOT NULL, -- {lat, lng, address}
  available_energy_kwh NUMERIC NOT NULL,
  price_per_kwh NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'cancelled')),
  min_transfer_kwh NUMERIC NOT NULL DEFAULT 5,
  max_transfer_kwh NUMERIC NOT NULL,
  available_from TIMESTAMP WITH TIME ZONE NOT NULL,
  available_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.v2v_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own V2V listings"
  ON public.v2v_listings FOR ALL
  USING (auth.uid() = provider_user_id)
  WITH CHECK (auth.uid() = provider_user_id);

CREATE POLICY "Anyone can view active V2V listings"
  ON public.v2v_listings FOR SELECT
  USING (status = 'active');

-- V2V transactions
CREATE TABLE IF NOT EXISTS public.v2v_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.v2v_listings(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_transferred_kwh NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.v2v_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own V2V transactions"
  ON public.v2v_transactions FOR SELECT
  USING (auth.uid() = provider_user_id OR auth.uid() = receiver_user_id);

-- ============================================
-- V2G AGGREGATION
-- ============================================

-- V2G grid participation
CREATE TABLE IF NOT EXISTS public.v2g_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_profile_id UUID NOT NULL REFERENCES public.vehicle_profiles(id) ON DELETE CASCADE,
  min_battery_reserve_percent NUMERIC NOT NULL DEFAULT 20 CHECK (min_battery_reserve_percent >= 0 AND min_battery_reserve_percent <= 100),
  max_discharge_rate_kw NUMERIC NOT NULL DEFAULT 10,
  available_capacity_kwh NUMERIC NOT NULL,
  participation_hours JSONB NOT NULL, -- array of time ranges when user allows discharge
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  total_energy_sold_kwh NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.v2g_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own V2G enrollments"
  ON public.v2g_enrollments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- V2G grid transactions
CREATE TABLE IF NOT EXISTS public.v2g_grid_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.v2g_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_discharged_kwh NUMERIC NOT NULL,
  grid_price_per_kwh NUMERIC NOT NULL,
  earnings NUMERIC NOT NULL,
  carbon_offset_kg NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  grid_demand_level TEXT CHECK (grid_demand_level IN ('low', 'medium', 'high', 'critical'))
);

ALTER TABLE public.v2g_grid_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own V2G transactions"
  ON public.v2g_grid_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- CARBON EMISSIONS TRACKING
-- ============================================

-- Grid carbon intensity data
CREATE TABLE IF NOT EXISTS public.grid_carbon_intensity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  carbon_intensity_g_per_kwh NUMERIC NOT NULL,
  energy_mix JSONB, -- {coal: %, solar: %, wind: %, etc}
  source TEXT DEFAULT 'api',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_grid_carbon_region_time ON public.grid_carbon_intensity(region, timestamp DESC);

-- Session carbon emissions
CREATE TABLE IF NOT EXISTS public.charging_session_emissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  energy_consumed_kwh NUMERIC NOT NULL,
  avg_carbon_intensity_g_per_kwh NUMERIC NOT NULL,
  total_carbon_emissions_kg NUMERIC NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE NOT NULL,
  renewable_energy_percent NUMERIC,
  carbon_offset_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.charging_session_emissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emissions"
  ON public.charging_session_emissions FOR SELECT
  USING (auth.uid() = user_id);

-- User carbon reports
CREATE TABLE IF NOT EXISTS public.user_carbon_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  report_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_energy_consumed_kwh NUMERIC NOT NULL,
  total_carbon_emissions_kg NUMERIC NOT NULL,
  sessions_count INTEGER NOT NULL,
  avg_carbon_intensity_g_per_kwh NUMERIC NOT NULL,
  comparison_to_gasoline_kg NUMERIC, -- CO2 saved vs equivalent gasoline car
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_carbon_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own carbon reports"
  ON public.user_carbon_reports FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- ENHANCED PAYMENTS & SETTLEMENTS
-- ============================================

-- Operator settlements
CREATE TABLE IF NOT EXISTS public.operator_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  net_payout NUMERIC NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  total_energy_kwh NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment analytics
CREATE TABLE IF NOT EXISTS public.payment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  processing_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_payment_analytics_station ON public.payment_analytics(station_id, timestamp DESC);

-- ============================================
-- TELEMETRY & SLA MONITORING
-- ============================================

-- Station telemetry data
CREATE TABLE IF NOT EXISTS public.station_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uptime_percent NUMERIC NOT NULL,
  avg_charging_speed_kw NUMERIC,
  fault_count INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  energy_delivered_kwh NUMERIC DEFAULT 0,
  temperature_celsius NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'offline', 'maintenance'))
);

CREATE INDEX idx_station_telemetry ON public.station_telemetry(station_id, timestamp DESC);

-- SLA compliance tracking
CREATE TABLE IF NOT EXISTS public.sla_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  uptime_percent NUMERIC NOT NULL,
  avg_response_time_ms INTEGER,
  successful_sessions INTEGER DEFAULT 0,
  failed_sessions INTEGER DEFAULT 0,
  sla_compliance_score NUMERIC, -- 0-100
  violations JSONB, -- array of violation details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(station_id, metric_date)
);

-- System-wide analytics
CREATE TABLE IF NOT EXISTS public.platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  total_energy_kwh NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  avg_session_duration_minutes INTEGER,
  peak_demand_hour INTEGER,
  carbon_saved_kg NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE TRIGGER update_vehicle_profiles_updated_at
  BEFORE UPDATE ON public.vehicle_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_v2v_listings_updated_at
  BEFORE UPDATE ON public.v2v_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_v2g_enrollments_updated_at
  BEFORE UPDATE ON public.v2g_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();