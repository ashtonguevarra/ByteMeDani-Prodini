const { exec } = require("child_process");

function getActiveWindowLinux() {
  return new Promise((resolve) => {
    exec("xdotool getactivewindow getwindowname", (err, stdout) => {
      if (err) return resolve("Unknown");
      resolve(stdout.trim() || "Desktop / Idle");
    });
  });
}

async function getActiveWindow() {
  return await getActiveWindowLinux();
}

module.exports = { getActiveWindow };