'use client';

export default function ReportsPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-600 mt-2">Detailed financial reports and analysis.</p>
            </div>

            <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Detailed Reports Coming Soon</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Advanced reporting features including category-wise breakdown and export functionality will be available in the next update.
                </p>
                <button
                    disabled
                    className="mt-6 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                >
                    Download CSV
                </button>
            </div>
        </div>
    );
}
