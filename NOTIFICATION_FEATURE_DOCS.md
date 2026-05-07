# Inactivity Notification Feature Documentation

## Overview
Added a comprehensive notification system that alerts users when they've been inactive for a customizable duration. The feature includes multiple sound modes and a user-friendly popup notification that redirects to the live tracking app.

## Features Implemented

### 1. **Notification Settings (Customize Modal)**
Located in the Customize panel (Customize button in sidebar):
- **Inactivity Timeout**: Set alert timing from 1-60 minutes (default: 1 minute)
- **Sound Mode**: Three options:
  - **Soft**: Low frequency (600Hz), short duration (0.3s), volume 0.3
  - **Normal**: Medium frequency (800Hz), standard duration (0.5s), volume 0.6 (default)
  - **Hard**: High frequency (1000Hz), long duration (0.8s), volume 0.8 + double beep
- **Enable/Disable**: Toggle notifications on/off with checkbox
- **Test Button**: Click to preview the notification with current settings

### 2. **Sound Generation**
Uses Web Audio API to generate alert sounds dynamically:
```javascript
- Soft Mode: Single beep at 600Hz
- Normal Mode: Single beep at 800Hz
- Hard Mode: Double beep (1000Hz + 800Hz)
```

### 3. **Inactivity Notification Popup**
Appears in the bottom-right corner when user is inactive:
- **Header**: "⚠️ Inactivity Detected" with close button
- **Message**: "You've been inactive for a while. Click here to return to tracking."
- **Action Button**: "Return to Tracking" - redirects to home view and focuses window
- **Auto-dismiss**: Notification hides after 10 seconds
- **Slide-in Animation**: Smooth entrance from the right

### 4. **User Activity Tracking**
Monitors three events to reset inactivity timer:
- Mouse movement (`mousemove`)
- Keyboard input (`keydown`)
- Mouse click (`click`)

When any activity is detected, the timer resets and starts counting down again.

### 5. **Persistent Settings**
Settings are saved to localStorage under key: `notificationSettingsV1`
- Survives app restarts
- Automatically loaded on startup
- Updates in real-time as user changes settings

## Implementation Details

### Files Modified

#### 1. **index.html**
- Added notification settings UI to the Customize modal
- Added inactivity notification popup HTML structure
- Settings placed before the two-column settings layout

#### 2. **style.css** (Added ~150 lines)
- `.notification-settings-section`: Settings container styling
- `.notification-controls`: Flex layout for controls
- `.notification-item`: Individual setting row styling
- `.inactivity-notification`: Popup container with fixed positioning
- `.notification-content`: Popup card styling with shadow and border
- Animations: `slideIn` keyframe for smooth entrance
- Responsive design for smaller screens

#### 3. **renderer.js** (Added ~250 lines)
- **Storage Management**:
  - `loadNotificationSettings()`: Load from localStorage
  - `saveNotificationSettings()`: Persist to localStorage
  - `updateNotificationSettingsUI()`: Sync UI with settings

- **Sound Generation**:
  - `playNotificationSound(mode)`: Web Audio API implementation
  - Supports soft, normal, and hard modes
  - Double-beep for hard mode

- **Notification Display**:
  - `showInactivityNotification()`: Show popup with sound
  - `hideInactivityNotification()`: Hide popup
  - Auto-hide after 10 seconds

- **Inactivity Timer**:
  - `resetInactivityTimer()`: Clear and restart timer
  - Monitors `isTracking` status
  - Only active during tracking sessions

- **Event Handlers**:
  - Settings changes: `change` events on inputs/selects
  - User activity: `mousemove`, `keydown`, `click` listeners
  - Notification interaction: Close button and action button
  - Test button: Manual notification trigger

- **Integration**:
  - Integrated with existing tracking status handler
  - Timer stops when tracking ends
  - Timer resets when tracking starts
  - Notification hidden when tracking stops

#### 4. **preload.js** (Added 1 method)
- Added `focusApp()` method to focus the window when notification is clicked
- Secure IPC bridge for renderer-to-main communication

#### 5. **main.js** (Added 1 IPC handler)
- Added `ipcMain.on("focus-app")` handler
- Brings window to focus when notification action button is clicked
- Uses `win.show()` and `win.focus()`

## How It Works

