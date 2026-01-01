import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportConfig {
    filename: string;
    sheetName?: string;
    title?: string;
    subtitle?: string;
}

/**
 * Common export utility for Sahakar Accounts
 */
export const exportUtils = {
    /**
     * Export to Excel (.xlsx)
     */
    toExcel: (data: any[], config: ExportConfig) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || 'Report');
        XLSX.writeFile(workbook, `${config.filename}_${new Date().getTime()}.xlsx`);
    },

    /**
     * Export to CSV
     */
    toCSV: (data: any[], config: ExportConfig) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${config.filename}_${new Date().getTime()}.csv`;
        link.click();
    },

    /**
     * Export to PDF
     */
    toPDF: (columns: string[], data: any[][], config: ExportConfig) => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.text(config.title || 'Sahakar Accounts Report', 14, 22);

        // Add Subtitle
        if (config.subtitle) {
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(config.subtitle, 14, 30);
        }

        autoTable(doc, {
            head: [columns],
            body: data,
            startY: config.subtitle ? 35 : 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 41, 59] }, // Slate-800
        });

        doc.save(`${config.filename}_${new Date().getTime()}.pdf`);
    }
};
