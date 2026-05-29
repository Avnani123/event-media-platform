import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import SelfieRegister from '../components/SelfieRegister';

export default function AlbumViewingWindow() {
  // State definitions replacing static arrays with a live data stream pipeline
  const [photos, setPhotos] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentUserId] = useState(4); // Mock user account credentials
  const [loading, setLoading] = useState(true);

  // Consolidated pipeline filters tracking state matrix
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    sortBy: 'date'
  });

  const categories = ['Fest', 'Competition', 'Workshop', 'Photoshoot', 'Trip'];
  const popularAiTags = ['Main Stage', 'Crowd', 'Presentation', 'Tech', 'Outdoor'];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 1. Establish standard WebSocket connection channel listeners on viewport mount
  useEffect(() => {
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      // Register current user account references within backend mappings
      socketInstance.emit('register_user', currentUserId);
    });

    // Listen for real-time notification streams triggered by incoming actions
    socketInstance.on('receive_notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
      
      // Auto-expire individual system alert messages after 5 seconds tracking window
      setTimeout(() => {
        setNotifications((prev) => prev.filter(item => item.id !== data.id));
      }, 5000);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUserId]);

  // 2. Query data assets from live database endpoints synced to active filters
  useEffect(() => {
    const fetchFilteredGallery = async () => {
      try {
        const queryParams = new URLSearchParams({
          search: filters.search,
          category: filters.category,
          tag: filters.tag,
          sortBy: filters.sortBy,
          eventId: "1" // Default simulation target reference
        }).toString();

        const response = await fetch(`http://localhost:5000/api/media/search?${queryParams}`, {
          headers: { 'Authorization': 'Bearer MOCK_TOKEN' }
        });
        const resData = await response.json();
        if (resData.success) {
          setPhotos(resData.data);
        }
      } catch (err) {
        console.error("Gallery query collection interrupt intercepted:", err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the keyboard inputs by 300ms to protect database resource loops
    const delayDebounceFn = setTimeout(() => {
      fetchFilteredGallery();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const fireInteraction = async (photoId, ownerId, type, commentText = "") => {
    // Instantly update the UI state locally for immediate user feedback
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          likes: type === 'like' ? parseInt(p.likes || 0) + 1 : p.likes,
          comments: type === 'comment' ? [...(p.comments || []), commentText] : p.comments
        };
      }
      return p;
    }));

    // Dispatch the interaction payload down to the backend REST infrastructure API endpoints
    try {
      await fetch('http://localhost:5000/api/media/interact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer MOCK_TOKEN'
        },
        body: JSON.stringify({ mediaId: photoId, type, commentText, ownerId })
      });
    } catch (err) {
      console.error("Interaction delivery failed:", err);
    }
  };

  return (
    <div className="space-y-8 pb-20 relative">
      
      {/* Real-time Toast Notifications Alert System Container */}
      <div className="fixed top-6 right-6 z-50 space-y-3 w-80">
        {notifications.map((note) => (
          <div key={note.id} className="bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 shadow-2xl p-4 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-2 animate-bounce">
            <div>{note.message}</div>
          </div>
        ))}
      </div>

      {/* Grid Header & AI Enrollment Control Panel Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Event Gallery View
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Interact with uploaded media files in real-time, drop comments, or add items to your favorites shelf.
          </p>
        </div>
        <div>
          {/* Mount Face Biometric Component */}
          <SelfieRegister userId={currentUserId} />
        </div>
      </div>

      {/* Embedded High-Performance Advanced Search Control Panel Strip */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Query String Input */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Search Workspace</label>
            <input 
              type="text"
              placeholder="Search by event title or asset name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Category Configuration Dropdown Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Category Pipeline</label>
            <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Dynamic Metric Sorting Execution Strategy */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Sort Execution Matrix</label>
            <select 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="date">Upload Date (Newest)</option>
              <option value="likes">Popularity (Most Liked)</option>
              <option value="name">Asset Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* AI Computer Vision Predictive Tags Selector Strip */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mr-2">AI Smart Tags:</span>
          <button
            onClick={() => handleFilterChange('tag', '')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${!filters.tag ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
          >
            All Tags
          </button>
          {popularAiTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleFilterChange('tag', tag)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${filters.tag === tag ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              🏷️ {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Dashboard Asset Pipeline Layout */}
      {loading ? (
        <div className="text-center py-20 text-xs font-mono text-slate-500 tracking-widest animate-pulse">
          FETCHING ASSETS FROM DATABASE PIPELINES...
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 text-sm italic text-slate-600 border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
          No records matched your selected indexing configuration rules.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {photos.map((photo) => (
            <div key={photo.id} className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              
              {/* Visual Media Box */}
              <div className="h-52 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-center text-6xl relative overflow-hidden">
                {photo.url && (photo.url.startsWith('http') || photo.url.startsWith('/')) ? (
                  <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                ) : (
                  <span>📸</span>
                )}
                <span className="absolute bottom-3 left-3 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-md text-white/70">
                  Asset #{photo.id}
                </span>
              </div>

              {/* Info Layout Row */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 tracking-tight">{photo.title}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5 font-mono">{photo.category}</p>
                </div>
                
                {/* Action Buttons Group */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => fireInteraction(photo.id, photo.ownerId, 'like')}
                    className="px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all"
                  >
                    ❤️ {photo.likes || 0} Likes
                  </button>

                  <button 
                    onClick={async () => {
                      try {
                        window.open(`http://localhost:5000/api/media/download/${photo.id}?token=MOCK_TOKEN`, '_blank');
                      } catch (err) {
                        console.error("Secure asset retrieval connection broken:", err);
                      }
                    }}
                    className="px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-1"
                  >
                    📥 Secure Download
                  </button>
                </div>
              </div>

              {/* Display individual image tags if generated by AI module */}
              {photo.tags && photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {photo.tags.map((t, idx) => (
                    <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Live Commentary Panel */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <h5 className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Live Commentary Loop</h5>
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {!photo.comments || photo.comments.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No community statements posted yet.</p>
                  ) : (
                    photo.comments.map((msg, i) => (
                      <div key={i} className="text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-slate-300">
                        {msg}
                      </div>
                    ))
                  )}
                </div>

                {/* Instant Comment Input Submission Box */}
                <div className="flex gap-2 pt-2">
                  <input 
                    type="text"
                    placeholder="Drop a public note..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        fireInteraction(photo.id, photo.ownerId, 'comment', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 bg-slate-900/60 border border-white/10 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}