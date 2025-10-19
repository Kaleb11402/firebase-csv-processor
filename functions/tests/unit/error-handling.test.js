const { processCsv } = require('../../csv-processor');
describe('Error Handling', () => {
  test('should handle large files within limits', async () => {
    let largeCsv = 'id,name,value\n';
    for (let i = 0; i < 1000; i++) {
      largeCsv += `${i},Item ${i},${i * 10}\n`;
    }

    const result = await processCsv(largeCsv);
    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(1000);
  });

  test('should handle malformed CSV rows', async () => {
    const csvData = `name,email,age
John Doe,john@example.com,30
Incomplete Row,missing@email`; // Missing age

    const result = await processCsv(csvData);
    
    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(result.records[1].age).toBe(''); // Empty string for missing value
  });

  test('should handle whitespace-only data', async () => {
    const csvData = '   \n  \n\t\n';
    await expect(processCsv(csvData)).rejects.toThrow('Empty CSV data');
  });

  test('should handle only newlines', async () => {
    const csvData = '\n\n\n';
    await expect(processCsv(csvData)).rejects.toThrow('Empty CSV data');
  });

  test('should handle CSV with extra spaces', async () => {
    const csvData = '  name  ,  email  ,  age  \n  John Doe  ,  john@example.com  ,  30  ';
    const result = await processCsv(csvData);
    
    expect(result.success).toBe(true);
    expect(result.records[0].name).toBe('John Doe');
    expect(result.records[0].email).toBe('john@example.com');
    expect(result.records[0].age).toBe('30');
  });

  test('should handle empty headers', async () => {
    const csvData = ',,\n1,2,3';
    await expect(processCsv(csvData)).rejects.toThrow('No valid headers found');
  });

  test('should handle mixed data types', async () => {
    const csvData = `id,name,price,active
1,Product A,19.99,true
2,Product B,29.50,false`;

    const result = await processCsv(csvData);
    
    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].id).toBe('1');
    expect(result.records[0].price).toBe('19.99');
    expect(result.records[0].active).toBe('true');
  });
});