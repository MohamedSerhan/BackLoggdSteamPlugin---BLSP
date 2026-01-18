/**
 * Keypress Restart Utility
 * Listens for 'r' key press to restart the main application
 */

const { spawn } = require('child_process');
const readline = require('readline');

let mainProcess = null;
let isRestarting = false;

// Setup readline for keypress
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

console.log('\n🎮 BackLoggd Steam Plugin Started');
console.log('📌 Press "r" to restart | Press "q" to quit\n');

// Start the main application
function startApp() {
  if (mainProcess) {
    return;
  }

  mainProcess = spawn('node', ['dist/src/main.js'], {
    stdio: 'inherit',
    shell: true
  });

  mainProcess.on('exit', (code) => {
    mainProcess = null;
    if (!isRestarting) {
      console.log('\n✅ Application finished');
      console.log('📌 Press "r" to restart | Press "q" to quit\n');
    }
  });

  mainProcess.on('error', (err) => {
    console.error('❌ Error starting application:', err);
    mainProcess = null;
  });
}

// Restart the application
function restartApp() {
  if (isRestarting) {
    return;
  }

  isRestarting = true;
  console.log('\n🔄 Restarting application...\n');

  if (mainProcess) {
    mainProcess.on('exit', () => {
      setTimeout(() => {
        startApp();
        isRestarting = false;
      }, 500);
    });
    mainProcess.kill();
  } else {
    setTimeout(() => {
      startApp();
      isRestarting = false;
    }, 500);
  }
}

// Listen for keypress
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    // Ctrl+C pressed
    console.log('\n👋 Shutting down...');
    if (mainProcess) {
      mainProcess.kill();
    }
    process.exit();
  } else if (key.name === 'r') {
    // R key pressed
    restartApp();
  } else if (key.name === 'q') {
    // Q key pressed
    console.log('\n👋 Quitting...');
    if (mainProcess) {
      mainProcess.kill();
    }
    process.exit();
  }
});

// Handle process termination
process.on('SIGINT', () => {
  if (mainProcess) {
    mainProcess.kill();
  }
  process.exit();
});

process.on('SIGTERM', () => {
  if (mainProcess) {
    mainProcess.kill();
  }
  process.exit();
});

// Start the application
startApp();
