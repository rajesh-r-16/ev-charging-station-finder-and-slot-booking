-- Add sample V2G grid transactions for existing enrollment (using correct demand levels)
INSERT INTO v2g_grid_transactions (user_id, enrollment_id, energy_discharged_kwh, grid_price_per_kwh, earnings, carbon_offset_kg, grid_demand_level)
SELECT 
  '9ecc2cc9-2b89-42ae-8296-c7365390e54b',
  'c5791bfe-d518-4aa1-b2b3-36b1d3e89bc5',
  energy_kwh,
  price_kwh,
  energy_kwh * price_kwh,
  energy_kwh * 0.5,
  demand_level
FROM (
  VALUES 
    (5.2, 8.5, 'high'),
    (3.8, 7.0, 'medium'),
    (6.1, 9.2, 'high'),
    (4.5, 7.5, 'medium'),
    (2.9, 6.8, 'low')
) AS t(energy_kwh, price_kwh, demand_level);

-- Update the enrollment totals
UPDATE v2g_enrollments 
SET 
  total_energy_sold_kwh = (
    SELECT COALESCE(SUM(energy_discharged_kwh), 0) 
    FROM v2g_grid_transactions 
    WHERE enrollment_id = 'c5791bfe-d518-4aa1-b2b3-36b1d3e89bc5'
  ),
  total_earnings = (
    SELECT COALESCE(SUM(earnings), 0) 
    FROM v2g_grid_transactions 
    WHERE enrollment_id = 'c5791bfe-d518-4aa1-b2b3-36b1d3e89bc5'
  )
WHERE id = 'c5791bfe-d518-4aa1-b2b3-36b1d3e89bc5';