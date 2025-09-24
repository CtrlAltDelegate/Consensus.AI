const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

class FileProcessor {
  constructor() {
    this.supportedTypes = {
      'text/plain': this.processTextFile.bind(this),
      'application/pdf': this.processPdfFile.bind(this),
      'text/csv': this.processCsvFile.bind(this),
      'application/json': this.processJsonFile.bind(this)
    };
    
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxTextLength = 50000; // 50k characters max per file
  }

  async processFile(filePath, mimeType, originalName) {
    try {
      console.log(`📄 Processing file: ${originalName} (${mimeType})`);
      
      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
      }

      // Get processor for file type
      const processor = this.supportedTypes[mimeType];
      if (!processor) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Process the file
      const extractedText = await processor(filePath, originalName);
      
      // Validate and truncate if necessary
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the file');
      }

      let processedText = extractedText.trim();
      if (processedText.length > this.maxTextLength) {
        processedText = processedText.substring(0, this.maxTextLength) + '\n\n[Content truncated due to length limit]';
        console.log(`⚠️ File content truncated to ${this.maxTextLength} characters`);
      }

      console.log(`✅ Successfully extracted ${processedText.length} characters from ${originalName}`);
      
      return {
        success: true,
        text: processedText,
        originalName,
        fileSize: stats.size,
        extractedLength: processedText.length,
        mimeType
      };

    } catch (error) {
      console.error(`❌ Error processing file ${originalName}:`, error.message);
      throw new Error(`Failed to process ${originalName}: ${error.message}`);
    } finally {
      // Clean up uploaded file
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ Cleaned up temporary file: ${filePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to cleanup file ${filePath}:`, cleanupError.message);
      }
    }
  }

  async processTextFile(filePath, originalName) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  async processPdfFile(filePath, originalName) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains no extractable text');
      }
      
      // Clean up PDF text (remove excessive whitespace, normalize line breaks)
      const cleanedText = pdfData.text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      
      return cleanedText;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  async processCsvFile(filePath, originalName) {
    return new Promise((resolve, reject) => {
      const results = [];
      const headers = [];
      let isFirstRow = true;

      createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (data) => {
          if (isFirstRow) {
            isFirstRow = false;
            // Add headers as context
            results.push(`CSV Headers: ${headers.join(', ')}`);
            results.push(''); // Empty line for separation
          }
          
          // Convert row to readable format
          const rowText = headers.map(header => `${header}: ${data[header] || 'N/A'}`).join(', ');
          results.push(rowText);
        })
        .on('end', () => {
          if (results.length === 0) {
            reject(new Error('CSV file appears to be empty'));
            return;
          }
          
          const csvText = results.join('\n');
          resolve(csvText);
        })
        .on('error', (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        });
    });
  }

  async processJsonFile(filePath, originalName) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(content);
      
      // Convert JSON to readable text format
      const readableText = this.jsonToReadableText(jsonData, originalName);
      return readableText;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw new Error(`Failed to process JSON file: ${error.message}`);
    }
  }

  jsonToReadableText(obj, fileName, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) {
      return '[Object too deep - truncated]';
    }

    const indent = '  '.repeat(depth);
    let result = '';

    if (depth === 0) {
      result += `JSON Content from ${fileName}:\n\n`;
    }

    if (Array.isArray(obj)) {
      result += `${indent}Array with ${obj.length} items:\n`;
      obj.slice(0, 10).forEach((item, index) => { // Limit to first 10 items
        result += `${indent}  [${index}]: ${this.jsonToReadableText(item, fileName, depth + 1, maxDepth)}\n`;
      });
      if (obj.length > 10) {
        result += `${indent}  ... and ${obj.length - 10} more items\n`;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      keys.slice(0, 20).forEach(key => { // Limit to first 20 keys
        const value = obj[key];
        if (typeof value === 'object') {
          result += `${indent}${key}:\n${this.jsonToReadableText(value, fileName, depth + 1, maxDepth)}`;
        } else {
          result += `${indent}${key}: ${String(value).substring(0, 200)}\n`;
        }
      });
      if (keys.length > 20) {
        result += `${indent}... and ${keys.length - 20} more properties\n`;
      }
    } else {
      result += `${indent}${String(obj)}`;
    }

    return result;
  }

  // Validate file before processing
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.supportedTypes[file.mimetype]) {
      return { 
        valid: false, 
        error: `Unsupported file type: ${file.mimetype}. Supported types: ${Object.keys(this.supportedTypes).join(', ')}` 
      };
    }

    if (file.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB` 
      };
    }

    return { valid: true };
  }

  // Get supported file types for frontend
  getSupportedTypes() {
    return {
      mimeTypes: Object.keys(this.supportedTypes),
      extensions: ['.txt', '.pdf', '.csv', '.json'],
      maxSize: this.maxFileSize,
      maxTextLength: this.maxTextLength
    };
  }
}

module.exports = new FileProcessor();
