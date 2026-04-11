import { supabase } from './supabase'

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

export type Order = {
  id: string;
  status: string;
  summary: string;
  date: string;
};

export type Message = {
  id: string;
  title: string;
  body: string;
  date: string;
};

export type CompanyInfo = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
};

// Database functions
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    return null;
  }

  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }

  return data;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data || [];
}

export async function getMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  // For now, return hardcoded data. In a real app, this would come from a database table
  return {
    company: "Siêu Thị Giấy",
    contactName: "Nguyễn Văn A",
    email: "contact@sieuthigiay.vn",
    phone: "+84 123 456 789",
  };
}

// Legacy exports for backward compatibility (will be removed)
export const products: Product[] = [];
export const cartItems: CartItem[] = [];
export const accountInfo = {
  company: "Siêu Thị Giấy",
  contactName: "Nguyễn Văn A",
  email: "contact@sieuthigiay.vn",
  phone: "+84 123 456 789",
  messages: [] as Message[],
  orders: [] as Order[],
};
