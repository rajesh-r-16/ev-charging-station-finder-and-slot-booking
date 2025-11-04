-- Fix RLS security issues for all analytics and telemetry tables

-- Grid carbon intensity - public read access
ALTER TABLE public.grid_carbon_intensity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grid carbon intensity data"
  ON public.grid_carbon_intensity FOR SELECT
  USING (true);

-- Station demand logs - public read for transparency
ALTER TABLE public.station_demand_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view station demand logs"
  ON public.station_demand_logs FOR SELECT
  USING (true);

-- Operator settlements - restricted access
ALTER TABLE public.operator_settlements ENABLE ROW LEVEL SECURITY;

-- Note: Operator access control will need admin roles implementation
-- For now, only system can write, no public read
CREATE POLICY "No public access to settlements"
  ON public.operator_settlements FOR SELECT
  USING (false);

-- Payment analytics - restricted access
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment analytics
CREATE POLICY "Users can view their own payment analytics"
  ON public.payment_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments
      WHERE payments.id = payment_analytics.payment_id
      AND payments.user_id = auth.uid()
    )
  );

-- Station telemetry - public read for transparency
ALTER TABLE public.station_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view station telemetry"
  ON public.station_telemetry FOR SELECT
  USING (true);

-- SLA metrics - public read for transparency
ALTER TABLE public.sla_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SLA metrics"
  ON public.sla_metrics FOR SELECT
  USING (true);

-- Platform analytics - public read for transparency
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform analytics"
  ON public.platform_analytics FOR SELECT
  USING (true);