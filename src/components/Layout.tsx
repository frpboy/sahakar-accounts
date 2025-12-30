import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { Toaster } from 'sonner'
import { 
  HomeIcon, 
  PlusIcon, 
  UserIcon, 
  DocumentDuplicateIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline'

export default function Layout() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Daily Entries', href: '/daily-entries', icon: PlusIcon },
    { name: 'Customers', href: '/customers', icon: UserIcon },
    { name: 'Drafts', href: '/drafts', icon: DocumentDuplicateIcon },
  ]

  if (user?.role === 'admin') {
    navigation.push({ name: 'Export', href: '/export', icon: DocumentDuplicateIcon })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Sahakar Accounts</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.email} ({user?.role})
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}