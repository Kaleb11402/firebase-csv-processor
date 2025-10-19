// Pure CSV processor with no external dependencies
const processCsv = (csvData) => {
  return new Promise((resolve, reject) => {
    // Strict empty check
    if (!csvData || csvData.trim().length === 0 || /^[\s\n\r]*$/.test(csvData)) {
      reject(new Error('Empty CSV data'));
      return;
    }

    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      
      // More strict header validation - check if all headers are empty
      const hasValidHeaders = headers.some(header => header.length > 0);
      if (!hasValidHeaders) {
        reject(new Error('No valid headers found'));
        return;
      }
      
      const results = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const values = line.split(',');
          const row = {};
          headers.forEach((header, index) => {
            // Use header if not empty, otherwise generate a default name
            const headerName = header || `column_${index + 1}`;
            row[headerName] = values[index] ? values[index].trim() : '';
          });
          results.push(row);
        }
      }
      
      // Simple console log instead of Firebase logger
      console.log(`Processed ${results.length} records`);
      
      resolve({
        success: true,
        records: results,
        total: results.length
      });
    } catch (error) {
      reject(new Error(`CSV processing error: ${error.message}`));
    }
  });
};

module.exports = { processCsv };