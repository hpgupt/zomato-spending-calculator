import React, { useEffect, useState } from "react";

export const Options = () => {
  const [dateOption, setDateOption] = useState<string>();
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    // Restores select box and checkbox state using the preferences
    // stored in chrome.storage.
    chrome.storage.sync.get(
      {
        dateOption: "For All Time",
        monthLimit: 0,
      },
      (items) => {
        setDateOption(items.dateOption);
      }
    );
  }, []);

  const saveOptions = () => {
    // Saves options to chrome.storage.sync.
    chrome.storage.sync.set(
      {
        dateOption: dateOption
      },
      () => {
        // Update status to let user know options were saved.
        setStatus("Options saved. Open extension again to see changes.");
        const id = setTimeout(() => {
          setStatus("");
          window.close();
        }, 2000);
        return () => clearTimeout(id);
      }
    );
  };

  return (
    <>
      <div className="option-body">
        <div className="date-option">
          Calculate Spending For: <select
            value={dateOption}
            onChange={(event) => setDateOption(event.target.value)}
          >
            <option value="For All Time">For All Time</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
        <div className="option-status">{status}</div>
        <button onChange={saveOptions} className="save-option">Save Options</button>
      </div>
    </>
  );
};

