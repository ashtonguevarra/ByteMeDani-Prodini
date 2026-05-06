const { execSync } = require("child_process");
let activeWin;

// only load active-win on supported platforms
try {
  activeWin = require("active-win");
} catch {}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// HYPRLAND
function getHyprlandWindow() {
  const output = run("hyprctl -j activewindow");
  if (!output) return null;

  try {
    const win = JSON.parse(output);
    return `${win.class} - ${win.title}`;
  } catch {
    return null;
  }
}

// X11
function getX11Window() {
  const id = run("xdotool getactivewindow");
  if (!id) return null;

  const title = run(`xdotool getwindowname ${id}`);
  return title || null;
}

// WINDOWS + MAC
async function getNativeWindow() {
  if (!activeWin) return null;

  try {
    const win = await activeWin();

    console.log(win);

    if (!win) return null;

    return `${win.owner.name} - ${win.title}`;
  } catch {
    return null;
  }
}

// MAIN FUNCTION
async function getActiveWindow() {
  const platform = process.platform;
  const session = process.env.XDG_SESSION_TYPE || "";
  const desktop = process.env.XDG_CURRENT_DESKTOP || "";

  // Hyprland
  if (desktop.toLowerCase().includes("hyprland")) {
    const win = getHyprlandWindow();
    if (win) return win;
  }

  // Linux X11
  if (platform === "linux" && session === "x11") {
    const win = getX11Window();
    if (win) return win;
  }

  // Windows + macOS fallback
  const win = await getNativeWindow();
  if (win) return win;

  return "Unsupported system";
}

module.exports = { getActiveWindow };