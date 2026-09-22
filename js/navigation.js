/**
 * REACH Mobile App - Navigation Controller
 *
 * Manages screen transitions, status bar presentation, rail active states,
 * and screen lifecycle hooks.
 *
 * In a future React conversion, this maps to React Router or a state-based
 * screen navigator (e.g. NavigationContainer / Tab / Stack navigator).
 */

import { appState } from './state.js';
import { $, $$, setText, setHTML, createTimerGroup } from './utils.js';

/**
 * Screen metadata dictionary
 */
export const SCREEN_CONFIG = {
  splash: {
    index: 1,
    title: 'Splash',
    signal: null,
    showStatusBar: false
  },
  onboarding: {
    index: 2,
    title: 'Onboarding',
    signal: null,
    showStatusBar: false
  },
  register: {
    index: 3,
    title: 'Registration',
    signal: 'yes',
    showStatusBar: true
  },
  relaypermission: {
    index: 4,
    title: 'Enable relay',
    signal: 'yes',
    showStatusBar: true
  },
  home: {
    index: 5,
    title: 'Home · SOS button',
    signal: 'no',
    showStatusBar: true
  },
  aidetect: {
    index: 6,
    title: 'AI detection',
    signal: 'no',
    showStatusBar: true
  },
  category: {
    index: 7,
    title: 'Emergency type',
    signal: 'no',
    showStatusBar: true
  },
  location: {
    index: 8,
    title: 'Location',
    signal: 'no',
    showStatusBar: true
  },
  confirm: {
    index: 9,
    title: 'Confirm',
    signal: 'no',
    showStatusBar: true
  },
  tracking: {
    index: 10,
    title: 'Live status',
    signal: 'weak',
    showStatusBar: true
  },
  resolved: {
    index: 11,
    title: 'Resolved',
    signal: 'yes',
    showStatusBar: true
  },
  contacts: {
    index: 12,
    title: 'Trusted contacts',
    signal: 'yes',
    showStatusBar: true
  },
  relaynotify: {
    index: 13,
    title: 'Relay notification',
    signal: 'yes',
    showStatusBar: false
  },
  relaytransfer: {
    index: 14,
    title: 'Packet transfer view',
    signal: 'yes',
    showStatusBar: true
  }
};

export const TOTAL_SCREENS = Object.keys(SCREEN_CONFIG).length;

// Timer manager for screen-specific animations (AI detection, etc.)
const screenTimers = createTimerGroup();

/**
 * Update the phone chassis status bar
 * @param {object} config - Current screen config
 */
function updateStatusBar(config) {
  const statusBar = $('#statusBar');
  const signalTag = $('#signalTag');
  if (!statusBar || !signalTag) return;

  if (!config.showStatusBar || config.signal === null) {
    statusBar.classList.add('hidden');
    return;
  }

  statusBar.classList.remove('hidden');

  const signalMap = {
    no: { className: 'signal-tag no', label: 'NO SIGNAL' },
    weak: { className: 'signal-tag weak', label: 'WEAK SIGNAL' },
    yes: { className: 'signal-tag yes', label: '4G' }
  };

  const signalInfo = signalMap[config.signal] || signalMap.yes;
  signalTag.className = signalInfo.className;
  signalTag.textContent = signalInfo.label;
}


/**
 * Handle AI Detection screen sequential evidence simulation
 */
function runAiDetectionSequence() {
  const fusionList = $('#fusionList');
  const gaugeWrap = $('#gaugeWrap');
  const gaugeFill = $('#gaugeFill');
  const gaugePct = $('#gaugePct');
  const confirmSlot = $('#aiConfirmSlot');
  const senseMotion = $('#senseMotion');
  const senseVisual = $('#senseVisual');
  const senseAudio = $('#senseAudio');

  if (!fusionList) return;

  // Reset visual state
  fusionList.innerHTML = '';
  if (confirmSlot) confirmSlot.innerHTML = '';
  if (gaugeWrap) gaugeWrap.style.display = 'none';
  if (gaugeFill) gaugeFill.style.width = '0%';
  if (gaugePct) gaugePct.textContent = '0%';
  if (senseMotion) senseMotion.classList.remove('on');
  if (senseVisual) senseVisual.classList.remove('on');
  if (senseAudio) senseAudio.classList.remove('on');

  function setGauge(v) {
    if (gaugeFill) gaugeFill.style.width = v + '%';
    if (gaugePct) gaugePct.textContent = v + '%';
  }

  function addFusion(title, sub, weak = false) {
    const row = document.createElement('div');
    row.className = 'fusion-row' + (weak ? ' weak' : '');
    row.innerHTML = `<div class="fd"></div><div><b>${title}</b><span>${sub}</span></div>`;
    fusionList.appendChild(row);
  }

  // Animation sequence steps
  const sequence = [
    () => senseMotion && senseMotion.classList.add('on'),
    () => senseVisual && senseVisual.classList.add('on'),
    () => senseAudio && senseAudio.classList.add('on'),
    () => {
      if (gaugeWrap) gaugeWrap.style.display = 'block';
      addFusion('Motion spike detected', 'impact-motion-v0.9 · abnormal pattern');
      setGauge(38);
    },
    () => {
      addFusion('Visual smoke pattern match', 'smoke-vision-v1.2 · on-device · 340ms');
      setGauge(69);
    },
    () => {
      addFusion('Ambient sound rising', 'supporting signal, low weight', true);
      setGauge(74);
    },
    () => {
      if (confirmSlot) {
        confirmSlot.innerHTML = `
          <div class="ai-confirm-box">
            <b>Possible fire — is this real?</b>
            <p>REACH pre-fills the emergency type from this evidence, but never sends an alert without your confirmation. Continue to review and confirm, or dismiss if you're okay.</p>
          </div>
          <div class="stack" style="margin-top:14px;">
            <button class="btn-primary" data-nav="category">Yes, continue</button>
            <button class="btn-text" data-nav="home">I'm okay, dismiss</button>
          </div>`;
      }
    }
  ];

  sequence.forEach((stepFn, idx) => {
    screenTimers.add(stepFn, 400 + idx * 550);
  });
}

/**
 * Navigate to a specific screen
 * @param {string} screenKey - Key matching SCREEN_CONFIG
 */
export function navigateTo(screenKey) {
  const config = SCREEN_CONFIG[screenKey];
  if (!config) {
    console.warn(`[Navigation] Screen '${screenKey}' not found.`);
    return;
  }

  // Cancel any running timers from previous screen (e.g. AI simulation)
  screenTimers.clearAll();

  // Update application state
  appState.currentScreen = screenKey;

  // Toggle active screen visibility
  const allScreens = $$('.screen-view');
  allScreens.forEach(screen => {
    const isTarget = screen.id === `screen-${screenKey}`;
    screen.classList.toggle('active', isTarget);
    if (isTarget) {
      screen.scrollTop = 0;
    }
  });

  // Update presentation chrome
  updateStatusBar(config);

  // Trigger screen-specific lifecycle
  if (screenKey === 'splash') {
    // Auto-advance splash screen after 2 seconds
    screenTimers.add(() => {
      navigateTo('onboarding');
    }, 2000);
  } else if (screenKey === 'aidetect') {
    runAiDetectionSequence();
  }
}
