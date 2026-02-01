/**
 * Grab AI - Popup Script
 * NOW: Instant React conversion (no AI, no server!)
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('error', 'No active tab found');
      return;
    }
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showStatus('error', 'Cannot capture on Chrome system pages');
      return;
    }
    
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
      
      isCapturing = true;
      updateCaptureButton();
      showStatus('active', 'Click any element to capture → Instant React!');
    } catch (msgError) {
      console.log('Content script not ready, injecting...');
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
            isCapturing = true;
            updateCaptureButton();
            showStatus('active', 'Click any element to capture → Instant React!');
          } catch (e) {
            showStatus('error', 'Please refresh the page and try again');
          }
        }, 500);
      } catch (injectError) {
        showStatus('error', 'Please refresh the page and try again');
      }
    }
    
  } catch (error) {
    console.error('Start capture error:', error);
    showStatus('error', 'Failed to start capture');
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
  statusDiv.style.display = 'block';
  
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
          No captures yet. Click "Start Capture"!
        </div>
      `;
      return;
    }
    
    recentCapturesDiv.innerHTML = captures.slice(0, 10).map(capture => {
      const name = capture.componentName || 'Component';
      const url = capture.pageUrl || capture.data?.pageUrl || 'Unknown';
      const hostname = url !== 'Unknown' ? new URL(url).hostname : 'Unknown';
      
      return `
        <div class="capture-item" data-id="${capture.id}">
          <div class="capture-item-title">⚛️ ${name}</div>
          <div class="capture-item-url">${hostname}</div>
        </div>
      `;
    }).join('');
    
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
 * View/copy a capture - NOW: Copy React code directly!
 */
function viewCapture(id, captures) {
  const capture = captures.find(c => c.id === id);
  
  if (!capture) {
    showStatus('error', 'Capture not found');
    return;
  }
  
  // NEW: Copy React code directly (already converted!)
  let textToCopy = null;
  
  // Priority 1: React code (instant conversion)
  if (capture.reactCode) {
    textToCopy = capture.reactCode;
    console.log('📦 Copying React code (instant conversion)');
  }
  // Fallback: Old format with component
  else if (capture.component && capture.component.code) {
    textToCopy = capture.component.code;
    console.log('📦 Copying old format React code');
  }
  // Fallback: Raw data for canvas conversion
  else if (capture.clipboardText) {
    textToCopy = capture.clipboardText;
    console.log('📦 Copying raw data for canvas conversion');
  }
  
  if (textToCopy) {
    copyToClipboard(textToCopy, capture.componentName);
  } else {
    showStatus('error', 'No data to copy');
    console.error('Capture has no data:', capture);
  }
}

/**
 * Copy to clipboard with fallbacks
 */
async function copyToClipboard(text, componentName) {
  // Method 1: Modern Clipboard API
  try {
    await navigator.clipboard.writeText(text);
    showStatus('success', `✅ React code copied!\n\nPaste on canvas (Ctrl+V)`);
    setTimeout(() => showStatus('', ''), 4000);
    console.log('✅ Copied:', componentName);
    console.log('   Length:', text.length, 'chars');
    return;
  } catch (err) {
    console.log('Clipboard API failed, trying fallback...');
  }
  
  // Method 2: execCommand fallback
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (success) {
      showStatus('success', `✅ ${componentName} copied!`);
      setTimeout(() => showStatus('', ''), 3000);
      return;
    }
  } catch (err) {
    console.log('execCommand failed');
  }
  
  // Method 3: Show code for manual copy
  showCodeModal(text, componentName);
}

/**
 * Show modal for manual copy
 */
function showCodeModal(code, componentName) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
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
    <h3 style="margin-bottom: 12px; color: #1F2937;">📋 Copy React Code</h3>
    <p style="margin-bottom: 12px; color: #6B7280; font-size: 13px;">
      Select all and copy (Ctrl+A, Ctrl+C):
    </p>
    <textarea readonly style="
      width: 100%;
      height: 300px;
      font-family: monospace;
      font-size: 11px;
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
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
      ">Select All & Copy</button>
      <button id="closeModalBtn" style="
        flex: 1;
        padding: 10px;
        background: #F3F4F6;
        color: #4B5563;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      ">Close</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  document.getElementById('selectAllBtn').addEventListener('click', () => {
    const textarea = content.querySelector('textarea');
    textarea.select();
    try {
      document.execCommand('copy');
      showStatus('success', '✅ Copied!');
      document.body.removeChild(modal);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  });
  
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  });
}

// Listen for capture complete
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureComplete') {
    isCapturing = false;
    updateCaptureButton();
    showStatus('success', '✅ React code ready! Click to copy');
    
    setTimeout(() => {
      loadRecentCaptures();
      showStatus('', '');
    }, 1000);
  }
});
