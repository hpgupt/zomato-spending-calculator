import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { makeApiCalls } from "./api";

const Popup = () => {
  const [currentURL, setCurrentURL] = useState<string>();
  const [isZomatoHomeOpen, setIsZomatoHomeOpen] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentURL(tabs[0].url);
    });
  }, []);

  useEffect(() => {
    if (currentURL) {
      const url = new URL(currentURL);
      if (url.hostname === "www.zomato.com") {
        if (url.pathname === "/") {
          setIsZomatoHomeOpen(true);
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab.id) {
              chrome.tabs.sendMessage(currentTab.id, { type: "getAuthStatus" }, (response) => {
                setIsSignedIn(response.isLoggedIn);
              });
              getCookies();
            }

          });
        }
      }
    }

  }, [currentURL]);

  const getCookies = () => {
    chrome.cookies.getAll({ url: "https://www.zomato.com" }, async (cookies) => {
      setIsLoading(true);
      const results = await makeApiCalls(cookies);
      setTotalCost(results.reduce((acc: number, curr: number) => acc + curr, 0));
      setIsLoading(false);
    });
  }

  return (
    <>
      <p>Current URL : {currentURL}</p>
      {isZomatoHomeOpen ? (isSignedIn ? (<div>
        <h1>Zomato Home is open</h1>
        <p> SignedIn</p>
        <p>Total Amount Spent : {isLoading ? "Loading...." : totalCost}</p>
      </div>) : (
        <div>
          <h1>Zomato Home is open</h1>
          <p>Not signed in</p>
        </div>)
      ) : (
        <div>
          <h1>Zomato Home is not open</h1>
          <p> Open www.zomato.com on your browser, then use this extension</p>
        </div>
      )}
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
