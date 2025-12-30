import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExportModal } from './export-modal';

// Mock Radix UI components
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: any) => open ? <div>{children}</div> : null,
  Portal: ({ children }: any) => <div>{children}</div>,
  Overlay: () => <div />,
  Content: ({ children, className }: any) => <div className={className}>{children}</div>,
  Header: ({ children, className }: any) => <div className={className}>{children}</div>,
  Title: ({ children }: any) => <h2>{children}</h2>,
  Description: ({ children }: any) => <p>{children}</p>,
  Close: ({ children }: any) => <button>{children}</button>,
  Trigger: ({ children }: any) => <div>{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ExportModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        exportType: 'anomalies' as const,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when open', () => {
        render(<ExportModal {...defaultProps} />, { wrapper });
        
        expect(screen.getByText('Export Data')).toBeInTheDocument();
        expect(screen.getByText('Export anomalies data with customizable filters and formats')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<ExportModal {...defaultProps} isOpen={false} />, { wrapper });
        
        expect(screen.queryByText('Export Data')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<ExportModal {...defaultProps} />, { wrapper });
        
        // Find the close button by looking for X icon
        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);
        
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('allows format selection', () => {
        render(<ExportModal {...defaultProps} />, { wrapper });
        
        const jsonButton = screen.getByText('JSON');
        fireEvent.click(jsonButton);
        
        // JSON button should be clickable
        expect(jsonButton).toBeInTheDocument();
    });

    it('displays export configuration options', () => {
        render(<ExportModal {...defaultProps} />, { wrapper });
        
        expect(screen.getByText('Export Format')).toBeInTheDocument();
        expect(screen.getByText('Date Range')).toBeInTheDocument();
        expect(screen.getByText('Severity Filter')).toBeInTheDocument();
    });

    it('handles export button click', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ export_id: '123', status: 'processing' }),
        });

        render(<ExportModal {...defaultProps} />, { wrapper });
        
        const exportButton = screen.getByText('Start Export');
        fireEvent.click(exportButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/anomalies/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format: 'csv',
                    filters: {
                        date_range: '7d',
                        severity: 'all',
                        export_type: 'anomalies',
                    },
                }),
            });
        });
    });

    it('shows loading state during export', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() => 
            new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ export_id: '123', status: 'processing' }),
            }), 100))
        );

        render(<ExportModal {...defaultProps} />, { wrapper });
        
        const exportButton = screen.getByText('Start Export');
        fireEvent.click(exportButton);

        // The button should show loading state
        await waitFor(() => {
            expect(screen.getByText('Exporting...')).toBeInTheDocument();
        });
    });

    it('handles export errors gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        // Mock alert
        global.alert = jest.fn();

        render(<ExportModal {...defaultProps} />, { wrapper });
        
        const exportButton = screen.getByText('Start Export');
        fireEvent.click(exportButton);

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('Export failed. Please try again.');
        });
    });

    it('displays export history', async () => {
        const mockHistory = {
            exports: [
                {
                    id: '1',
                    export_type: 'anomalies',
                    format: 'csv',
                    status: 'completed',
                    record_count: 50,
                    created_at: '2024-01-15T10:00:00Z',
                    completed_at: '2024-01-15T10:01:00Z',
                    file_size_bytes: 1024,
                    expires_at: '2024-01-22T10:00:00Z',
                },
                {
                    id: '2',
                    export_type: 'anomalies',
                    format: 'json',
                    status: 'processing',
                    record_count: 0,
                    created_at: '2024-01-15T11:00:00Z',
                },
            ],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockHistory,
        });

        render(<ExportModal {...defaultProps} />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('ANOMALIES')).toBeInTheDocument();
            expect(screen.getByText('CSV')).toBeInTheDocument();
            expect(screen.getByText('JSON')).toBeInTheDocument();
            expect(screen.getByText('50')).toBeInTheDocument();
            expect(screen.getByText('Completed')).toBeInTheDocument();
            expect(screen.getByText('Processing')).toBeInTheDocument();
        });
    });

    it('shows download button for completed exports', async () => {
        const mockHistory = {
            exports: [
                {
                    id: '1',
                    export_type: 'anomalies',
                    format: 'csv',
                    status: 'completed',
                    record_count: 50,
                    created_at: '2024-01-15T10:00:00Z',
                    completed_at: '2024-01-15T10:01:00Z',
                    file_size_bytes: 1024,
                    expires_at: '2024-01-22T10:00:00Z',
                },
            ],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockHistory,
        });

        // Mock URL and document methods
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = jest.fn();
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();

        render(<ExportModal {...defaultProps} />, { wrapper });

        await waitFor(() => {
            const downloadButton = screen.getByText('Download Again');
            expect(downloadButton).toBeInTheDocument();
        });
    });

    it('shows error message for failed exports', async () => {
        const mockHistory = {
            exports: [
                {
                    id: '1',
                    export_type: 'anomalies',
                    format: 'csv',
                    status: 'failed',
                    record_count: 0,
                    created_at: '2024-01-15T10:00:00Z',
                    error_message: 'Database connection failed',
                },
            ],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockHistory,
        });

        render(<ExportModal {...defaultProps} />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Error: Database connection failed')).toBeInTheDocument();
        });
    });

    it('polls export history every 5 seconds', async () => {
        jest.useFakeTimers();

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ exports: [] }),
        });

        render(<ExportModal {...defaultProps} />, { wrapper });

        // Initial fetch
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Advance time by 5 seconds
        jest.advanceTimersByTime(5000);

        // Should trigger another fetch
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        jest.useRealTimers();
    });
});