import { Link } from 'react-router-dom'
import {
  PlusIcon,
  ArrowUturnLeftIcon,
  ShoppingCartIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'

export default function DailyEntries() {
  const entryTypes = [
    {
      name: 'New Sales',
      description: 'Create new sales entry with payment modes',
      href: '/sales/new',
      icon: PlusIcon,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Sales Return',
      description: 'Process sales returns and refunds',
      href: '/sales/return',
      icon: ArrowUturnLeftIcon,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      name: 'Purchase',
      description: 'Record new purchase entries',
      href: '/purchase/new',
      icon: ShoppingCartIcon,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Credit Received',
      description: 'Record credit payments received',
      href: '/credit/received',
      icon: CurrencyRupeeIcon,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Entries</h1>
        <p className="mt-1 text-sm text-gray-600">
          Choose the type of entry you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {entryTypes.map((entry) => (
          <Link
            key={entry.name}
            to={entry.href}
            className="group block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${entry.color} transition-colors duration-200`}>
                <entry.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {entry.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {entry.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-500">Today's Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-500">Today's Purchases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-500">Credit Received</div>
          </div>
        </div>
      </div>
    </div>
  )
}
