-- Run in Supabase SQL editor if your project was created before order_items existed.

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL,
  po_number TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  length_mm INTEGER,
  width_mm INTEGER,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON order_items(user_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );
