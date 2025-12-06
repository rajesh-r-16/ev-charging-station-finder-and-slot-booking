-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'station_owner', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    approved boolean DEFAULT false,
    approved_at timestamp with time zone,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND approved = true
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can request roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND approved = false);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add owner_user_id to charging_stations for station ownership
ALTER TABLE public.charging_stations 
ADD COLUMN owner_user_id uuid REFERENCES auth.users(id);

-- Update RLS for charging_stations to allow owners to manage their stations
CREATE POLICY "Station owners can update their stations"
ON public.charging_stations
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid() AND public.has_role(auth.uid(), 'station_owner'));

CREATE POLICY "Station owners can insert stations"
ON public.charging_stations
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid() AND public.has_role(auth.uid(), 'station_owner'));

-- Allow station owners to manage their charging slots
CREATE POLICY "Station owners can update their slots"
ON public.charging_slots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.charging_stations cs 
    WHERE cs.id = charging_slots.station_id 
    AND cs.owner_user_id = auth.uid()
  ) AND public.has_role(auth.uid(), 'station_owner')
);

CREATE POLICY "Station owners can insert slots"
ON public.charging_slots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.charging_stations cs 
    WHERE cs.id = charging_slots.station_id 
    AND cs.owner_user_id = auth.uid()
  ) AND public.has_role(auth.uid(), 'station_owner')
);