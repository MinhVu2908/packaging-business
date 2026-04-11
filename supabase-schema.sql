-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  layers TEXT NOT NULL,
  linerboard TEXT NOT NULL,
  medium TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart items table
CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  length_mm INTEGER NOT NULL,
  width_mm INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Insert sample data
INSERT INTO products (id, name, category, layers, linerboard, medium, description, price) VALUES
('pack-3layer-a', 'Giấy Carton 3 Lớp A', '3 lớp', '3 lớp', 'Testliner', 'B-Flute', 'Giấy carton 3 lớp nhẹ, phù hợp cho đóng gói hàng hóa tiêu dùng và bảo vệ sản phẩm.', 4500),
('pack-3layer-b', 'Giấy Carton 3 Lớp B', '3 lớp', '3 lớp', 'Kraftliner', 'C-Flute', 'Sản phẩm 3 lớp cao cấp hơn với độ bền tăng cường cho hàng hóa nặng vừa.', 5500),
('pack-5layer-a', 'Giấy Carton 5 Lớp A', '5 lớp', '5 lớp', 'Kraftliner', 'BC-Flute', 'Giấy carton 5 lớp gia cố tối đa dành cho thiết kế bao bì chịu lực và vận chuyển chuyên nghiệp.', 9800),
('pack-5layer-b', 'Giấy Carton 5 Lớp B', '5 lớp', '5 lớp', 'Testliner', 'EB-Flute', 'Giấy 5 lớp thân thiện với môi trường, đa dụng cho sản phẩm nội thất, điện tử và vật tư công nghiệp.', 10200);

-- Note: Sample orders and messages will be created when users sign up
-- INSERT INTO orders (id, user_id, status, summary, date) VALUES
-- INSERT INTO messages (id, user_id, title, body, date) VALUES