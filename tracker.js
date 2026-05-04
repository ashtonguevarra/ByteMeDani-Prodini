const { exec } = require("child_process");

function getActiveWindow() {
  return new Promise((resolve) => {
    const platform = process.platform;

    if (platform === "linux") {
      // Your existing Linux command
      exec("xdotool getactivewindow getwindowname", (err, stdout) => {
        resolve(stdout ? stdout.trim().toLowerCase() : "Desktop / Idle");
      });
    } 
    else if (platform === "win32") {
      // Windows command (using PowerShell)
      const powershellCmd = 'powershell "Get-Process | Where-Object {$_.mainWindowTitle} | Select-Object -ExpandProperty mainWindowTitle | Select-Object -Last 1"';
      exec(powershellCmd, (err, stdout) => {
        resolve(stdout ? stdout.trim() : "Windows Desktop");
      });
    } 
    else if (platform === "darwin") {
      // macOS command (using AppleScript)
      const appleScript = 'osascript -e "tell application \\"System Events\\" to get name of first process whose frontmost is true"';
      exec(appleScript, (err, stdout) => {
        resolve(stdout ? stdout.trim() : "macOS Desktop");
      });
    } 
    else {
      resolve("Unknown Platform");
    }
  });
}

module.exports = { getActiveWindow };