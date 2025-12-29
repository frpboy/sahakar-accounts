const XLSX = require('xlsx');
const path = require('path');

const files = [
    'ACCOUNTS Demo Data/HYPER PHARMACY/OUTLETS.xlsx',
    'ACCOUNTS Demo Data/SMART CLINIC/OUTLETS.xlsx'
];

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    try {
        const workbook = XLSX.readFile(fullPath);
        console.log(`\n--- ${file} ---`);
        workbook.SheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet);
            console.log(`Sheet: ${name}, Rows: ${data.length}`);
            if (data.length > 0) {
                console.log('Sample row:', data[0]);
            }
        });
    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});
