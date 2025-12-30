export type UserRole = 'admin' | 'store_manager' | 'store_user'

export interface Outlet {
  id: string
  name: string
  address: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  role: UserRole
  outlet_id: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  phone: string
  name: string
  referred_by: string
  outlet_id: string
  created_at: string
  updated_at: string
}

export interface PaymentMode {
  mode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
  amount: number
}

export interface Sale {
  id: string
  entry_number: string
  customer_id: string
  sales_value: number
  payment_modes: PaymentMode[]
  user_id: string
  outlet_id: string
  created_at: string
}

export interface SalesReturn {
  id: string
  entry_number: string
  customer_id: string
  cash_amount: number
  upi_amount: number
  user_id: string
  outlet_id: string
  created_at: string
}

export interface Purchase {
  id: string
  particulars: string
  voucher_number: string
  invoice_number: string | null
  cash_amount: number
  upi_amount: number
  credit_amount: number
  user_id: string
  outlet_id: string
  created_at: string
}

export interface CreditReceived {
  id: string
  entry_number: string
  customer_id: string
  cash_amount: number
  upi_amount: number
  user_id: string
  outlet_id: string
  created_at: string
}

export interface Draft {
  id: string
  outletId: string
  userId: string
  transactionType: 'SALE' | 'SALE_RETURN' | 'PURCHASE' | 'CREDIT_RECEIVED'
  customer: {
    phone: string
    name?: string
    referredBy?: string
  }
  entryNumber: string
  salesValue?: number
  payments: PaymentMode[]
  meta: {
    createdAt: number
    lastEditedAt: number
    deviceId: string
  }
  status: 'DRAFT_OFFLINE'
}