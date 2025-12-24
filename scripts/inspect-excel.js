const XLSX = require('xlsx');

const filePath = './ACCOUNTS Demo Data/HYPER PHARMACY/TIRUR/2025/DECEMBER/DECEMBER 2025 TIRUR SAHAKAR HYPER PHARMACY ACCOUNTS REPORT.xlsx';
const wb = XLSX.readFile(filePath);

console.log('📋 Sheet Names:', wb.SheetNames);
console.log('\n');

const firstSheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

console.log('🔍 First 10 rows of data:');
data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});

console.log('\n\n📊 Data as JSON (with headers):');
const jsonData = XLSX.utils.sheet_to_json(firstSheet);
console.log('First record:', jsonData[0]);
console.log('Columns:', jsonData.length > 0 ? Object.keys(jsonData[0]) : 'No data');
