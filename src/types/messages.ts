// Message types for product-level conversations

export interface ProductMessage {
  id: string
  cart_item_id: string
  sender_id: string
  sender_role: 'customer' | 'admin'
  message: string
  created_at: string
}

export interface MessageListResponse {
  messages: ProductMessage[]
  error?: string
}

export interface SendMessageRequest {
  cart_item_id: string
  message: string
}

export interface SendMessageResponse {
  success: boolean
  message?: ProductMessage
  error?: string
}
