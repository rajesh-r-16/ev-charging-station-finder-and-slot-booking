-- Update charging stations with Indian locations

UPDATE charging_stations 
SET 
  name = 'ChargeZone Mumbai Central',
  address = 'Shop 12, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
  latitude = 19.0596,
  longitude = 72.8295,
  price_per_hour = 150.00
WHERE name = 'Tesla Supercharger - Downtown';

UPDATE charging_stations 
SET 
  name = 'PowerUp Delhi Hub',
  address = 'Connaught Place, Block F, New Delhi, Delhi 110001',
  latitude = 28.6315,
  longitude = 77.2167,
  price_per_hour = 120.00
WHERE name = 'EV Power Hub - Mall';

UPDATE charging_stations 
SET 
  name = 'EVolt Bangalore Airport',
  address = 'Terminal 1, Kempegowda International Airport, Bangalore, Karnataka 560300',
  latitude = 13.1979,
  longitude = 77.7068,
  price_per_hour = 180.00
WHERE name = 'Green Energy Station - Airport';

UPDATE charging_stations 
SET 
  name = 'GreenCharge Hyderabad Tech City',
  address = 'HITEC City, Madhapur, Hyderabad, Telangana 500081',
  latitude = 17.4485,
  longitude = 78.3908,
  price_per_hour = 100.00
WHERE name = 'City Charge Point - Park';

UPDATE charging_stations 
SET 
  name = 'EcoCharge Chennai Marina',
  address = 'Marina Beach Road, Triplicane, Chennai, Tamil Nadu 600005',
  latitude = 13.0475,
  longitude = 80.2824,
  price_per_hour = 130.00
WHERE name = 'Metro EV Station - Transit';