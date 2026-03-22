#!/usr/bin/env node

/**
 * One-Command Setup Script for Ponsai E-commerce
 * 
 * This script automates the entire setup process:
 * - Checks Node.js and npm versions
 * - Installs all dependencies (root, backend, frontend)
 * - Creates .env file from .env.example
 * - Verifies MongoDB connection
 * - Seeds database with initial data
 * - Displays helpful next steps
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(70));
  log(message, 'cyan');
  console.log('='.repeat(70) + '\n');
}

async function checkNodeVersion() {
  header('🔍 Checking System Requirements');
  
  try {
    const { stdout: nodeVersion } = await execPromise('node --version');
    const { stdout: npmVersion } = await execPromise('npm --version');
    
    log(`✓ Node.js: ${nodeVersion.trim()}`, 'green');
    log(`✓ npm: ${npmVersion.trim()}`, 'green');
    
    const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));
    if (nodeMajor < 18) {
      log('⚠️  Warning: Node.js 18+ recommended. Current version may cause issues.', 'yellow');
    }
  } catch (error) {
    log('✗ Node.js or npm not found. Please install Node.js 18+', 'red');
    process.exit(1);
  }
}

async function checkMongoDB() {
  header('🗄️  Checking MongoDB');
  
  try {
    // Try to connect to MongoDB
    const { stdout } = await execPromise('mongosh --eval "db.version()" --quiet 2>&1 || mongo --eval "db.version()" --quiet 2>&1');
    log(`✓ MongoDB is running: ${stdout.trim()}`, 'green');
    return true;
  } catch (error) {
    log('⚠️  MongoDB not detected. Please ensure MongoDB is installed and running.', 'yellow');
    log('   Download: https://www.mongodb.com/try/download/community', 'cyan');
    return false;
  }
}

async function installDependencies() {
  header('📦 Installing Dependencies');
  
  const directories = [
    { name: 'Root', path: '.' },
    { name: 'Backend', path: 'backend' },
    { name: 'Frontend', path: 'frontend' }
  ];
  
  for (const dir of directories) {
    const packageJsonPath = path.join(dir.path, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      log(`⊘ Skipping ${dir.name} - no package.json found`, 'yellow');
      continue;
    }
    
    log(`Installing ${dir.name} dependencies...`, 'cyan');
    
    try {
      await new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install'], {
          cwd: dir.path,
          shell: true,
          stdio: 'inherit'
        });
        
        npm.on('close', (code) => {
          if (code === 0) {
            log(`✓ ${dir.name} dependencies installed`, 'green');
            resolve();
          } else {
            reject(new Error(`Failed to install ${dir.name} dependencies`));
          }
        });
      });
    } catch (error) {
      log(`✗ Failed to install ${dir.name} dependencies`, 'red');
      throw error;
    }
  }
}

async function createEnvFile() {
  header('⚙️  Setting up Environment Variables');
  
  const envExamplePath = path.join('backend', '.env.example');
  const envPath = path.join('backend', '.env');
  
  if (!fs.existsSync(envExamplePath)) {
    log('⚠️  .env.example not found in backend directory', 'yellow');
    return;
  }
  
  if (fs.existsSync(envPath)) {
    log('✓ .env file already exists', 'green');
    return;
  }
  
  try {
    fs.copyFileSync(envExamplePath, envPath);
    log('✓ Created .env file from .env.example', 'green');
    log('  You can customize backend/.env for your environment', 'cyan');
  } catch (error) {
    log('✗ Failed to create .env file', 'red');
    throw error;
  }
}

async function seedDatabase() {
  header('🌱 Seeding Database (Optional)');
  
  log('Would you like to seed the database with sample data?', 'cyan');
  log('This includes: Admin user, products, categories', 'cyan');
  
  // For automated setup, we'll skip interactive prompts
  // Users can manually run: npm run seed:admin and npm run seed:bonsai
  log('⊘ Skipping automatic seeding', 'yellow');
  log('  To seed manually, run:', 'cyan');
  log('    cd backend', 'white');
  log('    npm run seed:admin', 'white');
  log('    npm run seed:bonsai', 'white');
}

async function displayNextSteps() {
  header('🎉 Setup Complete!');
  
  log('Next steps:', 'green');
  console.log('');
  log('1. Start MongoDB (if not already running):', 'cyan');
  log('   mongod', 'white');
  console.log('');
  log('2. (Optional) Seed the database:', 'cyan');
  log('   cd backend', 'white');
  log('   npm run seed:admin', 'white');
  log('   npm run seed:bonsai', 'white');
  console.log('');
  log('3. Start the development servers:', 'cyan');
  log('   npm run dev', 'white');
  console.log('');
  log('4. Open your browser:', 'cyan');
  log('   Frontend: http://localhost:4200', 'white');
  log('   Backend:  http://localhost:3000', 'white');
  console.log('');
  log('Default Admin Credentials (after seeding):', 'yellow');
  log('   Email: admin@ponsai.com', 'white');
  log('   Password: admin123', 'white');
  console.log('');
  log('📚 For more information, see README.md', 'cyan');
  console.log('');
}

async function main() {
  console.clear();
  
  log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          🌱 Ponsai E-commerce Setup Wizard 🌱                ║
║                                                               ║
║   Full-Stack E-commerce with 3D Particle Bonsai Hero         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `, 'bright');
  
  try {
    await checkNodeVersion();
    await checkMongoDB();
    await installDependencies();
    await createEnvFile();
    await seedDatabase();
    await displayNextSteps();
    
    log('✓ Setup completed successfully!', 'green');
    process.exit(0);
  } catch (error) {
    console.error('');
    log('✗ Setup failed:', 'red');
    console.error(error.message);
    console.error('');
    log('Please fix the errors above and run setup again.', 'yellow');
    process.exit(1);
  }
}

main();
