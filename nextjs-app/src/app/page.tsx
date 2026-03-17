'use client';

import { useState, useEffect } from 'react';

type Item = { id: string; name: string; quantity: number; dateAdded: string };
type Data = { [location: string]: { [spot: string]: Item[] } };

export default function Home() {
  const [data, setData] = useState<Data>({});
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [currentSpot, setCurrentSpot] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [modalData, setModalData] = useState({ name: '', quantity: 0, location: '', spot: '' });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const fetchedData = await response.json();
          setData(fetchedData);
          const locs = Object.keys(fetchedData);
          if (locs.length > 0) {
            setCurrentLocation(locs[0]);
            const spots = Object.keys(fetchedData[locs[0]] || {});
            if (spots.length > 0) {
              setCurrentSpot(spots[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const saveData = async (newData: Data) => {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    setData(newData);
  };

  const locations = Object.keys(data);
  const spots = currentLocation ? Object.keys(data[currentLocation] || {}) : [];
  const items = currentSpot && data[currentLocation]?.[currentSpot] ? [...data[currentLocation][currentSpot]] : [];
  items.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
  });

  const openModal = (item: Item | null = null) => {
    if (item) {
      setEditingItem(item);
      setModalData({ name: item.name, quantity: item.quantity, location: currentLocation, spot: currentSpot });
    } else {
      setEditingItem(null);
      setModalData({ name: '', quantity: 0, location: currentLocation, spot: currentSpot });
    }
    setShowModal(true);
  };

  const saveItem = () => {
    const newData = { ...data };
    const item: Item = editingItem ? { ...editingItem, ...modalData } : {
      id: Date.now().toString(),
      name: modalData.name,
      quantity: modalData.quantity,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    // Remove from old location/spot if editing
    if (editingItem) {
      const oldLoc = data[currentLocation];
      if (oldLoc && oldLoc[currentSpot]) {
        oldLoc[currentSpot] = oldLoc[currentSpot].filter(i => i.id !== editingItem.id);
      }
    }

    // Add to new location/spot
    if (!newData[modalData.location]) newData[modalData.location] = {};
    if (!newData[modalData.location][modalData.spot]) newData[modalData.location][modalData.spot] = [];
    newData[modalData.location][modalData.spot].push(item);

    saveData(newData);
    setShowModal(false);
  };

  const deleteItem = (item: Item) => {
    const newData = { ...data };
    if (newData[currentLocation] && newData[currentLocation][currentSpot]) {
      newData[currentLocation][currentSpot] = newData[currentLocation][currentSpot].filter(i => i.id !== item.id);
    }
    saveData(newData);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-blue-400">📦 Inventory Management 🏪</h1>

        {/* Location Tabs */}
        {locations.length > 0 && (
          <div className="mb-2">
            <nav className="flex p-2 rounded-t-lg">
              {locations.map(loc => (
                <button
                  key={loc}
                  onClick={() => {
                    setCurrentLocation(loc);
                    const newSpots = Object.keys(data[loc] || {});
                    setCurrentSpot(newSpots.length > 0 ? newSpots[0] : '');
                  }}
                  className={`whitespace-nowrap py-2 px-4 rounded-t-lg font-semibold text-sm shadow-sm transition-colors ${
                    currentLocation === loc
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Spot Tabs */}
        {spots.length > 0 && (
          <div className="mb-2">
            <nav className="flex p-2 rounded-t-lg">
              {spots.map(spot => (
                <button
                  key={spot}
                  onClick={() => setCurrentSpot(spot)}
                  className={`whitespace-nowrap py-2 px-4 rounded-t-lg font-semibold text-sm shadow-sm transition-colors ${
                    currentSpot === spot
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  {spot}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Sort and Add */}
        {currentSpot && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <label className="mr-2 text-white">Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'date')} className="border border-gray-600 rounded px-2 py-1 bg-gray-700 text-gray-100">
                <option value="name">Name</option>
                <option value="date">Date Added</option>
              </select>
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md transition-colors">➕ Add Item</button>
          </div>
        )}

        {/* Items List */}
        {items.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{item.dateAdded}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => openModal(item)} className="text-blue-400 hover:text-blue-300 mr-4">Modify</button>
                      <button onClick={() => deleteItem(item)} className="text-red-400 hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : currentSpot ? (
          <p className="text-center py-8 text-gray-500">No items in this spot.</p>
        ) : (
          <p className="text-center py-8 text-gray-500">Select a location and spot to view items.</p>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="bg-gray-800 p-6 rounded-lg w-96" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4 text-gray-100">{editingItem ? 'Modify Item' : 'Add Item'}</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={modalData.name}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={modalData.quantity}
                  onChange={(e) => setModalData({ ...modalData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100"
                />
                <select
                  value={modalData.location}
                  onChange={(e) => setModalData({ ...modalData, location: e.target.value, spot: Object.keys(data[e.target.value] || {})[0] || '' })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100"
                >
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select
                  value={modalData.spot}
                  onChange={(e) => setModalData({ ...modalData, spot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-100"
                >
                  {Object.keys(data[modalData.location] || {}).map(spot => <option key={spot} value={spot}>{spot}</option>)}
                </select>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowModal(false)} className="mr-4 px-4 py-2 text-gray-400">Cancel</button>
                <button onClick={saveItem} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
