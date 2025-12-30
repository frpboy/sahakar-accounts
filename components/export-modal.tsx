'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, FileSpreadsheet, FileJson, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface ExportLog {
  id: string;
  export_type: string;
  format: 'csv' | 'json' | 'pdf';
  record_count: number;
  file_size_bytes: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  expires_at: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'anomalies' | 'transactions' | 'audit_logs' | 'financial_summary';
}

export function ExportModal({ isOpen, onClose, exportType }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [severity, setSeverity] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data: exportHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['export-history-anomalies'],
    queryFn: async () => {
      const res = await fetch('/api/anomalies/export?limit=10');
      if (!res.ok) throw new Error('Failed to fetch export history');
      return res.json();
    },
    enabled: isOpen,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });

  const formatIcons = {
    csv: FileSpreadsheet,
    json: FileJson,
    pdf: FileText,
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    pending: Clock,
    processing: AlertCircle,
    completed: CheckCircle,
    failed: XCircle,
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filters = {
        date_range: dateRange,
        severity: severity !== 'all' ? severity : undefined,
        export_type: exportType,
      };

      const response = await fetch('/api/anomalies/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: selectedFormat,
          filters,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      // Poll for completion
      const pollForCompletion = async (exportId: string) => {
        const maxAttempts = 60; // 5 minutes with 5-second intervals
        let attempts = 0;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const statusRes = await fetch(`/api/anomalies/export/${exportId}/status`);
          if (!statusRes.ok) continue;
          
          const status = await statusRes.json();
          
          if (status.status === 'completed') {
            // Download the file
            const downloadRes = await fetch(`/api/anomalies/export/${exportId}/download`);
            if (downloadRes.ok) {
              const blob = await downloadRes.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${exportType}_${format(new Date(), 'yyyy-MM-dd')}.${selectedFormat}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }
            break;
          } else if (status.status === 'failed') {
            throw new Error(status.error_message || 'Export failed');
          }
          
          attempts++;
        }
      };

      await pollForCompletion(result.export_id);
      refetchHistory();
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export {exportType.replace('_', ' ')} data with customizable filters and formats
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Configuration */}
          <div className="space-y-6">
            <div>
              <Label>Export Format</Label>
              <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as any)} className="mt-2">
                <div className="flex gap-4">
                  {(['csv', 'json', 'pdf'] as const).map((format) => {
                    const Icon = formatIcons[format];
                    return (
                      <div key={format} className="flex items-center space-x-2">
                        <RadioGroupItem value={format} id={format} />
                        <Label htmlFor={format} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="h-4 w-4" />
                          {format.toUpperCase()}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportType === 'anomalies' && (
              <div>
                <Label>Severity Filter</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                    <SelectItem value="warning">Warning Only</SelectItem>
                    <SelectItem value="info">Info Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Progress value={33} className="w-4 h-4 mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Export
                </>
              )}
            </Button>
          </div>

          {/* Export History */}
          <div className="space-y-4">
            <div>
              <Label>Recent Exports</Label>
              <p className="text-sm text-muted-foreground">Your export history (last 10 exports)</p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {exportHistory.exports?.map((export_: ExportLog) => {
                const Icon = formatIcons[export_.format];
                const StatusIcon = statusIcons[export_.status];
                
                return (
                  <div key={export_.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {export_.export_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {export_.format.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge className={statusColors[export_.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {export_.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{export_.record_count} records</span>
                        <span>{formatFileSize(export_.file_size_bytes)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Started: {format(new Date(export_.started_at), 'MMM dd, HH:mm')}</span>
                        {export_.completed_at && (
                          <span>Completed: {format(new Date(export_.completed_at), 'HH:mm')}</span>
                        )}
                      </div>
                      {export_.expires_at && (
                        <div className="text-orange-600 mt-1">
                          Expires: {format(new Date(export_.expires_at), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {export_.error_message && (
                        <div className="text-red-600 mt-1 text-xs">
                          Error: {export_.error_message}
                        </div>
                      )}
                    </div>

                    {export_.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={async () => {
                          const downloadRes = await fetch(`/api/anomalies/export/${export_.id}/download`);
                          if (downloadRes.ok) {
                            const blob = await downloadRes.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${export_.export_type}_${format(new Date(export_.started_at), 'yyyy-MM-dd')}.${export_.format}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          }
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Again
                      </Button>
                    )}
                  </div>
                );
              })}
              
              {exportHistory.exports?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No exports yet</p>
                  <p className="text-xs">Your export history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}