
-- charging_stations: require authentication
DROP POLICY IF EXISTS "Anyone can view charging stations" ON public.charging_stations;
CREATE POLICY "Authenticated users can view charging stations"
ON public.charging_stations FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.charging_stations FROM anon;

-- charging_slots: require authentication
DROP POLICY IF EXISTS "Anyone can view charging slots" ON public.charging_slots;
CREATE POLICY "Authenticated users can view charging slots"
ON public.charging_slots FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.charging_slots FROM anon;

-- grid_carbon_intensity: require authentication
DROP POLICY IF EXISTS "Anyone can view grid carbon intensity data" ON public.grid_carbon_intensity;
CREATE POLICY "Authenticated users can view grid carbon intensity"
ON public.grid_carbon_intensity FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.grid_carbon_intensity FROM anon;

-- station_demand_logs: station owner or admin only
DROP POLICY IF EXISTS "Anyone can view station demand logs" ON public.station_demand_logs;
CREATE POLICY "Station owners and admins can view demand logs"
ON public.station_demand_logs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.charging_stations cs
    WHERE cs.id = station_demand_logs.station_id
      AND cs.owner_user_id = auth.uid()
  )
);
REVOKE SELECT ON public.station_demand_logs FROM anon;

-- sla_metrics: station owner or admin only
DROP POLICY IF EXISTS "Anyone can view SLA metrics" ON public.sla_metrics;
CREATE POLICY "Station owners and admins can view SLA metrics"
ON public.sla_metrics FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.charging_stations cs
    WHERE cs.id = sla_metrics.station_id
      AND cs.owner_user_id = auth.uid()
  )
);
REVOKE SELECT ON public.sla_metrics FROM anon;

-- station_telemetry: station owner or admin only
DROP POLICY IF EXISTS "Authenticated users can view station telemetry" ON public.station_telemetry;
CREATE POLICY "Station owners and admins can view telemetry"
ON public.station_telemetry FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.charging_stations cs
    WHERE cs.id = station_telemetry.station_id
      AND cs.owner_user_id = auth.uid()
  )
);
REVOKE SELECT ON public.station_telemetry FROM anon;

-- platform_analytics: admins only
DROP POLICY IF EXISTS "Anyone can view platform analytics" ON public.platform_analytics;
CREATE POLICY "Admins can view platform analytics"
ON public.platform_analytics FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.platform_analytics FROM anon;
