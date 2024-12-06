console.log("service worker loaded");

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// const GITHUB_ORIGIN = "https://github.com";
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => { // doc: https://developer.chrome.com/docs/extensions/reference/api/tabs?hl=zh-cn#event-onUpdated
//   if (changeInfo.status !== "complete") return;
//   const url = new URL(tab.url);
//   if (url.origin === GITHUB_ORIGIN) {
//     await chrome.sidePanel.setOptions({
//       tabId,
//       path: "index.html",
//       enabled: true,
//     });
//   } else {
//     // Disables the side panel on all other sites
//     await chrome.sidePanel.setOptions({
//       tabId,
//       enabled: false,
//     });
//   }
// });
