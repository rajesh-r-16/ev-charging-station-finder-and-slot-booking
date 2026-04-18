-- Lock down Realtime channel subscriptions: by default, deny all, then allow
-- only channel topics that match the authenticated user's own id.
-- Convention: channels intended for a specific user must be named "user:<auth.uid()>"
-- (or any topic that starts with that prefix, e.g. "user:<uid>:notifications").

-- Enable RLS on realtime.messages (idempotent)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist so this migration is re-runnable
DROP POLICY IF EXISTS "Authenticated users can read their own channel" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can write to their own channel" ON realtime.messages;

-- Allow a user to receive Realtime events only on their own user-scoped topic
CREATE POLICY "Authenticated users can read their own channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'user:' || auth.uid()::text
  OR realtime.topic() LIKE 'user:' || auth.uid()::text || ':%'
);

-- Allow a user to broadcast/presence only on their own user-scoped topic
CREATE POLICY "Authenticated users can write to their own channel"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'user:' || auth.uid()::text
  OR realtime.topic() LIKE 'user:' || auth.uid()::text || ':%'
);
