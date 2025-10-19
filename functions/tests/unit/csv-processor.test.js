const { processCsv } = require('../../csv-processor');

describe('CSV Processor', () => {
  test('should process valid CSV data', async () => {
    const csvData = `name,email,age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25`;

    const result = await processCsv(csvData);
    
    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].name).toBe('John Doe');
    expect(result.records[0].email).toBe('john@example.com');
    expect(result.records[0].age).toBe('30');
  });

  test('should handle empty CSV data', async () => {
    await expect(processCsv('')).rejects.toThrow('Empty CSV data');
  });

  test('should handle CSV with only headers', async () => {
    const csvData = 'name,email,age';
    const result = await processCsv(csvData);
    
    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(0);
  });
});