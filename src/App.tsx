import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import NetworkSt