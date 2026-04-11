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
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Supabase connection error:', error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', { id, error });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return null;
  }
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  try {
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
  } catch (error) {
    console.error('Supabase connection error:', error);
    return null;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
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
  } catch (error) {
    console.error('Supabase connection error:', error);
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}

export async function getOrders(): Promise<Order[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Supabase connection error:', error);
    return [];
  }
}

export async function getMessages(): Promise<Message[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Supabase connection error:', error);
    return [];
  }
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        company: "Siêu Thị Giấy",
        contactName: "Nguyễn Văn A",
        email: "contact@sieuthigiay.vn",
        phone: "+84 123 456 789",
      }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // Return default info if no profile exists
      return {
        company: "Siêu Thị Giấy",
        contactName: user.email?.split('@')[0] || "User",
        email: user.email || "",
        phone: "",
      }
    }

    return {
      company: data.company_name || "Siêu Thị Giấy",
      contactName: data.contact_name || user.email?.split('@')[0] || "User",
      email: user.email || "",
      phone: data.phone || "",
    }
  } catch (error) {
    console.error('Error fetching company info:', error);
    return {
      company: "Siêu Thị Giấy",
      contactName: "Nguyễn Văn A",
      email: "contact@sieuthigiay.vn",
      phone: "+84 123 456 789",
    }
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'user_id'>): Promise<Order | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const orderId = `order-${Date.now()}`
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...order,
        id: orderId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return null;
  }
}

export async function createMessage(message: Omit<Message, 'id' | 'user_id'>): Promise<Message | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const messageId = `msg-${Date.now()}`
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...message,
        id: messageId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return null;
  }
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
