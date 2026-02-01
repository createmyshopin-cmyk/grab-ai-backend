/**
 * Grab AI - Background Script
 * Handles captured element data and React code
 * 
 * NEW: React conversion happens INSTANTLY in content.js (no AI, no server!)
 */

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'elementCaptured') {
    handleElementCapture(message.data, sender.tab.id);
    sendResponse({ success: true });
  }
  else if (message.action === 'captureScreenshot') {
    // Handle screenshot capture request
    handleScreenshotCapture(message.elementInfo, sender.tab.id, sendResponse);
    return true; // Keep channel open for async response
  }
  else if (message.action === 'copyToClipboard') {
    // Handle clipboard copy request (fallback method)
    handleClipboardCopy(message.text, sender.tab.id, sendResponse);
    return true; // Keep channel open for async response
  }
  return true;
});

/**
 * Process captured element - React code is ALREADY CONVERTED!
 * Storage only - clipboard handled by content.js
 */
async function handleElementCapture(capturedData, tabId) {
  console.log('✅ Element captured with instant React conversion!');
  console.log('   Tag:', capturedData.tagName);
  console.log('   URL:', capturedData.pageUrl);
  
  try {
    // React code is ALREADY converted by content.js (INSTANT!)
    const reactCode = capturedData.reactCode;
    
    if (reactCode) {
      console.log('   React code length:', reactCode.length, 'characters');
    }
    
    // Save to storage (with error handling for quota)
    try {
      await saveCapture(capturedData, reactCode);
      console.log('✅ Saved to Chrome storage');
    } catch (storageErr) {
      console.warn('⚠️ Storage failed (quota), clipboard is primary method:', storageErr.message);
      // Continue anyway - content.js already copied to clipboard
    }
    
    // NOTE: Clipboard copy is now handled in content.js (more reliable)
    // No need to copy here since content.js already did it
    
    // Notify user
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: '✅ React Code Copied!',
        message: 'Paste directly on canvas (Ctrl+V)',
        priority: 2
      });
    } catch (notifError) {
      console.log('Notification skipped');
    }
    
    console.log('✅ Ready! Paste on canvas (Ctrl+V)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Grab AI - Error',
        message: 'Failed to process: ' + error.message,
        priority: 2
      });
    } catch (notifError) {
      console.error('Could not show error notification');
    }
  }
}

/**
 * Copy text to clipboard (fallback method via service worker)
 */
async function handleClipboardCopy(text, tabId, sendResponse) {
  try {
    console.log('📋 Attempting clipboard copy via service worker...');
    
    // Method 1: Use chrome.scripting to execute clipboard write
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (textToCopy) => {
        return navigator.clipboard.writeText(textToCopy)
          .then(() => {
            console.log('✅ Clipboard write successful');
            return { success: true };
          })
          .catch((err) => {
            console.error('❌ Clipboard write failed:', err);
            return { success: false, error: err.message };
          });
      },
      args: [text]
    });
    
    console.log('✅ Clipboard copy successful');
    sendResponse({ success: true });
    
  } catch (error) {
    console.error('❌ Clipboard copy failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Capture screenshot and crop to element bounds
 */
async function handleScreenshotCapture(elementInfo, tabId, sendResponse) {
  try {
    console.log('📸 Capturing screenshot for element:', elementInfo.tagName);
    
    // Capture visible tab
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    
    console.log('✅ Screenshot captured, cropping to element...');
    
    // Crop to element bounds (we'll do this in content script for better performance)
    // For now, just send the full screenshot
    sendResponse({ 
      success: true, 
      screenshot: screenshotDataUrl,
      elementInfo: elementInfo
    });
    
    console.log('✅ Screenshot sent to content script');
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Save capture to Chrome storage
 * FIXED: Only store minimal data to avoid quota exceeded errors
 */
async function saveCapture(capturedData, reactCode) {
  try {
    // Clear old captures first to free up space
    await chrome.storage.local.remove('captures');
    
    const result = await chrome.storage.local.get('captures');
    const captures = result.captures || [];
    
    const componentName = 'Captured' + 
      (capturedData.tagName || 'Section').charAt(0).toUpperCase() + 
      (capturedData.tagName || 'section').slice(1) + 
      Date.now().toString().slice(-4);
    
    // Only store essential data - skip full HTML and React code in storage
    // The React code is already in clipboard, no need to store it
    captures.unshift({
      id: Date.now(),
      type: 'react-component',
      componentName: componentName,
      
      // Store React code truncated or skip if too large
      reactCode: reactCode && reactCode.length < 50000 ? reactCode : null,
      reactCodeTooLarge: reactCode && reactCode.length >= 50000,
      
      // DON'T store full HTML - it's too large with SVGs
      // html: capturedData.html, // REMOVED
      
      // Only store minimal metadata
      tagName: capturedData.tagName,
      className: (capturedData.className || '').slice(0, 100), // Truncate
      dimensions: capturedData.dimensions,
      pageUrl: capturedData.pageUrl,
      
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 5 captures to save space
    if (captures.length > 5) {
      captures.length = 5;
    }
    
    await chrome.storage.local.set({ captures });
  } catch (storageError) {
    console.warn('⚠️ Storage save failed, clearing all captures:', storageError.message);
    // If still failing, clear everything and just save current
    await chrome.storage.local.clear();
    
    try {
      await chrome.storage.local.set({ 
        captures: [{
          id: Date.now(),
          type: 'react-component',
          componentName: 'CapturedSection',
          reactCode: reactCode && reactCode.length < 30000 ? reactCode : null,
          tagName: capturedData.tagName,
          pageUrl: capturedData.pageUrl,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (e) {
      console.error('Storage completely failed - relying on clipboard only');
    }
  }
}
