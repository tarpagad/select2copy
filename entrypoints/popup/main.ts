import './style.css';

// Declare chrome API for TypeScript
declare const chrome: any;

// Function to open extension settings
function openExtensionSettings() {
  // Check if we're in Firefox or Chrome
  if (typeof browser !== 'undefined') {
    // Firefox
    browser.runtime.openOptionsPage();
  } else if (typeof chrome !== 'undefined') {
    // Chrome
    chrome.runtime.openOptionsPage();
  }
}

// Function to close the popup
function closePopup() {
  window.close();
}

// Add event listener to the settings link
document.addEventListener('DOMContentLoaded', () => {
  const settingsLink = document.getElementById('open-settings');
  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExtensionSettings();
      // Close the popup after opening settings
      setTimeout(closePopup, 100); // Small delay to ensure settings page opens
    });
  }
});
