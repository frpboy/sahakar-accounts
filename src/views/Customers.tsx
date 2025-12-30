import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { format } from 'date-fns'
import { UserPlusIcon } from '@heroicons/react/24/outline'

export default function Customers() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', user?.id, user?.role],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select(`
          *,
          users!customers_referred_by_fkey(email, role),
          outlets(name)
        `)

      if (user?.role === 'store_manager') {
        query = query.eq('outlet_id', user.outlet_id)
      } else if (user?.role === 'store_user') {
        query = query.eq('referred_by', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your customer database
          </p>
        </div>
        <Link
          to="/customers/add"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Add Customer
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search Customers
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search by name or phone number"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referred By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outlet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers?.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.users?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.outlets?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCustomers?.length === 0 && (
              <div className="text-center py-8">
                <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new customer.'}
                </p>
                <div className="mt-6">
                  <Link
                    to="/customers/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Add Customer
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