### Flow Diagram
```
User Starts Tracking
    ↓
resetInactivityTimer() called
    ↓
Timer set for (inactivityTimeout * 60 * 1000)ms
    ↓
User is inactive for set duration
    ↓
showInactivityNotification() triggered
    ↓
- Notification popup appears
- Sound plays (soft/normal/hard)
- Auto-hides after 10 seconds
    ↓
User clicks notification or action button
    ↓
- Window focuses
- Home view loads
- User sees tracking dashboard
    ↓
User moves mouse/types/clicks
    ↓
resetInactivityTimer() resets timer
    ↓
Cycle continues until tracking stops
```

### Activity Reset Behavior
When user performs any tracked activity:
1. Current timer is cleared
2. Notification popup (if shown) is hidden
3. New timer starts for the full inactivity duration
4. Settings respected (enabled/disabled, timeout, sound mode)

## Settings Storage Format
```javascript
{
  enabled: boolean,              // true/false
  inactivityTimeout: number,     // 1-60 minutes
  soundMode: "soft" | "normal" | "hard"
}
```

Example stored value:
```json
{
  "enabled": true,
  "inactivityTimeout": 5,
  "soundMode": "hard"
}
```

## Usage Instructions

### For Users
1. **Access Settings**: Click "Customize" button in sidebar
2. **Configure Timeout**: Set desired inactivity duration (1-60 minutes)
3. **Choose Sound**: Select Soft, Normal, or Hard mode
4. **Enable/Disable**: Check/uncheck "Enable Notifications" checkbox
5. **Test**: Click "Test Notification" to preview
6. **Start Tracking**: Click "Start Session"
7. **Stay Inactive**: Wait for the set duration without mouse/keyboard input
8. **See Notification**: Orange popup appears in bottom-right corner
9. **Return to Tracking**: Click notification popup to refocus window

### Default Settings
- **Enabled**: Yes
- **Timeout**: 1 minute
- **Sound Mode**: Normal

## Technical Specifications

### Audio Generation Parameters
```javascript
Soft:
  - Frequency: 600Hz
  - Duration: 0.3 seconds
  - Volume: 0.3
  - Waveform: Sine wave

Normal:
  - Frequency: 800Hz
  - Duration: 0.5 seconds
  - Volume: 0.6
  - Waveform: Sine wave

Hard:
  - Primary Beep: 1000Hz, 0.8s, volume 0.8
  - Secondary Beep: 800Hz, 0.5s, volume 0.6
  - Delay: 400ms between beeps
```

### CSS Animations
- **Slide In**: 0.3s ease-out from right to left
- **Hover Effects**: Color transitions on buttons (0.2s)
- **Active State**: Scale transform (0.98) for tactile feedback

### Event Listeners
```javascript
- mousemove (passive): Detect mouse activity
- keydown (passive): Detect keyboard activity
- click (passive): Detect click activity
```

## Browser Compatibility
- **Web Audio API**: Chrome, Firefox, Safari, Edge
- **localStorage**: All modern browsers
- **CSS Animations**: All modern browsers
- **Passive Event Listeners**: All modern browsers

## Future Enhancements
- [ ] Customize notification sounds per mode
- [ ] Different notification styles (toast vs popup)
- [ ] Email/Slack integration for missed notifications
- [ ] Analytics on inactivity patterns
- [ ] Custom reminder messages
- [ ] Integration with break mode
- [ ] Notification history log

## Troubleshooting

### Notification Not Appearing
1. Check if "Enable Notifications" is checked
2. Verify tracking is started ("Start Session" button)
3. Wait for the set inactivity duration
4. Try "Test Notification" button

### No Sound
1. Check browser audio permissions
2. Verify system volume is not muted
3. Try different sound mode
4. Check browser developer console for errors

### Settings Not Saving
1. Check if localStorage is enabled in browser
2. Clear browser cache and reload
3. Check browser's DevTools Storage tab
4. Verify no browser extensions blocking localStorage

## Dependencies
- **Electron**: Main framework
- **Web Audio API**: Built-in browser API
- **localStorage**: Built-in browser API
- No external npm packages required

## Code Quality
- ✅ No syntax errors (validated with `node -c`)
- ✅ Follows existing code style and patterns
- ✅ Comprehensive comments and JSDoc
- ✅ Error handling with try-catch blocks
- ✅ Proper event listener management
- ✅ Graceful fallbacks and error logging
