'use client';

import { useState, useEffect } from 'react';

type Data = { [location: string]: { [tab: string]: number | null } | number | null };

export default function Home() {
  const [data, setData] = useState<Data>({});
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(fetchedData => {
        setData(fetchedData);
        const locations = Object.keys(fetchedData);
        if (locations.length > 0) {
          setCurrentLocation(locations[0]);
          const locData = fetchedData[locations[0]];
          if (typeof locData === 'object' && locData !== null) {
            const tabs = Object.keys(locData);
            if (tabs.length > 0) {
              setCurrentTab(tabs[0]);
            }
          }
        }
      });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const saveData = async (newData: Data) => {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    setData(newData);
  };

  const updateQuantity = (location: string, tab: string | null, quantity: number | null) => {
    const newData = { ...data };
    if (tab === null) {
      newData[location] = quantity;
    } else {
      if (typeof newData[location] !== 'object' || newData[location] === null) {
        newData[location] = {};
      }
      (newData[location] as { [tab: string]: number | null })[tab] = quantity;
    }
    saveData(newData);
  };

  const locations = Object.keys(data);
  const locData = data[currentLocation];
  const hasTabs = typeof locData === 'object' && locData !== null;
  const tabs = hasTabs ? Object.keys(locData as { [tab: string]: number | null }) : [];
  const currentQuantity = hasTabs
    ? (locData as { [tab: string]: number | null })[currentTab] ?? null
    : locData as number | null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 transition-colors duration-300">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inventory Management</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-200"
          >
            {darkMode ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>

        {/* Location Tabs */}
        {locations.length > 0 && (
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {locations.map(loc => (
                  <button
                    key={loc}
                    onClick={() => {
                      setCurrentLocation(loc);
                      const newLocData = data[loc];
                      if (typeof newLocData === 'object' && newLocData !== null) {
                        const newTabs = Object.keys(newLocData);
                        setCurrentTab(newTabs.length > 0 ? newTabs[0] : '');
                      } else {
                        setCurrentTab('');
                      }
                    }}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      currentLocation === loc
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {currentLocation && (
          <div className="space-y-6">
            {/* Sub Tabs if has tabs */}
            {hasTabs && tabs.length > 0 && (
              <div>
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="-mb-px flex space-x-6">
                    {tabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setCurrentTab(tab)}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          currentTab === tab
                            ? 'border-green-500 text-green-600 dark:text-green-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg transition-colors duration-300">
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Quantity for {currentLocation}{hasTabs ? ` - ${currentTab}` : ''}
              </label>
              <input
                type="number"
                value={currentQuantity ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  updateQuantity(currentLocation, hasTabs ? currentTab : null, val);
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg transition-colors duration-200"
                placeholder="Enter quantity (leave empty for null)"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Current quantity: {currentQuantity !== null ? currentQuantity : 'Not set'}
              </p>
            </div>
          </div>
        )}

        {locations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No locations available. Add some data to data.json</p>
          </div>
        )}
      </div>
    </div>
  );
}
