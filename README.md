# REACH — Standalone Citizen Mobile App Prototype

A clean, readable, standalone vanilla **HTML / CSS / JavaScript** extraction of the REACH Citizen Mobile App prototype.

---

## 1. Project Structure

```text
reach-mobile/
│
├── index.html                  # Semantic application markup (all 14 screens)
│
├── css/
│   ├── styles.css              # Core tokens, typography, app shell, phone chassis
│   ├── components.css          # Organized component styles (buttons, cards, AI gauge, etc.)
│   └── responsive.css          # Responsive rules, tablet/mobile viewports, reduced motion
│
├── js/
│   ├── app.js                  # Application entry point, event listeners, bootstrap
│   ├── state.js                # Centralized state management & state updater functions
│   ├── navigation.js           # Screen registry, transition controller, lifecycle hooks
│   └── utils.js                # DOM helpers & animation timer management
│
├── assets/
│   ├── icons/
│   │   └── reach-logo.svg      # Vector SVG brand icon
│   └── images/                 # Image asset directory
│
└── README.md                   # Documentation, React migration guide & PWA roadmap
```

---

## 2. What Was Extracted

This application was extracted from `reach_full_demo_v3.html` (`PAGES_B64.mobileApp`), removing:
* Unified prototype navigation tabs (Relay & AI Demo, Dashboard, Feature Phone).
* The dynamic Base64 blob decoding architecture (`atob`, `URL.createObjectURL`).
* Top-level iframe wrappers and inter-window messaging.
* Unused CSS and JavaScript from the responder dashboard, feature phone USSD simulation, and multi-device relay animation.

The result is a **100% self-contained, independent web application**. It can be opened directly in any browser or served using any static web server (such as Live Server, `npx serve`, Python HTTP, or Nginx).

---

## 3. Architecture & Code Organization

### HTML (`index.html`)
Unlike the original prototype where screen HTML was stored as JavaScript string templates, `index.html` houses all 14 screens as clean semantic `<section class="screen-view" id="screen-[id]">` elements:
* **Getting Started (1–4)**: `screen-splash`, `screen-onboarding`, `screen-register`, `screen-relaypermission`
* **Emergency Flow (5–9)**: `screen-home`, `screen-aidetect`, `screen-category`, `screen-location`, `screen-confirm`
* **After Sending (10–12)**: `screen-tracking`, `screen-resolved`, `screen-contacts`
* **Background Relay / Phone B (13–14)**: `screen-relaynotify`, `screen-relaytransfer`

Interactive elements use `data-nav="[screenKey]"` attributes, decoupled from JavaScript function names.

### CSS
* **`css/styles.css`**: Design tokens (`--red-600`, `--ink-900`, `--ai-600`, etc.), font definitions (`Barlow Condensed`, `Inter`, `JetBrains Mono`), centered viewport shell, and realistic mobile phone hardware chassis (notch, status bar, signal tag).
* **`css/components.css`**: Organized into distinct sections with visual banners: Buttons, Headers, Splash, SOS Button, AI Perception & Fusion, Emergency Categories, Maps, Confirmation Cards, Live Status Journey, Resolved Summary, and Relay Lockscreen Notification.
* **`css/responsive.css`**: Responsive scaling for smaller screens and real mobile displays (fills viewport smoothly on phones without horizontal overflow) and honors `prefers-reduced-motion`.

### JavaScript
* **`js/state.js`**: Holds the single source of truth (`appState`):
  * `currentScreen`: Currently active screen key.
  * `user`: Profile information (name, phone, registered zone).
  * `relayEnabled`: Boolean toggle controlling background relay participation.
  * `emergency`: Category selection (`fire`, `medical`, `security`, `accident`), location selection, priority, and confidence.
  * `aiDetection`: Real-time sensory detection state (`motionDetected`, `visualDetected`, `audioDetected`, `confidencePct`).
  * Provides `subscribeState()`, `setRelayEnabled()`, `setSelectedCategory()`, and `setSelectedLocation()`.
