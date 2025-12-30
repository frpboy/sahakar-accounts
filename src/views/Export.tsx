import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { 
  DocumentArrowDownIcon,
  UserGroupIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline'

export default function Export() {
  const { user } = useAuthStore()
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [filterBy, setFilterBy] = useState<'all' | 'referred' | 'outlet'>('all')
  const [selectedReferrer, setSelectedReferrer] = useState<string>('')
  const [selectedOutlet, setSelectedOutlet] = useState<string>('')

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers-export', user?.id, filterBy, selectedReferrer, selectedOutlet],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select(`
          *,
          users!customers_referred_by_fkey(email, role),
          outlets(name)
        `)

      if (filterBy === 'referred' && selectedReferrer) {
        query = query.eq('referred_by', selectedReferrer)
      }
      
      if (filterBy === 'outlet' && selectedOutlet) {
        query = query.eq('outlet_id', selectedOutlet)
      }

      if (user?.role === 'store_manager') {
        query = query.eq('outlet_id', user.outlet_id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: staffMembers } = useQuery({
    queryKey: ['staff-for-export', user?.id],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, email, role, outlet_id')

      if (user?.role === 'store_manager') {
        query = query.eq('outlet_id', user.outlet_id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: outlets } = useQuery({
    queryKey: ['outlets-for-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    }
  })

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Customer Database Export', 14, 22)
    
    doc.setFontSize(10)
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 32)
    
    let filterText = 'Filter: All customers'
    if (filterBy === 'referred' && selectedReferrer) {
      const referrer = staffMembers?.find(s => s.id === selectedReferrer)
      filterText = `Filter: Customers referred by ${referrer?.email}`
    } else if (filterBy === 'outlet' && selectedOutlet) {
      const outlet = outlets?.find(o => o.id === selectedOutlet)
      filterText = `Filter: Customers from ${outlet?.name}`
    }
    doc.text(filterText, 14, 38)
    
    const headers = [['Name', 'Phone', 'Referred By', 'Outlet', 'Date Added']]
    const data = customers?.map(customer => [
      customer.name,
      customer.phone,
      customer.users?.email || 'Unknown',
      customer.outlets?.name || 'Unknown',
      format(new Date(customer.created_at), 'PP')
    ]) || []

    ;(doc as any).autoTable({
      head: headers,
      body: data,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    })

    const filename = `customers_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(filename)
  }

  const exportToExcel = () => {
    const data = customers?.map(customer => ({
      'Name': customer.name,
      'Phone': customer.phone,
      'Referred By': customer.users?.email || 'Unknown',
      'Outlet': customer.outlets?.name || 'Unknown',
      'Date Added': format(new Date(customer.created_at), 'PP'),
      'Role': customer.users?.role || 'Unknown'
    })) || []

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Customers')

    const colWidths = [
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 }
    ]
    ws['!cols'] = colWidths

    const filename = `customers_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const exportToCSV = () => {
    const data = customers?.map(customer => ({
      'Name': customer.name,
      'Phone': customer.phone,
      'Referred By': customer.users?.email || 'Unknown',
      'Outlet': customer.outlets?.name || 'Unknown',
      'Date Added': format(new Date(customer.created_at), 'PP'),
      'Role': customer.users?.role || 'Unknown'
    })) || []

    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const handleExport = () => {
    if (!customers || customers.length === 0) {
      alert('No customers to export')
      return
    }

    switch (selectedFormat) {
      case 'pdf':
        exportToPDF()
        break
      case 'excel':
        exportToExcel()
        break
      case 'csv':
        exportToCSV()
        break
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export Customer Database</h1>
        <p className="mt-1 text-sm text-gray-600">
          Export customer data in various formats with filtering options
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Export Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              {[
                { value: 'pdf', label: 'PDF Document', icon: '📄' },
                { value: 'excel', label: 'Excel Spreadsheet', icon: '📊' },
                { value: 'csv', label: 'CSV File', icon: '📋' }
              ].map((format) => (
                <label key={format.value} className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 flex items-center text-sm text-gray-700">
                    <span className="mr-2">{format.icon}</span>
                    {format.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Options
            </label>
            <div className="space-y-3">
              <select
                value={filterBy}
                onChange={(e) => {
                  setFilterBy(e.target.value as any)
                  setSelectedReferrer('')
                  setSelectedOutlet('')
                }}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Customers</option>
                <option value="referred">Filter by Referrer</option>
                <option value="outlet">Filter by Outlet</option>
              </select>

              {filterBy === 'referred' && (
                <select
                  value={selectedReferrer}
                  onChange={(e) => setSelectedReferrer(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Referrer</option>
                  {staffMembers?.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.email} ({staff.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              )}

              {filterBy === 'outlet' && (
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Outlet</option>
                  {outlets?.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Preview</h2>
          <div className="text-sm text-gray-500">
            {customers?.length || 0} customers found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
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
              {customers?.slice(0, 10).map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.users?.email || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.outlets?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(customer.created_at), 'PP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers && customers.length > 10 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Showing first 10 of {customers.length} customers
            </div>
          )}

          {(!customers || customers.length === 0) && (
            <div className="text-center py-8 text-sm text-gray-500">
              No customers found with current filters
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={!customers || customers.length === 0}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
          Export as {selectedFormat.toUpperCase()}
        </button>
      </div>
    </div>
  )
}
