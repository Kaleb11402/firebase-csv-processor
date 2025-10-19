/* eslint-disable */
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const csvParser = require("csv-parser");
const { stringify } = require("csv-stringify/sync");
const fs = require("fs");
const os = require("os");
const express = require("express");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();

const BUCKET = process.env.GCLOUD_STORAGE_BUCKET || "my-trending-stories-dev.appspot.com";
const IS_EMULATOR = process.env.FUNCTIONS_EMULATOR === "true";

const app = express();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    message: "CSV Processor API is running",
    environment: IS_EMULATOR ? "emulator" : "production"
  });
});
const { processCsv } = require('./csv-processor');

exports.processCsv = processCsv;
app.post("/upload", express.text({ type: '*/*', limit: '50mb' }), async (req, res) => {
  let jobId;
  let tempOutputPath;

  try {
    console.log("=== NEW UPLOAD ===");
    console.log("Environment:", IS_EMULATOR ? "EMULATOR" : "PRODUCTION");
    console.log("CSV size:", req.body.length, "characters");

    // Validate input
    if (!req.body || req.body.trim().length === 0) {
      return res.status(400).json({ 
        error: "Invalid input", 
        message: "CSV data is required" 
      });
    }

    // Create job record
    const jobRef = db.collection("jobs").doc();
    jobId = jobRef.id;
    
    await jobRef.set({
      status: "processing",
      createdAt: FieldValue.serverTimestamp(),
      progress: 0,
    });

    // Process CSV and generate results
    const { departments, totalRows, validRows } = await processCsvText(req.body);
    
    // Generate output CSV
    const outputCsv = generateOutputCsv(departments);
    
    let downloadUrl;
    let outputPath;

    if (IS_EMULATOR) {
      // EMULATOR: Use direct download endpoint
      downloadUrl = `http://127.0.0.1:5001/my-trending-stories-dev/us-central1/api/download/${jobId}`;
      outputPath = `emulator-results/${jobId}/department-totals.csv`;
      
      // Store CSV content in Firestore for emulator download
      await jobRef.set({
        csvContent: outputCsv, // Store for direct download
      }, { merge: true });
      
    } else {
      // PRODUCTION: Use Cloud Storage with signed URL
      // Save output to temporary file
      tempOutputPath = `${os.tmpdir()}/results-${jobId}.csv`;
      fs.writeFileSync(tempOutputPath, outputCsv);

      // Upload to Cloud Storage
      const bucket = storage.bucket(BUCKET);
      outputPath = `results/${jobId}/department-totals.csv`;
      
      await bucket.upload(tempOutputPath, {
        destination: outputPath,
        metadata: {
          contentType: 'text/csv',
          metadata: {
            jobId: jobId,
            generatedAt: new Date().toISOString()
          }
        }
      });

      // Generate signed URL for download (7 days expiry)
      const outputFile = bucket.file(outputPath);
      [downloadUrl] = await outputFile.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Update job with completion details
    await jobRef.set({
      status: "completed",
      completedAt: FieldValue.serverTimestamp(),
      progress: 100,
      inputRows: totalRows,
      outputRows: departments.length,
      outputFile: outputPath,
      downloadUrl: downloadUrl,
      totalSales: departments.reduce((sum, dept) => sum + dept.totalSales, 0),
      uniqueDepartments: departments.length,
      environment: IS_EMULATOR ? "emulator" : "production"
    }, { merge: true });

    console.log("Processing completed successfully");
    console.log("Download URL:", downloadUrl);
    
    res.json({
      message: "CSV processed successfully",
      jobId: jobId,
      downloadUrl: downloadUrl,
      summary: {
        inputRows: totalRows,
        outputRows: departments.length,
        totalSales: departments.reduce((sum, dept) => sum + dept.totalSales, 0),
        uniqueDepartments: departments.length,
      },
      results: departments,
      environment: IS_EMULATOR ? "emulator" : "production"
    });

  } catch (err) {
    console.error("Processing failed:", err);
    
    // Update job status to failed
    if (jobId) {
      await db.collection("jobs").doc(jobId).set({
        status: "failed",
        error: err.message,
        failedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    res.status(500).json({
      error: "Processing failed",
      message: err.message,
      jobId: jobId
    });
  } finally {
    // Cleanup temporary files
    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
  }
});

function processCsvText(csvText) {
  return new Promise((resolve, reject) => {
    const counts = new Map();
    let totalRows = 0;
    let validRows = 0;

    require('stream').Readable.from(csvText)
      .pipe(csvParser({
        mapHeaders: ({ header }) => header.trim(),
        skipEmptyLines: true,
        strict: false
      }))
      .on('headers', (headers) => {
        console.log("CSV Headers:", headers);
      })
      .on('data', (row) => {
        totalRows++;
        
        const dept = (row["Department Name"] || "").trim();
        let salesRaw = row["Number of Sales"] || "0";
        
        // Clean and parse sales number
        salesRaw = String(salesRaw)
          .replace(/["'$,]/g, '')
          .replace(/\s+/g, '')
          .trim();
        
        const sales = parseInt(salesRaw, 10) || 0;

        if (dept && !isNaN(sales)) {
          counts.set(dept, (counts.get(dept) || 0) + sales);
          validRows++;
        }
      })
      .on('end', () => {
        console.log(`Processing Summary: ${totalRows} total rows, ${validRows} valid rows`);
        
        // Convert to sorted array
        const departments = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([department, totalSales]) => ({
            department,
            totalSales
          }));

        resolve({
          departments,
          totalRows,
          validRows
        });
      })
      .on('error', (error) => {
        console.error("CSV parsing error:", error);
        reject(new Error(`CSV parsing failed: ${error.message}`));
      });
  });
}

function generateOutputCsv(departments) {
  const outputData = departments.map(dept => ({
    'Department Name': dept.department,
    'Total Number of Sales': dept.totalSales
  }));

  return stringify(outputData, {
    header: true,
    columns: ['Department Name', 'Total Number of Sales'],
    cast: {
      number: (value) => value.toString()
    }
  });
}

// Download endpoint - handles both emulator and production
app.get("/download/:jobId", async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const jobDoc = await db.collection("jobs").doc(jobId).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const jobData = jobDoc.data();
    
    if (jobData.status !== "completed") {
      return res.status(400).json({ error: "Job not completed" });
    }

    if (IS_EMULATOR && jobData.csvContent) {
      // EMULATOR: Serve CSV content directly from Firestore
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="department-totals-${jobId}.csv"`);
      res.send(jobData.csvContent);
    } else if (jobData.downloadUrl) {
      // PRODUCTION: Redirect to signed URL
      res.redirect(jobData.downloadUrl);
    } else {
      return res.status(404).json({ error: "Download URL not available" });
    }
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get job status
app.get("/job/:jobId", async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const jobDoc = await db.collection("jobs").doc(jobId).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const jobData = jobDoc.data();
    
    res.json({
      id: jobId,
      status: jobData.status,
      createdAt: jobData.createdAt,
      completedAt: jobData.completedAt,
      summary: {
        inputRows: jobData.inputRows,
        outputRows: jobData.outputRows,
        totalSales: jobData.totalSales,
        uniqueDepartments: jobData.uniqueDepartments
      },
      downloadUrl: jobData.downloadUrl,
      environment: jobData.environment || "production"
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all jobs
app.get("/jobs", async (req, res) => {
  try {
    const jobsSnapshot = await db.collection("jobs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    
    const jobs = [];
    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      jobs.push({ 
        id: doc.id, 
        status: data.status,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
        summary: {
          inputRows: data.inputRows,
          outputRows: data.outputRows,
          totalSales: data.totalSales,
          uniqueDepartments: data.uniqueDepartments
        },
        downloadUrl: data.downloadUrl,
        environment: data.environment || "production"
      });
    });
    
    res.json({
      total: jobs.length,
      jobs: jobs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Server error",
    message: error.message
  });
});

exports.api = onRequest(app);