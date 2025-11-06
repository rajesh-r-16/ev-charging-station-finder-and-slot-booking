-- Insert Bangalore charging stations
INSERT INTO public.charging_stations (name, address, latitude, longitude, price_per_hour, available_slots, total_slots, amenities) VALUES
('ElectroHub Whitefield', 'Phoenix Marketcity, Whitefield, Bangalore 560066', 12.9976, 77.6966, 110, 3, 6, ARRAY['WiFi', 'Mall', 'Food Court', 'Restroom']),
('ChargePlus Koramangala', '100 Feet Road, Koramangala, Bangalore 560034', 12.9352, 77.6245, 95, 4, 5, ARRAY['WiFi', 'Cafe', 'ATM', 'Restroom']),
('PowerHub Indiranagar', 'CMH Road, Indiranagar, Bangalore 560038', 12.9716, 77.6412, 105, 2, 4, ARRAY['WiFi', 'Parking', 'Restroom']),
('SpeedyEV Electronic City', 'Electronic City Phase 1, Bangalore 560100', 12.8399, 77.6770, 85, 5, 8, ARRAY['WiFi', 'Corporate', 'Restroom', 'Security']),
('QuickCharge MG Road', 'MG Road Metro Station, Bangalore 560001', 12.9752, 77.6070, 120, 1, 3, ARRAY['WiFi', 'Metro', 'Shopping', 'ATM']),
('VoltStation Jayanagar', '4th Block, Jayanagar, Bangalore 560011', 12.9250, 77.5937, 90, 3, 5, ARRAY['WiFi', 'Parking', 'Cafe', 'Restroom'])
ON CONFLICT (id) DO NOTHING;