chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'getAuthStatus') {
    let aTags = document.getElementsByTagName('a');
    const loginSearchText = 'Log in';
    const signupSearchText = 'Sign up';
    const aTagsArray = Array.from(aTags);
    const loginTag = aTagsArray.filter(tag => tag.innerText.includes(loginSearchText));
    const signupTag = aTagsArray.filter(tag => tag.innerText.includes(signupSearchText));
    if (loginTag.length > 0 && signupTag.length > 0) {
      sendResponse({
        isLoggedIn: false
      });
    }
    else {
      sendResponse({
        isLoggedIn: true
      });
    }
  }
});
