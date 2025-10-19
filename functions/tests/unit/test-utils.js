// Test utilities
const TestUtils = {
  // Generate mock CSV data
  generateMockCsv(rows = 10, headers = ['id', 'name', 'value']) {
    let csv = headers.join(',') + '\n';
    for (let i = 0; i < rows; i++) {
      const row = headers.map(header => {
        if (header === 'id') return i;
        if (header === 'name') return `Item ${i}`;
        if (header === 'value') return i * 10;
        return `data_${header}_${i}`;
      });
      csv += row.join(',') + '\n';
    }
    return csv;
  },

  // Generate mock sales data
  generateMockSalesData(rows = 5) {
    let csv = 'date,product,quantity,price,total\n';
    for (let i = 0; i < rows; i++) {
      const date = new Date(2024, 0, i + 1).toISOString().split('T')[0];
      const product = `Product ${String.fromCharCode(65 + (i % 3))}`;
      const quantity = Math.floor(Math.random() * 10) + 1;
      const price = (Math.random() * 100 + 10).toFixed(2);
      const total = (quantity * price).toFixed(2);
      csv += `${date},${product},${quantity},${price},${total}\n`;
    }
    return csv;
  },

  // Wait for async operations
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

module.exports = TestUtils;