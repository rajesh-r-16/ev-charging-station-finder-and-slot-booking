-- Enable realtime for v2v_transactions table
ALTER TABLE v2v_transactions REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE v2v_transactions;