export type Product = {
  id: string;
  name: string;
  category: string;
  layers: string;
  linerboard: string;
  medium: string;
  description: string;
  price: number;
};

export type CartItem = Product & { quantity: number };

export const products: Product[] = [
  {
    id: "pack-3layer-a",
    name: "Giấy Carton 3 Lớp A",
    category: "3 lớp",
    layers: "3 lớp",
    linerboard: "Testliner",
    medium: "B-Flute",
    description: "Giấy carton 3 lớp nhẹ, phù hợp cho đóng gói hàng hóa tiêu dùng và bảo vệ sản phẩm.",
    price: 4500,
  },
  {
    id: "pack-3layer-b",
    name: "Giấy Carton 3 Lớp B",
    category: "3 lớp",
    layers: "3 lớp",
    linerboard: "Kraftliner",
    medium: "C-Flute",
    description: "Sản phẩm 3 lớp cao cấp hơn với độ bền tăng cường cho hàng hóa nặng vừa.",
    price: 5500,
  },
  {
    id: "pack-5layer-a",
    name: "Giấy Carton 5 Lớp A",
    category: "5 lớp",
    layers: "5 lớp",
    linerboard: "Kraftliner",
    medium: "BC-Flute",
    description: "Giấy carton 5 lớp gia cố tối đa dành cho thiết kế bao bì chịu lực và vận chuyển chuyên nghiệp.",
    price: 9800,
  },
  {
    id: "pack-5layer-b",
    name: "Giấy Carton 5 Lớp B",
    category: "5 lớp",
    layers: "5 lớp",
    linerboard: "Testliner",
    medium: "EB-Flute",
    description: "Giấy 5 lớp thân thiện với môi trường, đa dụng cho sản phẩm nội thất, điện tử và vật tư công nghiệp.",
    price: 10200,
  },
];

export const cartItems: CartItem[] = [
  {
    id: "pack-3layer-a",
    name: "Giấy Carton 3 Lớp A",
    category: "3 lớp",
    layers: "3 lớp",
    linerboard: "Testliner",
    medium: "B-Flute",
    description: "Giấy carton 3 lớp nhẹ, phù hợp cho đóng gói hàng hóa tiêu dùng và bảo vệ sản phẩm.",
    price: 4500,
    quantity: 2,
  },
  {
    id: "pack-5layer-a",
    name: "Giấy Carton 5 Lớp A",
    category: "5 lớp",
    layers: "5 lớp",
    linerboard: "Kraftliner",
    medium: "BC-Flute",
    description: "Giấy carton 5 lớp gia cố tối đa dành cho thiết kế bao bì chịu lực và vận chuyển chuyên nghiệp.",
    price: 9800,
    quantity: 1,
  },
];

export const accountInfo = {
  company: "Siêu Thị Giấy",
  contactName: "Nguyễn Văn A",
  email: "contact@sieuthigiay.vn",
  phone: "+84 123 456 789",
  messages: [
    {
      id: "msg-1",
      title: "Xác nhận đơn hàng mẫu",
      body: "Đơn hàng mẫu của bạn đã được nhận. Chúng tôi sẽ liên hệ để chốt kích thước và vật liệu.",
      date: "2026-04-06",
    },
    {
      id: "msg-2",
      title: "Gửi file thiết kế",
      body: "Xin vui lòng gửi file thiết kế nếu cần in ấn trên bao bì. Hỗ trợ định dạng AI/PDF/PNG.",
      date: "2026-04-04",
    },
  ],
  orders: [
    {
      id: "order-5021",
      status: "Đã hoàn thành",
      summary: "Giấy carton 3 lớp B - 20 kiện",
      date: "2026-03-15",
    },
    {
      id: "order-5034",
      status: "Đang xử lý",
      summary: "Giấy carton 5 lớp A - 10 kiện",
      date: "2026-03-28",
    },
  ],
};
