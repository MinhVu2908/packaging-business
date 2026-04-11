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
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO products (id, name, category, layers, linerboard, medium, description, price) VALUES
('pack-3layer-a', 'Giấy Carton 3 Lớp A', '3 lớp', '3 lớp', 'Testliner', 'B-Flute', 'Giấy carton 3 lớp nhẹ, phù hợp cho đóng gói hàng hóa tiêu dùng và bảo vệ sản phẩm.', 4500),
('pack-3layer-b', 'Giấy Carton 3 Lớp B', '3 lớp', '3 lớp', 'Kraftliner', 'C-Flute', 'Sản phẩm 3 lớp cao cấp hơn với độ bền tăng cường cho hàng hóa nặng vừa.', 5500),
('pack-5layer-a', 'Giấy Carton 5 Lớp A', '5 lớp', '5 lớp', 'Kraftliner', 'BC-Flute', 'Giấy carton 5 lớp gia cố tối đa dành cho thiết kế bao bì chịu lực và vận chuyển chuyên nghiệp.', 9800),
('pack-5layer-b', 'Giấy Carton 5 Lớp B', '5 lớp', '5 lớp', 'Testliner', 'EB-Flute', 'Giấy 5 lớp thân thiện với môi trường, đa dụng cho sản phẩm nội thất, điện tử và vật tư công nghiệp.', 10200);

INSERT INTO orders (id, status, summary, date) VALUES
('order-5021', 'Đã hoàn thành', 'Giấy carton 3 lớp B - 20 kiện', '2026-03-15'),
('order-5034', 'Đang xử lý', 'Giấy carton 5 lớp A - 10 kiện', '2026-03-28');

INSERT INTO messages (id, title, body, date) VALUES
('msg-1', 'Xác nhận đơn hàng mẫu', 'Đơn hàng mẫu của bạn đã được nhận. Chúng tôi sẽ liên hệ để chốt kích thước và vật liệu.', '2026-04-06'),
('msg-2', 'Gửi file thiết kế', 'Xin vui lòng gửi file thiết kế nếu cần in ấn trên bao bì. Hỗ trợ định dạng AI/PDF/PNG.', '2026-04-04');