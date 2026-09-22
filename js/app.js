/**
 * REACH Mobile App - Main Application Bootstrap
 *
 * Connects state, navigation, and user interactions.
 */

import {
  appState,
  setRelayEnabled,
  setSelectedCategory,
  setSelectedLocation,
  subscribeState
} from './state.js';
import { navigateTo, SCREEN_CONFIG } from './navigation.js';
import { $, $$, setText } from './utils.js';

/**
 * Handle Background Relay Switch Toggle
 */
function handleRelayToggle() {
  const isEnabled = setRelayEnabled();
  const toggleRow = $('#relayToggleRow');
  const toggleSwitch = $('#relaySwitch');
  const toggleSub = $('#relayToggleSub');

  if (toggleRow) toggleRow.classList.toggle('on', isEnabled);
  if (toggleSwitch) toggleSwitch.classList.toggle('on', isEnabled);
  if (toggleSub) {
    toggleSub.textContent = isEnabled
      ? 'On — this device can carry emergency packets nearby'
      : 'Off — this device will not relay for others';
  }

  // Update home screen relay chip if present
  const homeRelayChip = $('#homeRelayChip');
  if (homeRelayChip) {
    homeRelayChip.style.display = isEnabled ? 'flex' : 'none';
  }
}

/**
 * Handle Emergency Category Selection
 * @param {Element} rowElement - Selected category row
 */
function handleCategorySelect(rowElement) {
  const categoryKey = rowElement.dataset.category || 'fire';
  const labelEl = rowElement.querySelector('.cat-text b');
  const label = labelEl ? labelEl.textContent.trim() : 'Fire';

  // Update UI selection
  $$('.cat-row').forEach(row => row.classList.remove('selected'));
  rowElement.classList.add('selected');

  // Update State
  setSelectedCategory(categoryKey, label);

  // Update Confirm screen summary
  const confirmCatType = $('#confirmCatType');
  if (confirmCatType) confirmCatType.textContent = label;
}

/**
 * Handle Location Option Selection
 * @param {Element} optionElement - Selected location option
 */
function handleLocationSelect(optionElement) {
  const locType = optionElement.dataset.locType || 'registered';
  const labelEl = optionElement.querySelector('b');
  const label = labelEl ? labelEl.textContent.trim() : 'Zone B';

  // Update UI selection
  $$('.loc-option').forEach(opt => opt.classList.remove('selected'));
  optionElement.classList.add('selected');

  // Update State
  setSelectedLocation(locType, label);

  // Update Confirm screen summary
  const confirmLoc = $('#confirmLocType');
  if (confirmLoc) confirmLoc.textContent = label;
}

/**
 * Bind Global Event Delegation
 */
function setupEventDelegation() {

  // Global [data-nav] clicks inside phone screen
  const phoneScreen = $('#phoneScreen');
  if (phoneScreen) {
    phoneScreen.addEventListener('click', event => {
      const navBtn = event.target.closest('[data-nav]');
      if (navBtn) {
        event.preventDefault();
        const targetScreen = navBtn.getAttribute('data-nav');
        if (targetScreen) {
          navigateTo(targetScreen);
        }
      }
    });
  }

  // Relay toggle button
  const relayRow = $('#relayToggleRow');
  if (relayRow) {
    relayRow.addEventListener('click', handleRelayToggle);
  }

  // Category selection rows
  const catList = $('#catList');
  if (catList) {
    catList.addEventListener('click', event => {
      const row = event.target.closest('.cat-row');
      if (row) {
        handleCategorySelect(row);
      }
    });
  }

  // Location selection options
  const locList = $('#locList');
  if (locList) {
    locList.addEventListener('click', event => {
      const opt = event.target.closest('.loc-option');
      if (opt) {
        handleLocationSelect(opt);
      }
    });
  }
}

/**
 * Initialize Application
 */
function init() {
  setupEventDelegation();

  // Subscribe to state changes if needed for global sync
  subscribeState(state => {
    // Sync any UI indicators when state changes
  });

  // Start on the splash screen
  navigateTo('splash');
}

// Bootstrap when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
