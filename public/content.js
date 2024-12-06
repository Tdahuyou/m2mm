(async () => {
  console.log('content script loaded');
  /* const article = document.querySelector("article");
  const response = await chrome.runtime.sendMessage({
    outerHTML: article.outerHTML,
    url: window.location.toString().match(/https:\/\/github\.com(\/.*)?/)[1],
    // eg. https://github.com/Tdahuyou/electron
    // url => /Tdahuyou/electron
  });
  // do something with response here, not outside the function
  // console.log('received msg:', response); */
})();
