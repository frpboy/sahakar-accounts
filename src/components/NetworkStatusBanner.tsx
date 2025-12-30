import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) return null

  return (
    <div className={`${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-b px-4 py-2`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon 
            className={`h-5 w-5 ${isOnline ? 'text-green-400' : 'text-red-400'}`} 
            aria-hidden="true" 
          />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
            {isOnline 
              ? 'You are back online. You can now submit your drafts.' 
              : 'You are offline. Your entries will be saved as drafts.'}
          </p>
        </div>
      </div>
    </div>
  )
}