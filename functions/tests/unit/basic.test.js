describe('Basic Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have jest defined', () => {
    expect(jest).toBeDefined();
  });
});