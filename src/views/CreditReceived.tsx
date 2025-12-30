import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { draftService } from '../services/draftService'
import { Draft } from '../types/database'

const creditReceivedSchema = z.object({
  customer_phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  customer_name: z.string().min(2, 'Customer name is required'),
  entry_number: z.string().min(1, 'Entry number is required'),
  cash_amount: z.number().min(0, 'Cash amount cannot be negative').default(0),
  upi_amount: z.number().min(0, 'UPI amount cannot be negative').default(0),
})

type CreditReceivedFormData = z.infer<typeof creditReceivedSchema>

export default function CreditReceived() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isOnline } = useNetworkStatus()

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CreditReceivedFormData>({
    resolver: zodResolver(creditReceivedSchema),
    defaultValues: {
      cash_amount: 0,
      upi_amount: 0,
    }
  })

  const createCreditReceivedMutation = useMutation({
    mutationFn: async (data: CreditReceivedFormData) => {
      const totalAmount = data.cash_amount + data.upi_amount
      
      if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero')
      }

      if (!isOnline) {
        const draft: Draft = {
          id: draftService.generateDraftId(),
          outletId: user!.outlet_id!,
          userId: user!.id,
          transactionType: 'CREDIT_RECEIVED',
          customer: {
            phone: data.customer_phone,
            name: data.customer_name
          },
          entryNumber: data.entry_number,
          salesValue: totalAmount,
          payments: [
            { mode: 'CASH', amount: data.cash_amount },
            { mode: 'UPI', amount: data.upi_amount }
          ],
          meta: {
            createdAt: Date.now(),
            lastEditedAt: Date.now(),
            deviceId: draftService.generateDeviceId()
          },
          status: 'DRAFT_OFFLINE'
        }

        await draftService.saveDraft(draft)
        toast.success('Credit received saved as draft (offline mode)')
      } else {
        const { error } = await supabase
          .from('credit_received')
          .insert({
            entry_number: data.entry_number,
            customer_id: data.customer_phone,
            cash_amount: data.cash_amount,
            upi_amount: data.upi_amount,
            user_id: user!.id,
            outlet_id: user!.outlet_id!
          })

        if (error) throw error
        toast.success('Credit received created successfully!')
      }

      navigate('/')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create credit received')
    }
  })

  const onSubmit = (data: CreditReceivedFormData) => {
    createCreditReceivedMutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Credit Received</h2>
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
                />
                {errors.customer_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
                )}
              </div>
            </div>

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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cash_amount" className="block text-sm font-medium text-gray-700">
                    Cash Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="cash_amount"
                    {...register('cash_amount', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.cash_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.cash_amount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="upi_amount" className="block text-sm font-medium text-gray-700">
                    UPI Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="upi_amount"
                    {...register('upi_amount', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.upi_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.upi_amount.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{(watch('cash_amount') + watch('upi_amount')).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

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
                disabled={createCreditReceivedMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {createCreditReceivedMutation.isPending ? 'Creating...' : (isOnline ? 'Create Entry' : 'Save Draft')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
