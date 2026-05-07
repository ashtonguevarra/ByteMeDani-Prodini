const { execSync } = require("child_process");

// Initialize active-win module for Windows and macOS tracking
// This module provides native access to the active window information
let activeWin;

try {
  activeWin = require("active-win");
} catch (err) {
  // Log when active-win fails to load - this helps with debugging on Windows
  console.warn("Warning: active-win module failed to load. Windows/macOS tracking may not work properly.", err.message);
}

/**
 * Helper function to execute system commands and return output
 * Used for Linux window tracking via xdotool and hyprctl commands
 * @param {string} cmd - The command to execute
 * @returns {string|null} - Command output or null if execution fails
 */
function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (err) {
    // Command execution failed, return null
    return null;
  }
}

/**
 * Get the active window for Hyprland window manager (Linux)
 * Hyprland is a modern dynamic tiling Wayland compositor
 * @returns {string|null} - Window info in format "AppClass - WindowTitle" or null
 */
function getHyprlandWindow() {
  const output = run("hyprctl -j activewindow");
  if (!output) return null;

  try {
    const win = JSON.parse(output);
    return `${win.class} - ${win.title}`;
  } catch (err) {
    console.warn("Error parsing Hyprland window data:", err.message);
    return null;
  }
}

/**
 * Get the active window for X11 Linux systems
 * Uses xdotool to query the window manager for active window information
 * @returns {string|null} - Window title or null if unable to get window
 */
function getX11Window() {
  const id = run("xdotool getactivewindow");
  if (!id) return null;

  const title = run(`xdotool getwindowname ${id}`);
  return title || null;
}

/**
 * Get the active window for Windows and macOS using the active-win native module
 * This uses platform-native APIs to get window information
 * @returns {Promise<string|null>} - Window info in format "AppName - WindowTitle" or null
 */
async function getNativeWindow() {
  // If active-win module is not available, return null
  if (!activeWin) {
    console.warn("active-win module is not available. Ensure it's properly installed with: npm install active-win");
    return null;
  }

  try {
    const win = await activeWin();
    if (!win) {
      console.debug("No active window found or unable to get window info");
      return null;
    }

    // Format: "AppName - WindowTitle"
    return `${win.owner.name} - ${win.title}`;
  } catch (err) {
    console.error("Error getting native window information:", err.message);
    return null;
  }
}

/**
 * Windows PowerShell fallback to get the foreground window and process name
 * This avoids native module builds (ffi-napi) by invoking a small PowerShell
 * snippet that calls user32.dll via Add-Type and returns "ProcessName - Title".
 * @returns {string|null}
 */
function getWindowsViaPowerShell() {
  // Build a PowerShell one-liner that defines the native methods and prints the result
  // Use a full C# TypeDefinition (with using directives) so Add-Type compiles
  const ps = 'powershell -NoProfile -Command "Add-Type -TypeDefinition \'using System; using System.Text; using System.Runtime.InteropServices; public class User32 { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count); [DllImport(\\"user32.dll\\")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId); }\' ; $hwnd=[User32]::GetForegroundWindow(); $sb=New-Object System.Text.StringBuilder 1024; [User32]::GetWindowText($hwnd,$sb,$sb.Capacity) | Out-Null; $outPid=0; [User32]::GetWindowThreadProcessId($hwnd,[ref]$outPid) | Out-Null; $pid=[int]$outPid; $p=Get-Process -Id $pid; Write-Output ($p.ProcessName + ' - ' + $sb.ToString())"';

  try {
    const out = run(ps);
    return out || null;
  } catch (err) {
    console.warn('PowerShell fallback failed:', err && err.message);
    return null;
  }
}

/**
 * Main function to get the active window across all supported platforms
 * Automatically detects the platform and uses the appropriate method
 * 
 * Supported platforms:
 * - Windows (via native APIs)
 * - macOS (via native APIs)
 * - Linux X11 (via xdotool)
 * - Linux Hyprland (via hyprctl)
 * 
 * @returns {Promise<string>} - Active window info or error message
 */
async function getActiveWindow() {
  const platform = process.platform;
  const session = process.env.XDG_SESSION_TYPE || "";
  const desktop = process.env.XDG_CURRENT_DESKTOP || "";

  console.debug(`Platform: ${platform}, Session: ${session}, Desktop: ${desktop}`);

  // Try Hyprland first (modern Wayland compositor on Linux)
  if (desktop.toLowerCase().includes("hyprland")) {
    console.debug("Attempting to get window from Hyprland");
    const win = getHyprlandWindow();
    if (win) return win;
  }

  // Try Linux X11 (traditional X Window System)
  if (platform === "linux" && session === "x11") {
    console.debug("Attempting to get window from X11");
    const win = getX11Window();
    if (win) return win;
  }

  // Try Windows/macOS native methods
  if (platform === "win32" || platform === "darwin") {
    console.debug(`Attempting to get window for ${platform === "win32" ? "Windows" : "macOS"}`);
  }
  
  const win = await getNativeWindow();
  if (win) return win;

  // If all methods fail, return error message
  // Try PowerShell fallback on Windows before giving up
  if (platform === "win32") {
    console.debug("Attempting PowerShell fallback for Windows active window");
    const psWin = getWindowsViaPowerShell();
    if (psWin) return psWin;
  }

  console.error("Unable to track active window on this system");
  return "Unable to track window - system not properly supported or active-win module not installed";
}

module.exports = { getActiveWindow };