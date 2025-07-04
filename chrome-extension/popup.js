// Get UI elements
const captureBtn = document.getElementById('captureBtn');
const startIntervalBtn = document.getElementById('startIntervalBtn');
const stopIntervalBtn = document.getElementById('stopIntervalBtn');
const spinner = document.getElementById('spinner');
const statusMessage = document.getElementById('statusMessage');
const intervalStatus = document.getElementById('intervalStatus');
const lastScreenshotTimeElement = document.getElementById('lastScreenshotTime');
const userIdInput = document.getElementById('userId');
const saveUserIdBtn = document.getElementById('saveUserIdBtn');

// Function to update UI status
function updateStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + (isError ? 'error' : 'success');
}

// Function to show/hide loading state
function setLoading(isLoading) {
  if (isLoading) {
    spinner.style.display = 'block';
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';
  } else {
    spinner.style.display = 'none';
    captureBtn.disabled = false;
    captureBtn.textContent = 'Capture Screenshot';
  }
}

// Function to update interval status
function updateIntervalStatus(isRunning, isWaiting = false, isWaitingForActiveTab = false) {
  if (isWaitingForActiveTab) {
    intervalStatus.textContent = 'Interval: Waiting for user interaction';
    intervalStatus.className = 'interval-status waiting';
    startIntervalBtn.style.display = 'block';
    stopIntervalBtn.style.display = 'none';
  } else if (isWaiting) {
    intervalStatus.textContent = 'Interval: Waiting after error';
    intervalStatus.className = 'interval-status waiting';
    startIntervalBtn.style.display = 'none';
    stopIntervalBtn.style.display = 'block';
  } else if (isRunning) {
    intervalStatus.textContent = 'Interval: Running (3s)';
    intervalStatus.className = 'interval-status running';
    startIntervalBtn.style.display = 'none';
    stopIntervalBtn.style.display = 'block';
  } else {
    intervalStatus.textContent = 'Interval: Stopped';
    intervalStatus.className = 'interval-status stopped';
    startIntervalBtn.style.display = 'block';
    stopIntervalBtn.style.display = 'none';
  }
}

// Function to update the last screenshot time display
function updateLastScreenshotTime(timestamp) {
  if (!timestamp) {
    lastScreenshotTimeElement.textContent = 'Last screenshot: Never';
    return;
  }
  
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString();
  const dateString = date.toLocaleDateString();
  lastScreenshotTimeElement.textContent = `Last screenshot: ${dateString} ${timeString}`;
}

// Function to load the user ID from storage
async function loadUserId() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userId'], (result) => {
      resolve(result.userId || '');
    });
  });
}

// Function to save the user ID to storage
async function saveUserId(userId) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ userId }, () => {
      resolve();
    });
  });
}

// Function to get the device hostname
async function getDeviceHostname() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_HOSTNAME' }, (response) => {
      resolve(response.hostname || 'unknown-device');
    });
  });
}

// Initialize the user ID field
async function initializeUserId() {
  let userId = await loadUserId();
  
  // If no user ID is set, use the device hostname as default
  if (!userId) {
    userId = await getDeviceHostname();
    await saveUserId(userId);
  }
  
  userIdInput.value = userId;
}

// Initialize the user ID field when the popup opens
initializeUserId();

// Add click event listener to the save user ID button
saveUserIdBtn.addEventListener('click', async () => {
  const userId = userIdInput.value.trim();
  
  if (!userId) {
    updateStatus('User ID cannot be empty', true);
    return;
  }
  
  await saveUserId(userId);
  updateStatus('User ID saved successfully');
});

// Check initial interval status and last screenshot time
function checkIntervalStatus() {
  chrome.runtime.sendMessage({ type: 'GET_INTERVAL_STATUS' }, (response) => {
    if (response) {
      if (response.isRunning !== undefined) {
        updateIntervalStatus(response.isRunning, response.isWaitingAfterError, response.isWaitingForActiveTab);
      }
      if (response.lastScreenshotTime) {
        updateLastScreenshotTime(response.lastScreenshotTime);
      }
    }
  });
}

// Check interval status when popup opens
checkIntervalStatus();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPLOAD_SUCCESS') {
    updateStatus('Screenshot uploaded successfully!');
    setLoading(false);
    if (message.timestamp) {
      updateLastScreenshotTime(message.timestamp);
    }
  } else if (message.type === 'UPLOAD_ERROR') {
    updateStatus(`Upload failed: ${message.error}`, true);
    setLoading(false);
    
    // If the error message indicates we're waiting after a 400 error
    if (message.error.includes('Waiting 5 seconds before continuing')) {
      updateIntervalStatus(true, true);
    }
    // If the error message indicates we're waiting for user interaction
    else if (message.error.includes('Please interact with the extension')) {
      updateIntervalStatus(false, false, true);
    }
  } else if (message.type === 'INTERVAL_STARTED') {
    updateIntervalStatus(true);
    updateStatus('Screenshot interval started (3 seconds)');
  } else if (message.type === 'INTERVAL_STOPPED') {
    updateIntervalStatus(false);
    updateStatus('Screenshot interval stopped');
  }
});

// Add click event listener to the capture button
captureBtn.addEventListener('click', async () => {
  try {
    // Show loading state
    setLoading(true);
    updateStatus('Preparing to capture screenshot...');
    
    // Send the screenshot request to the background script
    chrome.runtime.sendMessage({
      type: 'CAPTURE_SCREENSHOT'
    });
    
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    updateStatus('Error capturing screenshot. Please try again.', true);
    setLoading(false);
  }
});

// Add click event listener to the start interval button
startIntervalBtn.addEventListener('click', () => {
  updateStatus('Starting screenshot interval (3 seconds)...');
  chrome.runtime.sendMessage({
    type: 'START_INTERVAL'
  });
});

// Add click event listener to the stop interval button
stopIntervalBtn.addEventListener('click', () => {
  updateStatus('Stopping screenshot interval...');
  chrome.runtime.sendMessage({
    type: 'STOP_INTERVAL'
  });
}); 