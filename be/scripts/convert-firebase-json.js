#!/usr/bin/env node

/**
 * Script to convert Firebase service account JSON file to string format
 * Usage: node scripts/convert-firebase-json.js path/to/serviceAccountKey.json
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('❌ Please provide path to Firebase service account JSON file');
  console.log('Usage: node scripts/convert-firebase-json.js path/to/serviceAccountKey.json');
  process.exit(1);
}

try {
  const fullPath = resolve(__dirname, '..', jsonFilePath);
  const jsonContent = fs.readFileSync(fullPath, 'utf8');
  const jsonObject = JSON.parse(jsonContent);
  
  // Convert to string with escaped quotes
  const jsonString = JSON.stringify(jsonObject);
  
  console.log('\n✅ Firebase Service Account JSON converted to string:\n');
  console.log('='.repeat(80));
  console.log(jsonString);
  console.log('='.repeat(80));
  console.log('\n📋 Copy the string above and paste it into Render Dashboard as FIREBASE_SERVICE_ACCOUNT\n');
  console.log('⚠️  Remember to delete the JSON file after copying (for security)\n');
  
} catch (error) {
  console.error('❌ Error reading/parsing JSON file:', error.message);
  process.exit(1);
}
