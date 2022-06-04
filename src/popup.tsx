import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { makeApiCalls } from "./api";
import { Options } from "./options";
import "./popup.scss";
const spinner = require('../public/loading-buffering.gif');

const Popup = () => {
  const [currentURL, setCurrentURL] = useState<string>();
  const [isZomatoHomeOpen, setIsZomatoHomeOpen] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

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
      try {
        const results = await makeApiCalls(cookies);
        setTotalCost(results.reduce((acc: number, curr: number) => acc + curr, 0));
        setIsLoading(false);
        setIsError(false);
      }
      catch (err) {
        setIsLoading(false);
        setIsError(true);
      }
    });
  }

  return (
    <>
      <div className="popup-body">
        <div className="popup-header">
          Zomato Spending Calculator
        </div>
        <div className="option-button">
          <button onClick={() => setIsOptionsOpen(!isOptionsOpen)}>{isOptionsOpen ? "Hide Options" : "Show Options"}</button>
        </div>
        {isOptionsOpen && <Options />}
        {isZomatoHomeOpen ? (isSignedIn ? (<div className="info-body">
          <p className="webpage-info">Zomato Home is open</p>
          <p className="auth-info"> You are currently Signed In to Zomato Website</p>
          {isError && <p className="error">Error while fetching data</p>}
          <p className="amount-info">Total Amount Spent : <b>{isLoading ? <><img src={String(spinner)} alt="loading..." height="20px" width="20px" /> <span>(Fetching Data....)</span> </> : `₹${totalCost}`}</b></p>
        </div>) : (
          <div className="info-body">
            <p className="webpage-info">Zomato Home is open</p>
            <p className="auth-info">You are not signed in , please sign in to Zomato to continue.</p>
          </div>)
        ) : (
          <div className="info-body">
            <p className="webpage-info">Zomato Homepage is not open</p>
            <p className="webpage-redirect">Open <a href="https://www.zomato.com/" target="_blank">www.zomato.com</a> on your browser, then use this extension</p>
          </div>
        )}
      </div>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
