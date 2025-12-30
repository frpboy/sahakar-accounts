'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Clock, Users, Download, Filter } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

interface Anomaly {
  id: string;
  outlet_id: string;
  transaction_id: string | null;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any>;
}

interface AnomalyStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  resolved: number;
  unresolved: number;
  by_type: Record<string, number>;
  by_outlet: Record<string, number>;
  trend: Array<{ date: string; count: number }>;
}

export function AnomalyDashboard() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ['anomalies', selectedSeverity, selectedType, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        severity: selectedSeverity,
        type: selectedType,
        date_range: dateRange,
      });
      const res = await fetch(`/api/anomalies?${params}`);
      if (!res.ok) throw new Error('Failed to fetch anomalies');
      return res.json();
    },
  });

  const { data: stats = {} as AnomalyStats } = useQuery({
    queryKey: ['anomaly-stats'],
    queryFn: async () => {
      const res = await fetch('/api/anomalies/stats');
      if (!res.ok) throw new Error('Failed to fetch anomaly stats');
      return res.json();
    },
  });

  const severityColors = {
    critical: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const typeIcons = {
    amount_variance: TrendingUp,
    frequency_spike: AlertTriangle,
    time_anomaly: Clock,
    duplicate_transaction: AlertTriangle,
    unusual_vendor: Users,
    budget_exceeded: TrendingUp,
    negative_balance: AlertTriangle,
    unauthorized_access: AlertTriangle,
  };

  const getSeverityData = () => ({
    labels: ['Critical', 'Warning', 'Info'],
    datasets: [
      {
        data: [stats.critical || 0, stats.warning || 0, stats.info || 0],
        backgroundColor: ['#DC2626', '#F59E0B', '#3B82F6'],
        borderWidth: 0,
      },
    ],
  });

  const getTypeData = () => {
    const types = Object.keys(stats.by_type || {});
    return {
      labels: types.map(t => t.replace('_', ' ').toUpperCase()),
      datasets: [
        {
          label: 'Count',
          data: types.map(t => stats.by_type[t]),
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
        },
      ],
    };
  };

  const getTrendData = () => {
    const trend = stats.trend || [];
    return {
      labels: trend.map(t => format(new Date(t.date), 'MMM dd')),
      datasets: [
        {
          label: 'Anomalies',
          data: trend.map(t => t.count),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Anomaly Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage financial anomalies across all outlets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unresolved || 0} unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <div className="h-4 w-4 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warning || 0}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of total anomalies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Breakdown by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={getSeverityData()} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {position: 'right'}}}} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly Types</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={getTypeData()} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
            <CardDescription>7-day anomaly detection trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={getTrendData()} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Anomalies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Anomalies</CardTitle>
          <CardDescription>Latest detected anomalies requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {anomalies.anomalies?.slice(0, 5).map((anomaly: Anomaly) => {
              const Icon = typeIcons[anomaly.type as keyof typeof typeIcons] || AlertTriangle;
              return (
                <div key={anomaly.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${severityColors[anomaly.severity]} bg-opacity-10`}>
                      <Icon className={`h-4 w-4 ${severityColors[anomaly.severity].replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{anomaly.title}</h4>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {anomaly.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(anomaly.detected_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={severityColors[anomaly.severity]}>
                      {anomaly.severity.toUpperCase()}
                    </Badge>
                    {!anomaly.resolved_at && (
                      <Button variant="outline" size="sm" className="mt-2">
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}