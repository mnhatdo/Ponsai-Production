#!/usr/bin/env node

/**
 * Unified Development Environment Launcher
 * 
 * This script provides a streamlined development experience by:
 * - Automatically cleaning up ports 3000 and 4200
 * - Checking if dependencies are installed
 * - Installing missing dependencies automatically
 * - Running frontend and backend concurrently
 * - Handling EADDRINUSE errors gracefully
 * - Disabling interactive prompts
 * - Providing clear error messages and guidance
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Kill process using a specific port
 */
async function killPort(port) {
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      // Windows: Find and kill process using netstat
      const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
      const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          try {
            await execPromise(`taskkill /F /PID ${pid}`);
            log(`  ✓ Killed process ${pid} on port ${port}`, 'green');
          } catch (err) {
            // Process might already be dead
          }
        }
      }
    } else {
      // Unix-like systems
      try {
        const { stdout } = await execPromise(`lsof -ti:${port}`);
        const pids = stdout.trim().split('\n').filter(pid => pid);
        for (const pid of pids) {
          await execPromise(`kill -9 ${pid}`);
          log(`  ✓ Killed process ${pid} on port ${port}`, 'green');
        }
      } catch (err) {
        // No process found on this port
      }
    }
  } catch (error) {
    // Port is already free or error occurred - safe to continue
  }
}

/**
 * Clean up development ports before starting
 */
async function cleanupPorts() {
  log('\n🔧 Cleaning up development ports...', 'yellow');
  await killPort(3000); // Backend port
  await killPort(4200); // Frontend port
  // Wait a bit for ports to be fully released
  await new Promise(resolve => setTimeout(resolve, 1000));
  log('✅ Ports cleaned up successfully\n', 'green');
}

function checkDependencies(dir) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  const packageJsonPath = path.join(dir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return { exists: false, hasNodeModules: false };
  }
  
  return {
    exists: true,
    hasNodeModules: fs.existsSync(nodeModulesPath)
  };
}

async function installDependencies(dir, name) {
  log(`\n📦 Installing ${name} dependencies...`, 'cyan');
  
  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const install = spawn(npm, ['install'], {
      cwd: dir,
      stdio: 'inherit',
      shell: true
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${name} dependencies installed successfully`, 'green');
        resolve();
      } else {
        log(`❌ Failed to install ${name} dependencies`, 'red');
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

async function runDevelopment() {
  log('\n🌱 Ponsai Full-Stack Development Environment', 'bright');
  log('==========================================\n', 'bright');
  
  const rootDir = path.resolve(__dirname, '..', '..', '..');
  const frontendDir = path.join(rootDir, 'frontend');
  const backendDir = path.join(rootDir, 'backend');
  
  // Clean up ports first
  await cleanupPorts();
  
  // Check dependencies
  log('🔍 Checking dependencies...', 'yellow');
  
  const rootDeps = checkDependencies(rootDir);
  const frontendDeps = checkDependencies(frontendDir);
  const backendDeps = checkDependencies(backendDir);
  
  // Install missing dependencies
  const installTasks = [];
  
  if (rootDeps.exists && !rootDeps.hasNodeModules) {
    installTasks.push(installDependencies(rootDir, 'Root'));
  }
  
  if (frontendDeps.exists && !frontendDeps.hasNodeModules) {
    installTasks.push(installDependencies(frontendDir, 'Frontend'));
  }
  
  if (backendDeps.exists && !backendDeps.hasNodeModules) {
    installTasks.push(installDependencies(backendDir, 'Backend'));
  }
  
  if (installTasks.length > 0) {
    try {
      await Promise.all(installTasks);
    } catch (error) {
      log(`\n❌ Dependency installation failed: ${error.message}`, 'red');
      log('\n💡 Try running: npm run install:all', 'yellow');
      process.exit(1);
    }
  } else {
    log('✅ All dependencies are installed', 'green');
  }
  
  // Start development servers
  log('\n🎯 Starting development servers...', 'cyan');
  log('  - Frontend: http://localhost:4200', 'blue');
  log('  - Backend: http://localhost:3000\n', 'blue');
  
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  let backendProcess = null;
  let frontendProcess = null;
  
  // Track if we're shutting down
  let isShuttingDown = false;
  
  // Start backend with error handling
  backendProcess = spawn(npm, ['run', 'dev:backend'], {
    cwd: rootDir,
    stdio: ['ignore', 'inherit', 'inherit'], // Ignore stdin to prevent hanging
    shell: true,
    detached: false
  });
  
  backendProcess.on('error', (error) => {
    if (!isShuttingDown) {
      log(`\n❌ Backend error: ${error.message}`, 'red');
    }
  });
  
  backendProcess.on('close', (code) => {
    if (!isShuttingDown && code !== 0) {
      log(`\n⚠️  Backend server stopped with code ${code}`, 'yellow');
      if (frontendProcess) frontendProcess.kill();
      process.exit(code);
    }
  });
  
  // Start frontend with delay and non-interactive mode
  setTimeout(() => {
    frontendProcess = spawn(npm, ['run', 'dev:frontend'], {
      cwd: rootDir,
      stdio: ['ignore', 'inherit', 'inherit'], // Ignore stdin to prevent hanging
      shell: true,
      detached: false,
      env: {
        ...process.env,
        CI: 'true', // Disable Angular CLI prompts
        NG_CLI_ANALYTICS: 'false' // Disable analytics
      }
    });
    
    frontendProcess.on('error', (error) => {
      if (!isShuttingDown) {
        log(`\n❌ Frontend error: ${error.message}`, 'red');
      }
    });
    
    frontendProcess.on('close', (code) => {
      if (!isShuttingDown && code !== 0) {
        log(`\n⚠️  Frontend server stopped with code ${code}`, 'yellow');
        if (backendProcess) backendProcess.kill();
        process.exit(code);
      }
    });
  }, 2000); // Increased delay to ensure backend is ready
  
  // Handle Ctrl+C gracefully
  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    log('\n\n👋 Shutting down development servers...', 'yellow');
    
    if (frontendProcess) {
      try {
        frontendProcess.kill('SIGTERM');
        setTimeout(() => frontendProcess.kill('SIGKILL'), 2000);
      } catch (err) {
        // Process might already be dead
      }
    }
    
    if (backendProcess) {
      try {
        backendProcess.kill('SIGTERM');
        setTimeout(() => backendProcess.kill('SIGKILL'), 2000);
      } catch (err) {
        // Process might already be dead
      }
    }
    
    setTimeout(() => {
      log('✅ Servers stopped\n', 'green');
      process.exit(0);
    }, 3000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', () => {
    if (frontendProcess) frontendProcess.kill();
    if (backendProcess) backendProcess.kill();
  });
}

// Run the development environment
runDevelopment().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
