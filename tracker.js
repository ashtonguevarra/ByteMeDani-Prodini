const { exec } = require("child_process");

let activeWinLib = null;
let windowManager = null;

// Lazy-load to avoid hard crashes if native bindings fail
try {
  activeWinLib = require("active-win");
} catch (e) {
  activeWinLib = null;
}

try {
  windowManager = require("node-window-manager");
} catch (e) {
  windowManager = null;
}

function execAsync(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) return resolve(null);
      resolve(stdout?.trim() || null);
    });
  });
}

// ---------- Linux fallback (X11) ----------
async function getLinuxWindow() {
  // xdotool works on X11 only
  const name = await execAsync("xdotool getactivewindow getwindowname");
  return name || "Desktop / Idle";
}

// ---------- macOS fallback ----------
async function getMacWindow() {
  const script = osascript -e 'tell application "System Events" to get name of first process whose frontmost is true';
  const name = await execAsync(script);
  return name || "macOS Desktop";
}

// ---------- Windows fallback ----------
async function getWindowsWindow() {
  // Prefer node-window-manager
  if (windowManager) {
    try {
      const win = windowManager.getActiveWindow();
      if (win) return win.getTitle() || "Windows Desktop";
    } catch {}
  }

  // Last resort: PowerShell (not perfectly accurate, but safe)
  const ps = powershell -NoProfile -Command "(Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object -Expand MainWindowTitle -Last 1)";
  const name = await execAsync(ps);
  return name || "Windows Desktop";
}

// ---------- Main unified function ----------
async function getActiveWindow() {
  // 1) Try active-win first (best data)
  if (activeWinLib) {
    try {
      const result = await activeWinLib();
      if (result) {
        return ${result.owner?.name || "app"} - ${result.title || "unknown"};
      }
    } catch {
      // fall through
    }
  }

  // 2) Fallbacks per platform
  const platform = process.platform;

  if (platform === "linux") {
    return await getLinuxWindow();
  }

  if (platform === "darwin") {
    return await getMacWindow();
  }

  if (platform === "win32") {
    return await getWindowsWindow();
  }

  return "Unknown Platform";
}

module.exports = { getActiveWindow };