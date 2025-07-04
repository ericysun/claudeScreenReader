const API_ENDPOINT = 'https://screen-mcp.vercel.app/api/screenshots';

// Variable to store the interval ID
let screenshotInterval = null;
// Variable to store the last screenshot time
let lastScreenshotTime = null;
// Variable to track if we're in a waiting period after an error
let isWaitingAfterError = false;
// Variable to track if we're in a waiting period after an activeTab error
let isWaitingForActiveTab = false;
// Variable to track if we're currently processing a screenshot
let isProcessingScreenshot = false;

// Function to get the device hostname
async function getHostname() {
  return new Promise((resolve) => {
    // Use chrome.system.cpu API to get system info
    if (chrome.system && chrome.system.cpu) {
      chrome.system.cpu.getInfo((info) => {
        // Extract hostname from the model name or use a default
        const hostname = info.modelName || 'unknown-device';
        resolve(hostname);
      });
    } else {
      // Fallback if system API is not available
      resolve('unknown-device');
    }
  });
}

// Function to get the user ID from storage
async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userId'], (result) => {
      resolve(result.userId || 'unknown-user');
    });
  });
}

// Function to wait for a specified time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to capture and send a screenshot
async function captureAndSendScreenshot() {
  // If we're already processing a screenshot, skip this one
  if (isProcessingScreenshot) {
    console.log('Already processing a screenshot, skipping this one');
    return;
  }
  
  try {
    // Set the processing flag
    isProcessingScreenshot = true;
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      isProcessingScreenshot = false;
      return;
    }
    
    try {
      // Capture the screenshot
      const screenshot = await chrome.tabs.captureVisibleTab();
      
      // Update the last screenshot time
      lastScreenshotTime = new Date();
      
      // Get the user ID
      const userId = await getUserId();
      
      // Send the screenshot to the server
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenshot,
          timestamp: lastScreenshotTime.toISOString(),
          url: tab.url,
          userId
        })
      });
      
      if (!response.ok) {
        // If we get a 400 error, wait 5 seconds before continuing
        if (response.status === 400) {
          console.log('Received 400 error, waiting 5 seconds before continuing...');
          isWaitingAfterError = true;
          
          // Notify the popup about the error and waiting period
          chrome.runtime.sendMessage({
            type: 'UPLOAD_ERROR',
            error: `Server responded with status: ${response.status}. Waiting 5 seconds before continuing.`
          });
          
          // Wait for 5 seconds
          await wait(5000);
          isWaitingAfterError = false;
          
          // Reset the processing flag
          isProcessingScreenshot = false;
          
          // Try again after waiting
          return captureAndSendScreenshot();
        }
        
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Screenshot uploaded successfully:', data);
      
      // Notify the popup that the upload was successful
      chrome.runtime.sendMessage({
        type: 'UPLOAD_SUCCESS',
        data: data,
        timestamp: lastScreenshotTime
      });
      
      // Reset the waiting for activeTab flag if it was set
      if (isWaitingForActiveTab) {
        isWaitingForActiveTab = false;
      }
    } catch (captureError) {
      // Check if this is an activeTab permission error
      if (captureError.message.includes('activeTab permission is not in effect')) {
        console.log('ActiveTab permission not in effect, waiting for user interaction...');
        isWaitingForActiveTab = true;
        
        // Notify the popup about the error
        chrome.runtime.sendMessage({
          type: 'UPLOAD_ERROR',
          error: 'Please interact with the extension (click the popup) to enable screenshot capture.'
        });
        
        // Wait for 10 seconds before trying again
        await wait(10000);
        
        // Reset the processing flag
        isProcessingScreenshot = false;
        
        // Try again after waiting
        return captureAndSendScreenshot();
      }
      
      // If it's not an activeTab error, rethrow it
      throw captureError;
    }
  } catch (error) {
    console.error('Error capturing or uploading screenshot:', error);
    // Notify the popup that the upload failed
    chrome.runtime.sendMessage({
      type: 'UPLOAD_ERROR',
      error: error.message
    });
  } finally {
    // Always reset the processing flag
    isProcessingScreenshot = false;
  }
}

// Function to start taking screenshots every 3 seconds
function startScreenshotInterval() {
  if (screenshotInterval) return; // Already running
  
  // Take a screenshot immediately
  captureAndSendScreenshot();
  
  // Set up interval to take a screenshot every 3 seconds
  screenshotInterval = setInterval(captureAndSendScreenshot, 3000);
  
  // Notify the popup that the interval has started
  chrome.runtime.sendMessage({
    type: 'INTERVAL_STARTED'
  });
}

// Function to stop taking screenshots
function stopScreenshotInterval() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
    
    // Notify the popup that the interval has stopped
    chrome.runtime.sendMessage({
      type: 'INTERVAL_STOPPED'
    });
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_SCREENSHOT') {
    // Single screenshot capture
    captureAndSendScreenshot();
    return true; // Indicate we'll respond asynchronously
  } else if (message.type === 'START_INTERVAL') {
    // Start taking screenshots every 3 seconds
    startScreenshotInterval();
    return true;
  } else if (message.type === 'STOP_INTERVAL') {
    // Stop taking screenshots
    stopScreenshotInterval();
    return true;
  } else if (message.type === 'GET_INTERVAL_STATUS') {
    // Return the current status of the interval
    sendResponse({ 
      isRunning: !!screenshotInterval,
      lastScreenshotTime: lastScreenshotTime,
      isWaitingAfterError: isWaitingAfterError,
      isWaitingForActiveTab: isWaitingForActiveTab
    });
    return false; // Synchronous response
  } else if (message.type === 'GET_LAST_SCREENSHOT_TIME') {
    // Return the last screenshot time
    sendResponse({ lastScreenshotTime });
    return false; // Synchronous response
  } else if (message.type === 'GET_HOSTNAME') {
    // Return the device hostname
    getHostname().then(hostname => {
      sendResponse({ hostname });
    });
    return true; // Indicate we'll respond asynchronously
  }
}); 