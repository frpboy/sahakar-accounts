import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Show notification when coming back online
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'NETWORK_STATUS_CHANGE',
            isOnline: true
          })
        }
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      
      // Notify service worker about offline status
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NETWORK_STATUS_CHANGE',
          isOnline: false
        })
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}