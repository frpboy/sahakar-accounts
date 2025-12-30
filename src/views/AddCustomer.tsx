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
import { Draft } from '../types/database'

const customerSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  name: z.string().min(2, 'Customer name is required').max(100, 'Name too long'),
  referred_by: z.string().uuid('Please select a staff member'),
})

type CustomerFormData = z.infer<typeof customerSchema>

export default function AddCustomer() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isOnline } = useNetworkStatus()
  const [phoneExists, setPhoneExists] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  })

  const { data: staffMembers } = useQuery({
    queryKey: ['staff', user?.id, user?.role],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, email, role')

      if (user?.role === 'store_manager') {
        query = query.eq('outlet_id', user.outlet_id)
      } else if (user?.role === 'store_user') {
        query = query.eq('id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: existingCustomer } = useQuery({
    queryKey: ['customer-phone', watch('phone')],
    queryFn: async () => {
      const phone = watch('phone')
      if (!phone || phone.length < 10) return null

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single()

      if (error) return null
      return data
    },
    enabled: watch('phone').length >= 10
  })

  useEffect(() => {
    if (existingCustomer) {
      setPhoneExists(true)
    } else {
      setPhoneExists(false)
    }
  }, [existingCustomer])

  useEffect(() => {
    if (user?.role === 'store_user') {
      setValue('referred_by', user.id)
    }
  }, [user, setValue])

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (phoneExists) {
        throw new Error('Customer with this phone number already exists')
      }

      if (!isOnline) {
        const draft: Draft = {
          id: draftService.generateDraftId(),
          outletId: user!.outlet_id!,
          userId: user!.id,
          transactionType: 'SALE',
          customer: {
            phone: data.phone,
            name: data.name,
            referredBy: data.referred_by
          },
          entryNumber: `CUSTOMER_${Date.now()}`,
          salesValue: 0,
          payments: [],
          meta: {
            createdAt: Date.now(),
            lastEditedAt: Date.now(),
            deviceId: draftService.generateDeviceId()
          },
          status: 'DRAFT_OFFLINE'
        }

        await draftService.saveDraft(draft)
        toast.success('Customer saved as draft (offline mode)')
      } else {
        const { error } = await supabase
          .from('customers')
          .insert({
            phone: data.phone,
            name: data.name,
            referred_by: data.referred_by,
            outlet_id: user!.outlet_id!
          })

        if (error) throw error
        toast.success('Customer created successfully!')
      }

      navigate('/customers')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create customer')
    }
  })

  const onSubmit = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Add New Customer</h2>
            {!isOnline && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Offline Mode - Draft
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
              {phoneExists && (
                <p className="mt-1 text-sm text-red-600">
                  Customer with this phone number already exists. Please use a different number.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Customer Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter customer name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="referred_by" className="block text-sm font-medium text-gray-700">
                Referred By Staff *
              </label>
              <select
                id="referred_by"
                {...register('referred_by')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={user?.role === 'store_user'}
              >
                <option value="">Select staff member</option>
                {staffMembers?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.email} ({staff.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
              {errors.referred_by && (
                <p className="mt-1 text-sm text-red-600">{errors.referred_by.message}</p>
              )}
              {user?.role === 'store_user' && (
                <p className="mt-1 text-sm text-gray-500">
                  Store users can only refer customers to themselves.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCustomerMutation.isPending || phoneExists}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createCustomerMutation.isPending ? 'Creating...' : (isOnline ? 'Create Customer' : 'Save Draft')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
