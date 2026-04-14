-- Per-line fulfillment: pending → on_delivery → delivered, or cancelled.
-- Run in Supabase SQL editor if your project predates this column.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS item_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (item_status IN ('pending', 'on_delivery', 'delivered', 'cancelled'));

DROP POLICY IF EXISTS "Admins can update all order items" ON order_items;

CREATE POLICY "Admins can update all order items" ON order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );
