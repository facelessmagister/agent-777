const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing dependencies...');

try {
  // Install required packages
  execSync('npm install @prisma/client next-auth @next-auth/prisma-adapter bcryptjs @types/bcryptjs --legacy-peer-deps', { stdio: 'inherit' });
  
  console.log('Dependencies installed successfully!');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
}
