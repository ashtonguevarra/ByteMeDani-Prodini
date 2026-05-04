const activeWin = require("active-win");

let lastApp = "";
let lastTitle = "";

async function trackWindow() {
  try {
    const win = await activeWin();

    if (!win) return;

    const currentApp = win.owner.name;
    const currentTitle = win.title;

    // Only log if something changed (prevents spam)
    if (currentApp !== lastApp || currentTitle !== lastTitle) {
      console.log("App:", currentApp);
      console.log("Title:", currentTitle);
      console.log("----------------------");

      lastApp = currentApp;
      lastTitle = currentTitle;
    }
  } catch (err) {
    console.error("Tracker error:", err);
  }
}

// Run every 1 second
setInterval(trackWindow, 1000);