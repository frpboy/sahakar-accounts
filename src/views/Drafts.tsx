import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { draftService } from '../services/draftService'
import { Draft } from '../types/database'
import { 
  DocumentDuplicateIcon, 
  TrashIcon, 
  ArrowUpTrayIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

export default function Drafts() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isOnline } = useNetworkStatus()
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set())

  const { data: drafts, refetch: refetchDrafts } = useQuery({
    queryKey: ['drafts', user?.id],
    queryFn: async () => {
      if (!user) return []
      return await draftService.getDrafts(user.id)
    },
    enabled: !!user
  })

  const submitDraftMutation = useMutation({
    mutationFn: async (draft: Draft) => {
      if (!isOnline) {
        throw new Error('You must be online to submit drafts')
      }

      switch (draft.transactionType) {
        case 'SALE':
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', draft.customer.phone)
            .single()

          if (!existingCustomer) {
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert({
                phone: draft.customer.phone,
                name: draft.customer.name || 'Unknown',
                referred_by: draft.customer.referredBy || user!.id,
                outlet_id: draft.outletId
              })
              .select()
              .single()

            if (customerError) throw customerError
            draft.customer.phone = newCustomer.id
          } else {
            draft.customer.phone = existingCustomer.id
          }

          const { error: saleError } = await supabase
            .from('sales')
            .insert({
              entry_number: draft.entryNumber,
              customer_id: draft.customer.phone,
              sales_value: draft.salesValue || 0,
              payment_modes: draft.payments,
              user_id: draft.userId,
              outlet_id: draft.outletId
            })

          if (saleError) throw saleError
          break

        case 'SALE_RETURN':
          const { error: returnError } = await supabase
            .from('sales_returns')
            .insert({
              entry_number: draft.entryNumber,
              customer_id: draft.customer.phone,
              cash_amount: draft.payments.find(p => p.mode === 'CASH')?.amount || 0,
              upi_amount: draft.payments.find(p => p.mode === 'UPI')?.amount || 0,
              user_id: draft.userId,
              outlet_id: draft.outletId
            })

          if (returnError) throw returnError
          break

        case 'PURCHASE':
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              particulars: draft.customer.name,
              voucher_number: draft.entryNumber,
              cash_amount: draft.payments.find(p => p.mode === 'CASH')?.amount || 0,
              upi_amount: draft.payments.find(p => p.mode === 'UPI')?.amount || 0,
              credit_amount: draft.payments.find(p => p.mode === 'CREDIT')?.amount || 0,
              user_id: draft.userId,
              outlet_id: draft.outletId
            })

          if (purchaseError) throw purchaseError
          break

        case 'CREDIT_RECEIVED':
          const { error: creditError } = await supabase
            .from('credit_received')
            .insert({
              entry_number: draft.entryNumber,
              customer_id: draft.customer.phone,
              cash_amount: draft.payments.find(p => p.mode === 'CASH')?.amount || 0,
              upi_amount: draft.payments.find(p => p.mode === 'UPI')?.amount || 0,
              user_id: draft.userId,
              outlet_id: draft.outletId
            })

          if (creditError) throw creditError
          break
      }

      await draftService.deleteDraft(draft.id)
      
      setSelectedDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draft.id)
        return newSet
      })
    },
    onSuccess: () => {
      toast.success('Draft submitted successfully!')
      refetchDrafts()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit draft')
    }
  })

  const submitAllDraftsMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        throw new Error('You must be online to submit drafts')
      }

      const selectedDraftList = drafts?.filter(draft => selectedDrafts.has(draft.id)) || []
      
      for (const draft of selectedDraftList) {
        await submitDraftMutation.mutateAsync(draft)
      }
    },
    onSuccess: () => {
      toast.success('All selected drafts submitted successfully!')
      setSelectedDrafts(new Set())
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit drafts')
    }
  })

  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      await draftService.deleteDraft(draftId)
      setSelectedDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    },
    onSuccess: () => {
      toast.success('Draft deleted successfully!')
      refetchDrafts()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete draft')
    }
  })

  const handleDraftSelect = (draftId: string) => {
    setSelectedDrafts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(draftId)) {
        newSet.delete(draftId)
      } else {
        newSet.add(draftId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedDrafts.size === drafts?.length) {
      setSelectedDrafts(new Set())
    } else {
      setSelectedDrafts(new Set(drafts?.map(d => d.id) || []))
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'SALE': return 'bg-blue-100 text-blue-800'
      case 'SALE_RETURN': return 'bg-orange-100 text-orange-800'
      case 'PURCHASE': return 'bg-green-100 text-green-800'
      case 'CREDIT_RECEIVED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'SALE': return 'Sale'
      case 'SALE_RETURN': return 'Sales Return'
      case 'PURCHASE': return 'Purchase'
      case 'CREDIT_RECEIVED': return 'Credit Received'
      default: return 'Unknown'
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review and submit your offline drafts
          </p>
        </div>
        
        {!isOnline && (
          <div className="flex items-center text-yellow-600">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Offline Mode</span>
          </div>
        )}
      </div>

      {drafts && drafts.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedDrafts.size === drafts.length}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                {selectedDrafts.size} of {drafts.length} drafts selected
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => submitAllDraftsMutation.mutate()}
                disabled={selectedDrafts.size === 0 || !isOnline || submitAllDraftsMutation.isPending}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                Submit Selected
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {drafts?.map((draft) => (
          <div key={draft.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedDrafts.has(draft.id)}
                  onChange={() => handleDraftSelect(draft.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(draft.transactionType)}`}>
                      {getTransactionTypeLabel(draft.transactionType)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Created {new Date(draft.meta.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Customer:</span>
                      <div className="text-gray-900">{draft.customer.name || 'Unknown'}</div>
                      <div className="text-gray-500">{draft.customer.phone}</div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Entry Number:</span>
                      <div className="text-gray-900">{draft.entryNumber}</div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Amount:</span>
                      <div className="text-gray-900">
                        ₹{draft.salesValue?.toLocaleString('en-IN') || '0.00'}
                      </div>
                    </div>
                  </div>
                  
                  {draft.payments.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Payment Breakdown:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {draft.payments.map((payment, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {payment.mode}: ₹{payment.amount.toLocaleString('en-IN')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => submitDraftMutation.mutate(draft)}
                  disabled={!isOnline || submitDraftMutation.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                  Submit
                </button>
                
                <button
                  onClick={() => deleteDraftMutation.mutate(draft.id)}
                  disabled={deleteDraftMutation.isPending}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!drafts || drafts.length === 0) && (
        <div className="text-center py-12">
          <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your offline drafts will appear here when you create entries while offline.
          </p>
        </div>
      )}
    </div>
  )
}
