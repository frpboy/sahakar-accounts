import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { draftService } from '../services/draftService'
import { PaymentMode, Draft } from '../types/database'

const saleSchema = z.object({
  customer_phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  customer_name: z.string().min(2, 'Customer name is required'),
  entry_number: z.string().min(1, 'Entry number is required'),
  sales_value: z.number().positive('Sales value must be positive'),
  payment_mode_count: z.enum(['1', '2', '3', '4']),
  payment_mode_1: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']),
  payment_amount_1: z.number().positive('Payment amount must be positive'),
  payment_mode_2: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']).optional(),
  payment_amount_2: z.number().optional(),
  payment_mode_3: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']).optional(),
  payment_amount_3: z.number().optional(),
  payment_mode_4: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']).optional(),
  payment_amount_4: z.number().optional(),
})

type SaleFormData = z.infer<typeof saleSchema>

export default function NewSale() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isOnline } = useNetworkStatus()
  const [customerFound, setCustomerFound] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      payment_mode_count: '1',
    }
  })

  const paymentModeCount = watch('payment_mode_count')
  const salesValue = watch('sales_value')

  const { data: existingCustomer } = useQuery({
    queryKey: ['customer', watch('customer_phone')],
    queryFn: async () => {
      const phone = watch('customer_phone')
      if (!phone || phone.length < 10) return null

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single()

      if (error) return null
      return data
    },
    enabled: watch('customer_phone').length >= 10
  })

  useEffect(() => {
    if (existingCustomer) {
      setValue('customer_name', existingCustomer.name)
      setCustomerFound(true)
    } else {
      setValue('customer_name', '')
      setCustomerFound(false)
    }
  }, [existingCustomer, setValue])

  useEffect(() => {
    if (salesValue && paymentModeCount === '1') {
      setValue('payment_amount_1', salesValue)
      trigger('payment_amount_1')
    }
  }, [salesValue, paymentModeCount, setValue, trigger])

  const createSaleMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const paymentModes: PaymentMode[] = []
      
      paymentModes.push({
        mode: data.payment_mode_1,
        amount: data.payment_amount_1
      })

      if (paymentModeCount >= '2' && data.payment_mode_2 && data.payment_amount_2) {
        paymentModes.push({
          mode: data.payment_mode_2,
          amount: data.payment_amount_2
        })
      }

      if (paymentModeCount >= '3' && data.payment_mode_3 && data.payment_amount_3) {
        paymentModes.push({
          mode: data.payment_mode_3,
          amount: data.payment_amount_3
        })
      }

      if (paymentModeCount >= '4' && data.payment_mode_4 && data.payment_amount_4) {
        paymentModes.push({
          mode: data.payment_mode_4,
          amount: data.payment_amount_4
        })
      }

      const totalPayment = paymentModes.reduce((sum, p) => sum + p.amount, 0)
      if (Math.abs(totalPayment - data.sales_value) > 0.01) {
        throw new Error('Total payment amount must equal sales value')
      }

      if (!isOnline) {
        const draft: Draft = {
          id: draftService.generateDraftId(),
          outletId: user!.outlet_id!,
          userId: user!.id,
          transactionType: 'SALE',
          customer: {
            phone: data.customer_phone,
            name: data.customer_name,
            referredBy: user!.id
          },
          entryNumber: data.entry_number,
          salesValue: data.sales_value,
          payments: paymentModes,
          meta: {
            createdAt: Date.now(),
            lastEditedAt: Date.now(),
            deviceId: draftService.generateDeviceId()
          },
          status: 'DRAFT_OFFLINE'
        }

        await draftService.saveDraft(draft)
        toast.success('Sale saved as draft (offline mode)')
      } else {
        if (!existingCustomer) {
          const { error: customerError } = await supabase
            .from('customers')
            .insert({
              phone: data.customer_phone,
              name: data.customer_name,
              referred_by: user!.id,
              outlet_id: user!.outlet_id!
            })

          if (customerError) throw customerError
        }

        const { error: saleError } = await supabase
          .from('sales')
          .insert({
            entry_number: data.entry_number,
            customer_id: existingCustomer?.id || data.customer_phone,
            sales_value: data.sales_value,
            payment_modes: paymentModes,
            user_id: user!.id,
            outlet_id: user!.outlet_id!
          })

        if (saleError) throw saleError
        toast.success('Sale created successfully!')
      }

      navigate('/')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create sale')
    }
  })

  const onSubmit = (data: SaleFormData) => {
    createSaleMutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">New Sale</h2>
            {!isOnline && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Offline Mode - Draft
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  id="customer_phone"
                  {...register('customer_phone')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter phone number"
                />
                {errors.customer_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>
                )}
                {customerFound && (
                  <p className="mt-1 text-sm text-green-600">Customer found!</p>
                )}
              </div>

              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customer_name"
                  {...register('customer_name')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter customer name"
                  disabled={customerFound}
                />
                {errors.customer_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entry_number" className="block text-sm font-medium text-gray-700">
                  Entry/Bill Number *
                </label>
                <input
                  type="text"
                  id="entry_number"
                  {...register('entry_number')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter bill number"
                />
                {errors.entry_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.entry_number.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="sales_value" className="block text-sm font-medium text-gray-700">
                  Sales Value (₹) *
                </label>
                <input
                  type="number"
                  id="sales_value"
                  step="0.01"
                  {...register('sales_value', { valueAsNumber: true })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter total amount"
                />
                {errors.sales_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.sales_value.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="payment_mode_count" className="block text-sm font-medium text-gray-700">
                Number of Payment Modes
              </label>
              <select
                id="payment_mode_count"
                {...register('payment_mode_count')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="1">1 Payment Mode</option>
                <option value="2">2 Payment Modes</option>
                <option value="3">3 Payment Modes</option>
                <option value="4">4 Payment Modes</option>
              </select>
            </div>

            {Array.from({ length: parseInt(paymentModeCount) }, (_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor={`payment_mode_${i + 1}`} className="block text sm font-medium text-gray-700">
                    Payment Mode {i + 1}
                  </label>
                  <select
                    id={`payment_mode_${i + 1}`}
                    {...register(`payment_mode_${i + 1}` as any)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                  {errors[`payment_mode_${i + 1}` as keyof SaleFormData] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[`payment_mode_${i + 1}` as keyof SaleFormData]?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`payment_amount_${i + 1}`} className="block text-sm font-medium text-gray-700">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id={`payment_amount_${i + 1}`}
                    {...register(`payment_amount_${i + 1}` as any, { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter amount"
                  />
                  {errors[`payment_amount_${i + 1}` as keyof SaleFormData] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[`payment_amount_${i + 1}` as keyof SaleFormData]?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/daily-entries')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSaleMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createSaleMutation.isPending ? 'Creating...' : (isOnline ? 'Create Sale' : 'Save Draft')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
