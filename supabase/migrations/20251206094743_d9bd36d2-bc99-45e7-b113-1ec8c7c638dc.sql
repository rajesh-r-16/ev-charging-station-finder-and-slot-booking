-- Fix v2v_listings: Change from public access to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active V2V listings" ON public.v2v_listings;

-- Create new policy that only allows authenticated users to view active listings
CREATE POLICY "Authenticated users can view active V2V listings"
ON public.v2v_listings
FOR SELECT
TO authenticated
USING (status = 'active'::text);

-- Ensure profiles table has no public access (verify existing policies are secure)
-- The existing policies already restrict to auth.uid() = user_id, but let's add explicit denial for anon
-- by ensuring all policies use TO authenticated

-- Drop and recreate profile policies with explicit TO authenticated clause
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