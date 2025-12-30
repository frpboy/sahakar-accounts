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

const purchaseSchema = z.object({
  particulars: z.string().min(2, 'Particulars are required'),
  voucher_number: z.string().min(1, 'Voucher number is required'),
  invoice_number: z.string().optional(),
  cash_amount: z.number().min(0, 'Cash amount cannot be negative').default(0),
  upi_amount: z.number().min(0, 'UPI amount cannot be negative').default(0),
  credit_amount: z.number().min(0, 'Credit amount cannot be negative').default(0),
})

type PurchaseFormData = z.infer<typeof purchaseSchema>

export default function Purchase() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isOnline } = useNetworkStatus()

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      cash_amount: 0,
      upi_amount: 0,
      credit_amount: 0,
    }
  })

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const totalAmount = data.cash_amount + data.upi_amount + data.credit_amount
      
      if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero')
      }

      if (!isOnline) {
        const draft: Draft = {
          id: draftService.generateDraftId(),
          outletId: user!.outlet_id!,
          userId: user!.id,
          transactionType: 'PURCHASE',
          customer: {
            phone: 'PURCHASE',
            name: data.particulars
          },
          entryNumber: data.voucher_number,
          salesValue: totalAmount,
          payments: [
            { mode: 'CASH', amount: data.cash_amount },
            { mode: 'UPI', amount: data.upi_amount },
            { mode: 'CREDIT', amount: data.credit_amount }
          ],
          meta: {
            createdAt: Date.now(),
            lastEditedAt: Date.now(),
            deviceId: draftService.generateDeviceId()
          },
          status: 'DRAFT_OFFLINE'
        }

        await draftService.saveDraft(draft)
        toast.success('Purchase saved as draft (offline mode)')
      } else {
        const { error } = await supabase
          .from('purchases')
          .insert({
            particulars: data.particulars,
            voucher_number: data.voucher_number,
            invoice_number: data.invoice_number || null,
            cash_amount: data.cash_amount,
            upi_amount: data.upi_amount,
            credit_amount: data.credit_amount,
            user_id: user!.id,
            outlet_id: user!.outlet_id!
          })

        if (error) throw error
        toast.success('Purchase created successfully!')
      }

      navigate('/')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create purchase')
    }
  })

  const onSubmit = (data: PurchaseFormData) => {
    createPurchaseMutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">New Purchase</h2>
            {!isOnline && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Offline Mode - Draft
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="particulars" className="block text-sm font-medium text-gray-700">
                Particulars *
              </label>
              <input
                type="text"
                id="particulars"
                {...register('particulars')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter purchase particulars"
              />
              {errors.particulars && (
                <p className="mt-1 text-sm text-red-600">{errors.particulars.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="voucher_number" className="block text-sm font-medium text-gray-700">
                  Voucher Number *
                </label>
                <input
                  type="text"
                  id="voucher_number"
                  {...register('voucher_number')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter voucher number"
                />
                {errors.voucher_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.voucher_number.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
                  Invoice Number (Optional)
                </label>
                <input
                  type="text"
                  id="invoice_number"
                  {...register('invoice_number')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter invoice number"
                />
                {errors.invoice_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.invoice_number.message}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div>
                  <label htmlFor="credit_amount" className="block text-sm font-medium text-gray-700">
                    Credit Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="credit_amount"
                    {...register('credit_amount', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.credit_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.credit_amount.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{(watch('cash_amount') + watch('upi_amount') + watch('credit_amount')).toFixed(2)}
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
                disabled={createPurchaseMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {createPurchaseMutation.isPending ? 'Creating...' : (isOnline ? 'Create Purchase' : 'Save Draft')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
