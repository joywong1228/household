'use client';

import React, { useState, useEffect, useMemo } from 'react';

type Item = { id: string; name: string; quantity: number; dateAdded: string; collector?: string | null; location: string; spot: string };
type Data = { [location: string]: { [spot: string]: { [collector: string]: Item[] } } };

export default function Home() {
  const [data, setData] = useState<Data>({});
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [currentSpot, setCurrentSpot] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  const [modalData, setModalData] = useState({ 
    name: '', quantity: 1, location: '', spot: '', collector: '', customLocation: '', customSpot: ''
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [expandedCollectors, setExpandedCollectors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 3000);
  };

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const fetchedData = await response.json();
        setData(fetchedData);
        const locs = Object.keys(fetchedData);
        if (locs.length > 0) {
          const firstLoc = currentLocation || locs[0];
          setCurrentLocation(firstLoc);
          const spots = Object.keys(fetchedData[firstLoc] || {});
          if (spots.length > 0) setCurrentSpot(currentSpot || spots[0]);
        }
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { document.documentElement.classList.add('dark'); }, []);

  const saveData = async (newData: Data) => {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    setData(newData);
  };

  const getVisibleItemsForSelection = () => {
    if (searchQuery) return getGlobalSearchResults();
    const currentItems = data[currentLocation]?.[currentSpot] || {};
    return Object.values(currentItems).flat();
  };

  const getGlobalSearchResults = () => {
    const results: Item[] = [];
    Object.keys(data).forEach(loc => {
      Object.keys(data[loc]).forEach(spot => {
        Object.keys(data[loc][spot]).forEach(col => {
          data[loc][spot][col].forEach(item => {
            const match = 
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.collector && item.collector.toLowerCase().includes(searchQuery.toLowerCase())) ||
              loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
              spot.toLowerCase().includes(searchQuery.toLowerCase());
            if (match) results.push({ ...item, location: loc, spot: spot });
          });
        });
      });
    });
    return results;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const items = getVisibleItemsForSelection();
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const toggleCollector = (collectorName: string) => {
    setExpandedCollectors(prev => {
      const next = new Set(prev);
      if (next.has(collectorName)) next.delete(collectorName);
      else next.add(collectorName);
      return next;
    });
  };

  const openModal = (item: Item | null = null) => {
    if (item) {
      setEditingItem(item);
      setModalData({ 
        name: item.name, quantity: item.quantity, 
        location: item.location, spot: item.spot, 
        collector: item.collector || '', customLocation: '', customSpot: ''
      });
    } else {
      const targetLoc = currentLocation || (Object.keys(data)[0] || '');
      const availableSpots = data[targetLoc] ? Object.keys(data[targetLoc]) : [];
      const targetSpot = currentSpot !== undefined && availableSpots.includes(currentSpot) 
        ? currentSpot 
        : (availableSpots.length > 0 ? availableSpots[0] : 'NEW_SPOT');

      setEditingItem(null);
      setModalData({ 
        name: '', quantity: 1, location: targetLoc, spot: targetSpot, 
        collector: '', customLocation: '', customSpot: ''
      });
    }
    setShowModal(true);
  };

  const saveItem = () => {
    const newData = { ...data };
    const finalLocation = modalData.location === 'NEW_LOC' ? modalData.customLocation : modalData.location;
    const finalSpot = modalData.spot === 'NEW_SPOT' ? modalData.customSpot : modalData.spot;

    if (!finalLocation?.trim() || !finalSpot?.trim()) {
      showToast("Location and Spot required");
      return;
    }

    if (editingItem) {
      Object.keys(newData).forEach(l => {
        Object.keys(newData[l]).forEach(s => {
          Object.keys(newData[l][s]).forEach(c => {
            newData[l][s][c] = newData[l][s][c].filter(i => i.id !== editingItem.id);
          });
        });
      });
    }

    const item: Item = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: modalData.name,
      quantity: modalData.quantity,
      dateAdded: editingItem ? editingItem.dateAdded : new Date().toISOString(),
      collector: modalData.collector.trim() || null,
      location: finalLocation,
      spot: finalSpot
    };

    const targetCol = item.collector || 'none';
    if (!newData[finalLocation]) newData[finalLocation] = {};
    if (!newData[finalLocation][finalSpot]) newData[finalLocation][finalSpot] = {};
    if (!newData[finalLocation][finalSpot][targetCol]) newData[finalLocation][finalSpot][targetCol] = [];
    newData[finalLocation][finalSpot][targetCol].push(item);

    saveData(newData);
    setShowModal(false);
    showToast(editingItem ? 'Item updated' : 'Item added');
  };

  const deleteItem = (item: Item) => {
    const newData = { ...data };
    Object.keys(newData).forEach(l => {
      Object.keys(newData[l]).forEach(s => {
        Object.keys(newData[l][s]).forEach(c => {
          newData[l][s][c] = newData[l][s][c].filter(i => i.id !== item.id);
        });
      });
    });
    saveData(newData);
    showToast('Item removed');
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    const newData = { ...data };
    Object.keys(newData).forEach(l => {
      Object.keys(newData[l]).forEach(s => {
        Object.keys(newData[l][s]).forEach(c => {
          newData[l][s][c] = newData[l][s][c].filter(i => !selectedIds.has(i.id));
        });
      });
    });
    saveData(newData);
    setSelectedIds(new Set());
    showToast(`${selectedIds.size} items removed`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const locations = Object.keys(data);
  const spots = currentLocation ? Object.keys(data[currentLocation] || {}) : [];
  const isSearching = searchQuery.length > 0;
  const globalResults = isSearching ? getGlobalSearchResults() : [];
  const spotData = (currentLocation && data[currentLocation]) ? data[currentLocation][currentSpot] || {} : {};
  const collectorKeys = Object.keys(spotData).sort((a,b) => a === 'none' ? -1 : a.localeCompare(b));

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 text-gray-100 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 relative">
          <input 
            type="text" 
            placeholder="🔍 Search all items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-6 py-4 text-lg shadow-2xl focus:border-blue-500 outline-none transition-all"
          />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xl">✕</button>}
        </div>

        <h1 className="text-4xl font-bold text-center mb-10 text-blue-400 tracking-tight">📦 Inventory Management 🏪</h1>

        {!isSearching && (
          <>
            <nav className="flex p-2 rounded-t-lg overflow-x-auto scrollbar-hide mb-2">
              {locations.map(loc => (
                <button key={loc} onClick={() => { setCurrentLocation(loc); const s = Object.keys(data[loc] || {}); setCurrentSpot(s.length > 0 ? s[0] : ''); }}
                  className={`whitespace-nowrap py-2 px-4 rounded-t-lg font-semibold text-sm transition-all mr-1 border-b-0 ${currentLocation === loc ? 'bg-gray-600 text-white shadow-md z-10 scale-105' : 'bg-gray-700 text-gray-400 border-2 border-gray-600 hover:bg-gray-600 hover:text-gray-200'}`}>
                  {loc}
                </button>
              ))}
            </nav>
            <nav className="flex p-2 rounded-t-lg overflow-x-auto scrollbar-hide mb-2">
              {spots.map(spot => (
                <button key={spot} onClick={() => setCurrentSpot(spot)}
                  className={`whitespace-nowrap py-2 px-4 rounded-t-lg font-semibold text-sm shadow-sm transition-all mr-1 border-b-0 ${currentSpot === spot ? 'bg-gray-600 text-white shadow-md z-10 scale-105' : 'bg-gray-700 text-gray-400 border-2 border-gray-600 hover:bg-gray-600 hover:text-gray-200'}`}>
                  {spot === '' ? 'Loose Item' : spot}
                </button>
              ))}
            </nav>
          </>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700 shadow-inner">
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-lg border border-gray-600">
                <span className="text-xs text-gray-400 uppercase font-bold">Sort</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'date')} className="bg-transparent text-sm focus:outline-none cursor-pointer">
                  <option value="name">Name</option>
                  <option value="date">Date</option>
                </select>
            </div>
            <button onClick={toggleSelectAll} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm rounded-lg border border-gray-600 transition-all font-medium">Select All</button>
            <button onClick={deleteSelected} disabled={selectedIds.size === 0} className="px-4 py-1.5 bg-red-900/40 hover:bg-red-800 text-red-200 text-sm rounded-lg border border-red-700 transition-all font-medium disabled:opacity-20 disabled:cursor-not-allowed">Delete Selected ({selectedIds.size})</button>
          </div>
          <button onClick={() => openModal()} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">➕ Add Item</button>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="bg-gray-700/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left w-12">
                       <input type="checkbox" checked={getVisibleItemsForSelection().length > 0 && selectedIds.size === getVisibleItemsForSelection().length} onChange={toggleSelectAll} className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest w-24">Qty</th>
                    {isSearching && <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Location / Spot</th>}
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest w-40">Date Added</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {!isSearching ? (
                    collectorKeys.map(colKey => {
                      const items = [...(spotData[colKey] || [])].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
                      const isExpanded = expandedCollectors.has(colKey) || colKey === 'none';
                      return (
                        <React.Fragment key={colKey}>
                          {colKey !== 'none' && (
                            <tr className="bg-gray-900/30 cursor-pointer hover:bg-gray-900/50 transition-colors" onClick={() => toggleCollector(colKey)}>
                              <td colSpan={5} className="px-6 py-3 font-bold text-blue-300 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>▼</span>
                                    <span className="opacity-50 font-medium">Collector:</span> {colKey} 
                                    <span className="bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded-full text-xs ml-2 border border-blue-700">{items.length} items</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          {isExpanded && items.map(item => (
                            <tr key={item.id} className={`${selectedIds.has(item.id) ? 'bg-blue-900/20' : 'hover:bg-gray-750/50'} transition-all`}>
                              <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 cursor-pointer" /></td>
                              <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                              <td className="px-6 py-4 text-sm"><span className="bg-gray-700 px-2 py-1 rounded border border-gray-600 font-mono text-xs">{item.quantity}</span></td>
                              <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs uppercase">{formatDate(item.dateAdded)}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => openModal(item)} className="px-3 py-1 bg-blue-900/40 hover:bg-blue-800 text-blue-200 text-xs rounded-lg border border-blue-700 transition-all font-bold uppercase tracking-wider">Edit</button>
                                  <button onClick={() => deleteItem(item)} className="px-3 py-1 bg-gray-700 hover:bg-red-900/60 text-gray-300 hover:text-red-200 text-xs rounded-lg border border-gray-600 hover:border-red-700 transition-all font-bold uppercase tracking-wider">Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    globalResults.map(item => (
                      <tr key={item.id} className={`${selectedIds.has(item.id) ? 'bg-blue-900/20' : 'hover:bg-gray-750/50'} transition-all`}>
                        <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 cursor-pointer" /></td>
                        <td className="px-6 py-4 text-sm font-bold">{item.name}<span className="text-[10px] text-blue-400/70 block mt-1 uppercase tracking-tighter">{item.collector ? `Inside: ${item.collector}` : 'Loose Item'}</span></td>
                        <td className="px-6 py-4 text-sm font-mono">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm"><span className="text-blue-200 bg-blue-900/30 px-2 py-1 rounded text-[10px] font-bold uppercase border border-blue-800">{item.location} / {item.spot === '' ? 'Loose' : item.spot}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs uppercase">{formatDate(item.dateAdded)}</td>
                        <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => openModal(item)} className="px-3 py-1 bg-blue-900/40 hover:bg-blue-800 text-blue-200 text-xs rounded-lg border border-blue-700 transition-all font-bold uppercase tracking-wider">Edit</button>
                                <button onClick={() => deleteItem(item)} className="px-3 py-1 bg-gray-700 hover:bg-red-900/60 text-gray-300 hover:text-red-200 text-xs rounded-lg border border-gray-600 hover:border-red-700 transition-all font-bold uppercase tracking-wider">Delete</button>
                            </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
               onClick={() => setShowModal(false)}>
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 transform transition-all scale-100" 
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h2 className="text-2xl font-black text-gray-100 uppercase tracking-tight">{editingItem ? 'Edit Item' : 'New Item'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="space-y-5">
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Item Identity</label>
                    <input type="text" placeholder="Name..." value={modalData.name} onChange={(e) => setModalData({ ...modalData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900/50 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Amount</label>
                        <input type="number" value={modalData.quantity} onChange={(e) => setModalData({ ...modalData, quantity: Number(e.target.value) })} className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900/50 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Storage Container</label>
                        <input type="text" placeholder="Box, Bag..." value={modalData.collector} onChange={(e) => setModalData({ ...modalData, collector: e.target.value })} className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900/50 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Main Location</label>
                        <select 
                          value={modalData.location} 
                          onChange={(e) => {
                            const nextLoc = e.target.value;
                            const nextSpots = data[nextLoc] ? Object.keys(data[nextLoc]) : [];
                            const nextSpot = nextSpots.length > 0 ? nextSpots[0] : 'NEW_SPOT';
                            setModalData({ ...modalData, location: nextLoc, spot: nextSpot });
                          }} 
                          className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900/50 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                          <option value="NEW_LOC">+ Add New Location</option>
                        </select>
                        {modalData.location === 'NEW_LOC' && <input type="text" placeholder="Type new loc..." value={modalData.customLocation} onChange={(e) => setModalData({ ...modalData, customLocation: e.target.value })} className="mt-2 w-full px-4 py-2 border border-blue-500 rounded-lg bg-gray-900 text-gray-100 outline-none" />}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Specific Spot</label>
                        <select 
                          value={modalData.spot} 
                          onChange={(e) => setModalData({ ...modalData, spot: e.target.value })} 
                          className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900/50 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          {modalData.location && data[modalData.location] && Object.keys(data[modalData.location]).map(s => (
                            <option key={s} value={s}>{s === '' ? 'Loose / No Spot' : s}</option>
                          ))}
                          <option value="NEW_SPOT">+ Add New Spot</option>
                        </select>
                        {modalData.spot === 'NEW_SPOT' && <input type="text" placeholder="Type new spot..." value={modalData.customSpot} onChange={(e) => setModalData({ ...modalData, customSpot: e.target.value })} className="mt-2 w-full px-4 py-2 border border-blue-500 rounded-lg bg-gray-900 text-gray-100 outline-none" />}
                    </div>
                </div>
              </div>
              <div className="flex justify-end mt-10 gap-3">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 text-gray-500 font-bold hover:text-white transition-colors">Discard</button>
                <button onClick={saveItem} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Commit</button>
              </div>
            </div>
          </div>
        )}

        {toastVisible && toastMessage && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl shadow-2xl font-black uppercase border-2 border-blue-400">
              {toastMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}