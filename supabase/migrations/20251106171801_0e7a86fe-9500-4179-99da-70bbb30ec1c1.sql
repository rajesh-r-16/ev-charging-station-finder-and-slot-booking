-- Insert sample charging slots for Delhi stations
INSERT INTO public.charging_slots (station_id, slot_number, connector_type, power_output_kw, status) 
SELECT 
  cs.id,
  slot_num,
  CASE 
    WHEN slot_num % 3 = 0 THEN 'CHAdeMO'
    WHEN slot_num % 3 = 1 THEN 'CCS2'
    ELSE 'Type 2'
  END as connector_type,
  CASE 
    WHEN slot_num % 2 = 0 THEN 150
    ELSE 50
  END as power_output_kw,
  CASE 
    WHEN slot_num <= cs.available_slots THEN 'available'
    ELSE 'occupied'
  END as status
FROM 
  public.charging_stations cs,
  generate_series(1, cs.total_slots) as slot_num
WHERE cs.address LIKE '%Delhi%' OR cs.address LIKE '%NCR%'
ON CONFLICT (station_id, slot_number) DO NOTHING;

-- Insert sample charging slots for Bangalore stations
INSERT INTO public.charging_slots (station_id, slot_number, connector_type, power_output_kw, status) 
SELECT 
  cs.id,
  slot_num,
  CASE 
    WHEN slot_num % 3 = 0 THEN 'CHAdeMO'
    WHEN slot_num % 3 = 1 THEN 'CCS2'
    ELSE 'Type 2'
  END as connector_type,
  CASE 
    WHEN slot_num % 2 = 0 THEN 150
    ELSE 50
  END as power_output_kw,
  CASE 
    WHEN slot_num <= cs.available_slots THEN 'available'
    ELSE 'occupied'
  END as status
FROM 
  public.charging_stations cs,
  generate_series(1, cs.total_slots) as slot_num
WHERE cs.address LIKE '%Bangalore%'
ON CONFLICT (station_id, slot_number) DO NOTHING;