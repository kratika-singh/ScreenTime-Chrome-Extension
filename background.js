let activeTabs = {};
let trackedTime = {};
let lastMouseMoveTime = Date.now();

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    let url = new URL(tab.url);
    let domain = url.hostname;
    let now = Date.now();

    if (activeTabs[activeInfo.previousTabId]) {
      let prevDomain = activeTabs[activeInfo.previousTabId].domain;
      let timeSpent = (now - activeTabs[activeInfo.previousTabId].startTime) / 1000;
      updateTrackedTime(prevDomain, timeSpent);
    }

    activeTabs[activeInfo.tabId] = { domain: domain, startTime: now };
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs[tabId]) {
    let now = Date.now();
    let domain = activeTabs[tabId].domain;
    let timeSpent = (now - activeTabs[tabId].startTime) / 1000;
    updateTrackedTime(domain, timeSpent);
    delete activeTabs[tabId];
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});

function updateTrackedTime(domain, timeSpent) {
  let today = new Date().toISOString().slice(0, 10);
  chrome.storage.sync.get(['trackedTime'], (result) => {
    trackedTime = result.trackedTime || {};

    if (!trackedTime[today]) {
      trackedTime[today] = {};
    }

    if (!trackedTime[today][domain]) {
      trackedTime[today][domain] = 0;
    }

    trackedTime[today][domain] += timeSpent;
    chrome.storage.sync.set({ trackedTime: trackedTime });
  });
}

function sendNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Screen Time Tracker',
    message: message,
    priority: 2
  });
}

function checkMouseInactivity() {
  let now = Date.now();
  if (now - lastMouseMoveTime > 3600000) { // 1 hour
    sendNotification('You have been active for an hour. Consider taking a break.');
    lastMouseMoveTime = now; // reset the timer
  }
}

setInterval(checkMouseInactivity, 60000); // check every minute

document.addEventListener('mousemove', () => {
  lastMouseMoveTime = Date.now();
});