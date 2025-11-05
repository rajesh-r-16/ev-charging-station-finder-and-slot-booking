-- Insert sample EV charging stations in Delhi area
INSERT INTO public.charging_stations (name, address, latitude, longitude, price_per_hour, available_slots, total_slots, amenities) VALUES
('PowerHub Connaught Place', 'Connaught Place, New Delhi, Delhi 110001', 28.6304, 77.2177, 120, 3, 5, ARRAY['WiFi', 'Cafe', 'Restroom', 'Shopping']),
('ChargePlus Saket', 'Select Citywalk Mall, Saket, New Delhi 110017', 28.5244, 77.2066, 100, 4, 6, ARRAY['WiFi', 'Mall', 'Restroom', 'Food Court']),
('EcoCharge Nehru Place', 'Nehru Place Metro Station, New Delhi 110019', 28.5494, 77.2501, 90, 2, 4, ARRAY['WiFi', 'ATM', 'Restroom']),
('VoltStation Dwarka', 'Sector 21, Dwarka, New Delhi 110077', 28.5921, 77.0460, 110, 0, 5, ARRAY['WiFi', 'Parking', 'Restroom', 'Security']),
('QuickCharge Hauz Khas', 'Hauz Khas Village, New Delhi 110016', 28.5494, 77.1986, 130, 1, 3, ARRAY['WiFi', 'Cafe', 'Shopping', 'Restroom']),
('SpeedyEV Rajouri Garden', 'Rajouri Garden Metro, New Delhi 110027', 28.6409, 77.1210, 95, 5, 8, ARRAY['WiFi', 'Metro', 'Restroom', 'ATM']),
('MegaCharge Noida Sector 18', 'Atta Market, Sector 18, Noida 201301', 28.5678, 77.3261, 105, 2, 6, ARRAY['WiFi', 'Mall', 'Food Court', 'Restroom']),
('GreenPower Gurgaon Cyber City', 'Cyber City, DLF Phase 2, Gurgaon 122002', 28.4950, 77.0890, 140, 3, 7, ARRAY['WiFi', 'Corporate', 'Cafe', 'Restroom']),
('FastCharge Karol Bagh', 'Karol Bagh Metro Station, New Delhi 110005', 28.6519, 77.1903, 85, 4, 5, ARRAY['WiFi', 'Metro', 'Shopping', 'ATM']),
('ElectroHub Vasant Kunj', 'Ambience Mall, Vasant Kunj, New Delhi 110070', 28.5207, 77.1577, 125, 1, 4, ARRAY['WiFi', 'Mall', 'Cinema', 'Restroom'])
ON CONFLICT (id) DO NOTHING;