// scripts/build-sw.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const swSrcPath = path.join(process.cwd(), 'public', 'sw.js');       // original SW
const swOutPath = path.join(process.cwd(), 'public', 'sw.build.js'); // output file

let swContent = fs.readFileSync(swSrcPath, 'utf-8');

// Replace process.env.VAR_NAME with actual env values
swContent = swContent.replace(/process\.env\.([A-Z0-9_]+)/g, (_, envName) => {
  const value = process.env[envName];
  if (!value) {
    console.warn(`⚠️ Environment variable ${envName} is not defined`);
  }
  return JSON.stringify(value || ''); // inject as string literal
});

fs.writeFileSync(swOutPath, swContent, 'utf-8');
console.log(`✅ Service Worker built: ${swOutPath}`);
