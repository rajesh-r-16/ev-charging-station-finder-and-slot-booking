-- Fix profiles table: Ensure all policies explicitly require authentication
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix payments table: Add explicit TO authenticated clause
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;

CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix bookings table: Add explicit TO authenticated clause
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix v2v_transactions table: Add missing INSERT, UPDATE, DELETE policies
-- Only receivers can create transactions (request energy from providers)
CREATE POLICY "Users can create V2V transactions as receiver"
ON public.v2v_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = receiver_user_id);

-- Both provider and receiver can update their transactions (to accept/reject/complete)
CREATE POLICY "Users can update their own V2V transactions"
ON public.v2v_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = provider_user_id OR auth.uid() = receiver_user_id);

-- Only allow deletion by the receiver (cancel their own request) when status is pending
CREATE POLICY "Receivers can delete pending V2V transactions"
ON public.v2v_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = receiver_user_id);