* **`js/navigation.js`**: Screen registry (`SCREEN_CONFIG`) containing metadata for all 14 screens (title, index, signal type: `no` | `weak` | `yes`, status bar visibility).
  * `navigateTo(screenKey)` transitions between screens using active classes, updates hardware status bar, and manages screen lifecycle hooks (such as auto-advancing the splash screen and running `runAiDetectionSequence()`).
* **`js/utils.js`**: DOM querying helpers and `createTimerGroup()`, which ensures all pending sequential animation timers are safely cleared if the user navigates away mid-simulation.
* **`js/app.js`**: Bootstraps the application, binds in-phone event delegation (`[data-nav]`, forms, switches, category selectors), and starts at the splash screen.

---

## 4. Future React / TypeScript Conversion Guide

When ready to migrate this codebase to React and TypeScript, the current architecture maps cleanly:

```text
Vanilla HTML/CSS/JS Architecture             React / TypeScript Target Architecture
───────────────────────────────────────────────────────────────────────────────────────
<section id="screen-home" ...>         →     src/screens/HomeScreen.tsx
<section id="screen-aidetect" ...>     →     src/screens/AiDetectScreen.tsx
<section id="screen-category" ...>     →     src/screens/CategoryScreen.tsx
(All 14 screen sections)               →     Individual Screen Components in src/screens/

appState in state.js                   →     React Context (AppContext.tsx) or Zustand store
setRelayEnabled(), setSelectedCategory →     Context Actions / Reducer Dispatches

navigation.js (navigateTo)             →     React Router / State-based Tab & Stack Navigator
SCREEN_CONFIG                          →     Route definitions with TypeScript route types

css/styles.css & components.css        →     Global CSS / CSS Modules (HomeScreen.module.css)
                                             or Tailwind configuration using tokens
```

### Component Structure Suggestion
```text
src/
├── types/
│   └── index.ts                 # User, Emergency, Incident, ScreenKey interfaces
├── context/
│   └── EmergencyContext.tsx     # State provider matching state.js
├── hooks/
│   └── useNavigation.ts         # Navigation hook matching navigateTo()
├── components/
│   ├── shell/PhoneFrame.tsx     # Notch, StatusBar, Screen viewport
│   ├── ui/Button.tsx
│   └── ui/StatusBadge.tsx
└── screens/
    ├── SplashScreen.tsx
    ├── OnboardingScreen.tsx
    ├── HomeScreen.tsx
    ├── AiDetectScreen.tsx
    └── ... (remaining screens)
```

---

## 5. PWA Readiness & Next Steps

This application is structurally prepared to become an installable Progressive Web App (PWA).

### Required Steps:

1. **Web App Manifest (`manifest.json`)**:
   Add a web app manifest linking icons, theme color, background color, display mode:
   ```json
   {
     "name": "REACH Citizen Emergency",
     "short_name": "REACH",
     "start_url": "./index.html",
     "display": "standalone",
     "background_color": "#F7F5F3",
     "theme_color": "#C81E1E",
     "icons": [
       { "src": "./assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "./assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
     ]
   }
   ```

2. **Service Worker (`sw.js`)**:
   Implement offline caching:
   * **Cache-First**: Cache app shell (`index.html`, CSS, JS, fonts, SVGs).
   * **Network-First with IndexedDB Queue**: When offline during emergency reporting, queue the emergency packet into IndexedDB so it can be relayed via Bluetooth / WebRTC or uploaded upon reconnection.

3. **App Icons**:
   Generate standard PNG icons (192x192, 512x512) from `assets/icons/reach-logo.svg`.

4. **Offline Caching Strategy**:
   * Pre-cache all CSS, JS, and font assets during Service Worker install.
   * Provide an offline fallback state for external map tiles if added later.

5. **HTTPS Deployment**:
   Deploy the static build to an HTTPS-enabled host (e.g. Cloudflare Pages, Vercel, Firebase Hosting, GitHub Pages) to satisfy PWA installation criteria.

---

## 6. How to Run Locally

You can run this project with any local HTTP server:

```bash
# Option A: Using Node.js npx serve
npx serve reach-mobile

# Option B: Using Python built-in server
cd reach-mobile && python -m http.server 3000

# Option C: Directly open index.html in any modern browser supporting ES modules
```
