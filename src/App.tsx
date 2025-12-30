import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import NetworkStatusBanner from './components/NetworkStatusBanner'
import Login from './views/Login'
import Dashboard from './views/Dashboard'
import DailyEntries from './views/DailyEntries'
import NewSale from './views/NewSale'
import SalesReturn from './views/SalesReturn'
import Purchase from './views/Purchase'
import CreditReceived from './views/CreditReceived'
import Customers from './views/Customers'
import AddCustomer from './views/AddCustomer'
import Drafts from './views/Drafts'
import Export from './views/Export'

const queryClient = new QueryClient()

function App() {
  const { checkUser } = useAuthStore()

  useEffect(() => {
    // Check for existing user session
    checkUser()

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <NetworkStatusBanner />
      
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="daily-entries" element={<DailyEntries />} />
            <Route path="sales/new" element={<NewSale />} />
            <Route path="sales/return" element={<SalesReturn />} />
            <Route path="purchase/new" element={<Purchase />} />
            <Route path="credit/received" element={<CreditReceived />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/add" element={<AddCustomer />} />
            <Route path="drafts" element={<Drafts />} />
            <Route 
              path="export" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Export />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
