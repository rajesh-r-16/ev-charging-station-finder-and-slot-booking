
-- 1) Restrict self-service role requests to non-privileged roles only
DROP POLICY IF EXISTS "Users can request roles" ON public.user_roles;
CREATE POLICY "Users can request non-privileged roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND approved = false
  AND role IN ('user'::app_role, 'station_owner'::app_role)
);

-- 2) Tighten station_telemetry: restrict to authenticated users (drop public read)
DROP POLICY IF EXISTS "Anyone can view station telemetry" ON public.station_telemetry;
CREATE POLICY "Authenticated users can view station telemetry"
ON public.station_telemetry
FOR SELECT
TO authenticated
USING (true);

-- 3) Tighten v2v_transactions SELECT to authenticated only (was public)
DROP POLICY IF EXISTS "Users can view their own V2V transactions" ON public.v2v_transactions;
CREATE POLICY "Users can view their own V2V transactions"
ON public.v2v_transactions
FOR SELECT
TO authenticated
USING ((auth.uid() = provider_user_id) OR (auth.uid() = receiver_user_id));
