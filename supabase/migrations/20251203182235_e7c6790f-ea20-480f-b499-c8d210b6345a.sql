-- Insert sample V2V listings with diverse locations across Delhi NCR and Bangalore
INSERT INTO v2v_listings (provider_user_id, available_energy_kwh, price_per_kwh, min_transfer_kwh, max_transfer_kwh, location, available_from, available_until, status)
VALUES 
  -- Delhi NCR listings
  ('26f095fd-631d-4011-8ab4-b44e88483b6b', 25, 12, 5, 20, '{"lat": 28.6139, "lng": 77.2090, "address": "Connaught Place, New Delhi"}', NOW(), NOW() + INTERVAL '8 hours', 'active'),
  ('af2ba38e-79f2-4728-9f34-7fd8fd9d0edc', 30, 14, 5, 25, '{"lat": 28.5574, "lng": 77.2819, "address": "Nehru Place, New Delhi"}', NOW(), NOW() + INTERVAL '6 hours', 'active'),
  ('5d686af0-51e8-4301-a2a6-6884d6adc705', 15, 10, 3, 12, '{"lat": 28.4595, "lng": 77.0266, "address": "Cyber Hub, Gurgaon"}', NOW(), NOW() + INTERVAL '4 hours', 'active'),
  ('9ecc2cc9-2b89-42ae-8296-c7365390e54b', 40, 15, 10, 35, '{"lat": 28.5355, "lng": 77.2410, "address": "Saket, New Delhi"}', NOW(), NOW() + INTERVAL '10 hours', 'active'),
  -- Bangalore listings
  ('26f095fd-631d-4011-8ab4-b44e88483b6b', 20, 11, 5, 15, '{"lat": 12.9716, "lng": 77.5946, "address": "Koramangala, Bangalore"}', NOW(), NOW() + INTERVAL '5 hours', 'active'),
  ('af2ba38e-79f2-4728-9f34-7fd8fd9d0edc', 35, 13, 8, 30, '{"lat": 12.9352, "lng": 77.6245, "address": "HSR Layout, Bangalore"}', NOW(), NOW() + INTERVAL '7 hours', 'active');

-- Create vehicle profiles for users who don't have one (needed for V2G/V2V)
INSERT INTO vehicle_profiles (user_id, vehicle_model, battery_capacity_kwh, max_charging_rate_kw, connector_types, current_soc_percent, avg_consumption_kwh_per_km)
SELECT 
  p.user_id,
  CASE 
    WHEN p.user_id = '26f095fd-631d-4011-8ab4-b44e88483b6b' THEN 'Tata Nexon EV Max'
    WHEN p.user_id = 'af2ba38e-79f2-4728-9f34-7fd8fd9d0edc' THEN 'MG ZS EV'
    WHEN p.user_id = '5d686af0-51e8-4301-a2a6-6884d6adc705' THEN 'Hyundai Kona Electric'
    ELSE 'Generic EV'
  END,
  CASE 
    WHEN p.user_id = '26f095fd-631d-4011-8ab4-b44e88483b6b' THEN 40.5
    WHEN p.user_id = 'af2ba38e-79f2-4728-9f34-7fd8fd9d0edc' THEN 50.3
    WHEN p.user_id = '5d686af0-51e8-4301-a2a6-6884d6adc705' THEN 39.2
    ELSE 45.0
  END,
  CASE 
    WHEN p.user_id = '26f095fd-631d-4011-8ab4-b44e88483b6b' THEN 50
    WHEN p.user_id = 'af2ba38e-79f2-4728-9f34-7fd8fd9d0edc' THEN 76
    WHEN p.user_id = '5d686af0-51e8-4301-a2a6-6884d6adc705' THEN 77
    ELSE 50
  END,
  ARRAY['CCS2', 'Type2'],
  FLOOR(60 + RANDOM() * 35)::numeric,
  0.16
FROM profiles p
WHERE p.user_id IN ('26f095fd-631d-4011-8ab4-b44e88483b6b', 'af2ba38e-79f2-4728-9f34-7fd8fd9d0edc', '5d686af0-51e8-4301-a2a6-6884d6adc705')
AND NOT EXISTS (SELECT 1 FROM vehicle_profiles vp WHERE vp.user_id = p.user_id);