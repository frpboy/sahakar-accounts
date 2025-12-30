import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { format } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { UserRole } from '../types/database'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: salesData } = useQuery({
    queryKey: ['sales', user?.id, user?.role],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          customers!inner(name, phone),
          users!inner(email, role, outlet_id)
        `)

      if (user?.role === 'store_manager') {
        query = query.eq('users.outlet_id', user.outlet_id)
      } else if (user?.role === 'store_user') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers', user?.id, user?.role],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select(`
          *,
          users!inner(email, role, outlet_id)
        `)

      if (user?.role === 'store_manager') {
        query = query.eq('users.outlet_id', user.outlet_id)
      } else if (user?.role === 'store_user') {
        query = query.eq('referred_by', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const totalSales = salesData?.reduce((sum, sale) => sum + sale.sales_value, 0) || 0
  const totalCustomers = customersData?.length || 0
  const todaySales = salesData?.filter(sale => 
    format(new Date(sale.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).reduce((sum, sale) => sum + sale.sales_value, 0) || 0

  const paymentModeData = salesData?.reduce((acc, sale) => {
    sale.payment_modes.forEach((payment: any) => {
      acc[payment.mode] = (acc[payment.mode] || 0) + payment.amount
    })
    return acc
  }, {} as Record<string, number>) || {}

  const paymentModeChartData = {
    labels: Object.keys(paymentModeData),
    datasets: [
      {
        data: Object.values(paymentModeData),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
        ],
      },
    ],
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return format(date, 'yyyy-MM-dd')
  }).reverse()

  const dailySalesData = last7Days.map(date => {
    const daySales = salesData?.filter(sale => 
      format(new Date(sale.created_at), 'yyyy-MM-dd') === date
    ).reduce((sum, sale) => sum + sale.sales_value, 0) || 0
    return {
      date: format(new Date(date), 'MMM dd'),
      sales: daySales
    }
  })

  const dailySalesChartData = {
    labels: dailySalesData.map(d => d.date),
    datasets: [
      {
        label: 'Daily Sales',
        data: dailySalesData.map(d => d.sales),
        backgroundColor: '#3B82F6',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Role: <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Today's Sales</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ₹{todaySales.toLocaleString('en-IN')}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ₹{totalSales.toLocaleString('en-IN')}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {totalCustomers}
            </dd>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Sales (Last 7 Days)</h3>
          <Bar data={dailySalesChartData} options={chartOptions} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Mode Distribution</h3>
          <Doughnut data={paymentModeChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData?.slice(0, 10).map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.entry_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.customers?.name} ({sale.customers?.phone})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{sale.sales_value.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(sale.created_at), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
