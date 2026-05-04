const { exec } = require("child_process");

function normalize(title) {
  return (title || "").toString().trim().toLowerCase();
}

let activeWin;
try {
  activeWin = require('active-win');
} catch (e) {
  activeWin = null;
}

function getActiveWindow() {
  return new Promise(resolve => {
    const platform = process.platform;

    if (platform === "linux") {
      exec("xdotool getactivewindow getwindowname", (err, stdout) => {
        resolve(normalize(stdout) || "desktop");
      });
    } 

    else if (platform === "win32") {
      if (activeWin) {
        activeWin().then(info => {
          let title = normalize(info && info.title);
          if (!title || title === '' || title.includes('program manager')) {
            title = "windows desktop";
          }
          resolve(title);
        }).catch(err => {
          console.error('active-win error:', err);
          exec('powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command "Add-Type @\"using System;using System.Runtime.InteropServices;using System.Text;public class Win32{[DllImport(\\\"user32.dll\\\")]public static extern IntPtr GetForegroundWindow();[DllImport(\\\"user32.dll\\\")]public static extern int GetWindowText(IntPtr hWnd,StringBuilder text,int count);}\"@; $h=[Win32]::GetForegroundWindow(); $t=New-Object System.Text.StringBuilder(256); [Win32]::GetWindowText($h,$t,256); $t.ToString()"', 
            { timeout: 2000 },
            (err2, stdout, stderr) => {
              if (err2) console.error('powershell exec error:', err2);
              if (stderr) console.error('powershell stderr:', stderr.toString().trim());
              let title = normalize(stdout);
              if (!title || title === '' || title.includes('program manager')) {
                title = "windows desktop";
              }
              resolve(title);
            });
        });
      } else {
        exec('powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command "Add-Type @\"using System;using System.Runtime.InteropServices;using System.Text;public class Win32{[DllImport(\\\"user32.dll\\\")]public static extern IntPtr GetForegroundWindow();[DllImport(\\\"user32.dll\\\")]public static extern int GetWindowText(IntPtr hWnd,StringBuilder text,int count);}\"@; $h=[Win32]::GetForegroundWindow(); $t=New-Object System.Text.StringBuilder(256); [Win32]::GetWindowText($h,$t,256); $t.ToString()"', 
          { timeout: 2000 },
          (err, stdout, stderr) => {
            if (err) console.error('powershell exec error:', err);
            if (stderr) console.error('powershell stderr:', stderr.toString().trim());
            let title = normalize(stdout);
            if (!title || title === '' || title.includes('program manager')) {
              title = "windows desktop";
            }
            resolve(title);
          });
      }
    }

    else if (platform === "darwin") {
      exec('osascript -e \'tell app "System Events" to get name of first process whose frontmost is true\'', 
        (err, stdout) => {
          resolve(normalize(stdout) || "macos desktop");
        });
    }
  });
}

module.exports = { getActiveWindow };

// Test every second (like your example)
if (require.main === module) {
  setInterval(async () => {
    const window = await getActiveWindow();
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ timestamp, window }));
  }, 1000);
}