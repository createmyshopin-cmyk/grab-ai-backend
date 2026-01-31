/**
 * Grab AI - Popup Script
 * Handles UI interactions in the extension popup
 */

let isCapturing = false;

// DOM elements
const captureBtn = document.getElementById('captureBtn');
const statusDiv = document.getElementById('status');
const recentCapturesDiv = document.getElementById('recentCaptures');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadRecentCaptures();
});

// Capture button click
captureBtn.addEventListener('click', async () => {
  if (isCapturing) {
    await stopCapture();
  } else {
    await startCapture();
  }
});

/**
 * Start capture mode
 */
async function startCapture() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('error', 'No active tab found');
      return;
    }
    
    // Check if we can inject content script
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showStatus('error', 'Cannot capture on Chrome system pages. Try a website like example.com');
      return;
    }
    
    // Send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
      
      isCapturing = true;
      updateCaptureButton();
      showStatus('active', 'Hover over an element and click to capture');
    } catch (msgError) {
      // Content script might not be injected yet, try to inject it
      console.log('Content script not ready, injecting...');
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Wait a bit for script to load
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
            isCapturing = true;
            updateCaptureButton();
            showStatus('active', 'Hover over an element and click to capture');
          } catch (e) {
            showStatus('error', 'Please refresh the page and try again');
          }
        }, 500);
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        showStatus('error', 'Please refresh the page and try again');
      }
    }
    
  } catch (error) {
    console.error('Start capture error:', error);
    showStatus('error', 'Failed to start capture. Please refresh the page.');
  }
}

/**
 * Stop capture mode
 */
async function stopCapture() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: 'stopCapture' });
    }
    
    isCapturing = false;
    updateCaptureButton();
    showStatus('', '');
    
  } catch (error) {
    console.error('Stop capture error:', error);
  }
}

/**
 * Update capture button state
 */
function updateCaptureButton() {
  if (isCapturing) {
    captureBtn.innerHTML = `
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
      Cancel Capture
    `;
    captureBtn.style.background = '#EF4444';
  } else {
    captureBtn.innerHTML = `
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
      </svg>
      Start Capture
    `;
    captureBtn.style.background = '#3B82F6';
  }
}

/**
 * Show status message
 */
function showStatus(type, message) {
  statusDiv.className = 'status';
  
  if (type) {
    statusDiv.classList.add(type);
    statusDiv.textContent = message;
  } else {
    statusDiv.style.display = 'none';
  }
}

/**
 * Load and display recent captures
 */
async function loadRecentCaptures() {
  try {
    const result = await chrome.storage.local.get('captures');
    const captures = result.captures || [];
    
    if (captures.length === 0) {
      recentCapturesDiv.innerHTML = `
        <div style="text-align: center; color: #9CA3AF; font-size: 12px; padding: 20px;">
          No captures yet
        </div>
      `;
      return;
    }
    
    recentCapturesDiv.innerHTML = captures.slice(0, 10).map(capture => `
      <div class="capture-item" data-id="${capture.id}">
        <div class="capture-item-title">${capture.component.componentName}</div>
        <div class="capture-item-url">${capture.data.pageUrl}</div>
      </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.capture-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        viewCapture(id, captures);
      });
    });
    
  } catch (error) {
    console.error('Load captures error:', error);
  }
}

/**
 * View a specific capture
 */
function viewCapture(id, captures) {
  const capture = captures.find(c => c.id === id);
  
  if (!capture) {
    showStatus('error', 'Capture not found');
    return;
  }
  
  if (!capture.component || !capture.component.code) {
    showStatus('error', 'No React code generated for this capture');
    console.error('Capture has no code:', capture);
    return;
  }
  
  // Try multiple methods to copy to clipboard
  copyToClipboard(capture.component.code, capture.component.componentName);
}

/**
 * Copy text to clipboard with multiple fallback methods
 */
async function copyToClipboard(text, componentName) {
  // Method 1: Try modern Clipboard API
  try {
    await navigator.clipboard.writeText(text);
    showStatus('success', `📋 Copied to Clipboard!\n\n${componentName} is ready to paste (Ctrl+V)`);
    setTimeout(() => showStatus('', ''), 4000);
    console.log('✅ Code copied successfully!');
    console.log('Preview:', text.substring(0, 200) + '...');
    return;
  } catch (err) {
    console.log('Clipboard API failed, trying fallback...', err);
  }
  
  // Method 2: Try execCommand (fallback for older browsers)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      showStatus('success', `✅ ${componentName} copied! Press Ctrl+V to paste.`);
      setTimeout(() => showStatus('', ''), 3000);
      return;
    }
  } catch (err) {
    console.log('execCommand failed:', err);
  }
  
  // Method 3: If all else fails, show the code
  showStatus('error', 'Copy failed. Code is in console (F12)');
  console.log('='.repeat(50));
  console.log('REACT CODE - COPY FROM HERE:');
  console.log('='.repeat(50));
  console.log(text);
  console.log('='.repeat(50));
  
  // Also try to select the text in a modal for manual copy
  showCodeModal(text, componentName);
}

/**
 * Show modal with code for manual copy
 */
function showCodeModal(code, componentName) {
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  `;
  
  content.innerHTML = `
    <h3 style="margin-bottom: 12px; color: #1F2937;">Manual Copy Required</h3>
    <p style="margin-bottom: 12px; color: #6B7280; font-size: 13px;">
      Automatic copy failed. Please manually select and copy the code below:
    </p>
    <textarea readonly style="
      width: 100%;
      height: 300px;
      font-family: monospace;
      font-size: 11px;
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      resize: vertical;
    ">${code}</textarea>
    <div style="display: flex; gap: 8px; margin-top: 12px;">
      <button id="selectAllBtn" style="
        flex: 1;
        padding: 10px;
        background: #3B82F6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      ">Select All</button>
      <button id="closeModalBtn" style="
        flex: 1;
        padding: 10px;
        background: #F3F4F6;
        color: #4B5563;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      ">Close</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Select all button
  document.getElementById('selectAllBtn').addEventListener('click', () => {
    const textarea = content.querySelector('textarea');
    textarea.select();
    try {
      document.execCommand('copy');
      showStatus('success', '✅ Code copied!');
    } catch (e) {
      console.error('Manual copy also failed:', e);
    }
  });
  
  // Close button
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Listen for capture complete messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureComplete') {
    isCapturing = false;
    updateCaptureButton();
    showStatus('success', 'Capture complete! Loading...');
    
    // Reload recent captures
    setTimeout(() => {
      loadRecentCaptures();
      showStatus('', '');
    }, 1000);
  }
});
