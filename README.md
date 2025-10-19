# 🚀 Firebase CSV Processor

A Firebase Cloud Functions project for processing CSV files with a comprehensive testing suite.  
This project demonstrates how to build, test, and deploy Firebase Cloud Functions with robust error handling and validation.

---

## ✨ Features

- **CSV Processing** – Parse, validate, and aggregate CSV data efficiently  
- **Firebase Integration** – Ready-to-deploy Cloud Functions  
- **Comprehensive Testing** – 12+ Jest unit tests for different scenarios  
- **Robust Error Handling** – Detects malformed data, empty files, and header issues  
- **Detailed Coverage** – Jest coverage reports with breakdown by file and line  

---

## 📁 Project Structure

```
firebase-csv-processor/
├── functions/
│   ├── csv-utils.js            # Pure CSV processor (no Firebase dependencies)
│   ├── csv-processor.js        # CSV processor integrated with Firebase logging
│   └── index.js                # Firebase Cloud Functions entry point
├── tests/
│   └── unit/
│       ├── basic.test.js       # Basic test setup verification
│       ├── csv-processor.test.js # CSV processing functionality tests
│       └── error-handling.test.js # Error scenario tests
├── .github/workflows/          # CI/CD (optional)
├── jest.config.js              # Jest configuration
├── package.json                # Root configuration with scripts
└── firebase.json               # Firebase setup
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/KalebTilahun/firebase-csv-processor.git
cd firebase-csv-processor
```

### 2️⃣ Install Dependencies

```bash
# Root dependencies (for testing)
npm install

# Install Functions dependencies
cd functions
npm install
cd ..
```

### 3️⃣ Set Up Firebase (if deploying)

```bash
# Login to Firebase
firebase login

# Initialize Firebase Functions
firebase init functions
```

---

## 🧪 Testing

This project includes a **comprehensive Jest test suite**.

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Only CSV processor tests
npm test -- tests/unit/csv-processor.test.js

# Only error handling tests
npm test -- tests/unit/error-handling.test.js
```

### Test With Coverage

```bash
npm run test:coverage
# View HTML report
open coverage/lcov-report/index.html
```

#### 📜 Available Test Scripts

```json
{
  "test": "jest",
  "test:unit": "jest tests/unit",
  "test:coverage": "jest --coverage",
  "test:watch": "jest --watch"
}
```

---

## 📊 Test Coverage Highlights

✅ Valid CSV data processing  
✅ Empty file handling  
✅ Malformed CSV row detection  
✅ Large file processing  
✅ Whitespace & formatting edge cases  
✅ Header validation  
✅ Mixed data type handling  

---

## ☁️ Deployment

### Deploy to Firebase

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy a specific function
firebase deploy --only functions:processCsv
```

### Local Emulator Testing

```bash
# Start Firebase emulators
firebase emulators:start

# Run tests against emulators
npm run test:with-emulators
```

---

## 💡 Usage Example

```javascript
const { processCsv } = require('./functions/csv-utils');

const csvData = `name,email,age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25`;

processCsv(csvData)
  .then(result => {
    console.log(`Processed ${result.total} records`);
  })
  .catch(error => {
    console.error('Processing failed:', error.message);
  });
```

---

## 🐛 Error Handling

| Scenario           | Behavior / Message                     |
|--------------------|-----------------------------------------|
| Empty CSV data     | "Empty CSV data"                        |
| Invalid headers    | "Invalid CSV headers"                   |
| Malformed rows     | Skips gracefully or raises descriptive error |
| Large files        | Processes efficiently within memory limits |

---

## 🤝 Contributing

1. **Fork** the repository  
2. **Create a branch** – `git checkout -b feature/new-feature`  
3. **Run tests** – `npm test`  
4. **Commit changes** – `git commit -am "Add new feature"`  
5. **Push branch** – `git push origin feature/new-feature`  
6. **Submit a Pull Request**  

---

## 🧑‍💻 Development

### Adding New Tests

```javascript
// tests/unit/new-feature.test.js
describe('New Feature', () => {
  test('should handle specific scenario', () => {
    expect(true).toBe(true);
  });
});
```

### Code Style

- Use provided ESLint configuration  
- Follow Firebase Functions best practices  
- Add tests for new functionality  
- Maintain high test coverage  

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Firebase Team** – for Cloud Functions platform  
- **Jest Team** – for powerful testing tools  
- **CSV Parser Community** – for efficient parsing utilities  

---

**Maintained by Kaleb Tilahun**  
📬 [Report a Bug](https://github.com/KalebTilahun/firebase-csv-processor/issues) • 💡 [Request a Feature](https://github.com/KalebTilahun/firebase-csv-processor/pulls)
