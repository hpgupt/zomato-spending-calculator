import React, { useEffect, useState } from "react";

export const Options = () => {
  const [dateOption, setDateOption] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [monthLimit, setMonthLimit] = useState<number>(0);

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
        setMonthLimit(items.monthLimit);
      }
    );
  }, []);

  const saveOptions = () => {
    // Saves options to chrome.storage.sync.
    chrome.storage.sync.set(
      {
        dateOption: dateOption,
        monthLimit: monthLimit
      },
      () => {
        // Update status to let user know options were saved.
        setStatus("Options saved.");
        const id = setTimeout(() => {
          setStatus("");
        }, 1000);
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
            <option value="Custom Date Range">Custom Date Range</option>
          </select>
        </div>
        <div className="month-limit-option">
          Set Monthly Limit: <input type="number" value={monthLimit} onChange={(event) => setMonthLimit(parseInt(event.target.value))} min="0" />
        </div>
        <div className="option-status">{status}</div>
        <button onClick={saveOptions} className="save-option">Save Options</button>
      </div>
    </>
  );
};

