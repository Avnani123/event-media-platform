"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, Heart, Download, Sparkles, Play, SkipForward, SkipBack, MessageSquare, Share2, Settings, UploadCloud, FolderPlus, HelpCircle, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface EventData {
  name: string;
  club_name?: string;
  description?: string;
}

interface MediaAsset {
  id: number;
  title?: string;
  category?: string;
  s3_optimized_url: string; 
  ai_tags: string[];        
  likes_count?: number;
  event?: EventData;
}

export default function GalleryMatrix() {
  const router = useRouter(); 
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);

  // 🚀 NEW STATE: Explicitly tracks an active target album container for file drops
  const [selectedTargetEvent, setSelectedTargetEvent] = useState<string | null>(null);

  // Tracks custom folder configuration parameters before uploading assets
  const [customEventName, setCustomEventName] = useState<string>("");
  const [customClubName, setCustomClubName] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  // 1. GALLERY MEDIA RETRIEVAL PIPELINE
  const fetchGalleryAssets = async (targetQuery: string = "") => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/media/search?query=${encodeURIComponent(targetQuery)}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setItems(data);
          if (data.length > 0) {
            setActiveAsset((prev) => {
              if (prev && data.some((item) => item.id === prev.id)) {
                return data.find((item) => item.id === prev.id) || data[0];
              }
              return data[0];
            });
          } else {
            setActiveAsset(null);
          }
        }
      } else {
        console.error("Database lookup failed with status code:", response.status);
      }
    } catch (err) {
      console.error("Failed to sync matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchGalleryAssets(searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // 📁 INITIALIZE EMPTY ALBUM STORAGE INFRASTRUCTURE
  const handleCreateEmptyFolder = async () => {
    const targetedName = customEventName.trim();
    if (!targetedName) {
      alert("Please provide an Event Name / Directory Title first!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("eventName", targetedName);
      formData.append("clubName", customClubName.trim() || "Active Sandbox Admin");
      formData.append("eventDescription", customDescription.trim() || "Custom Managed Event Storage Container.");
      formData.append("username", "Event Organiser");

      const response = await fetch("http://localhost:5000/api/media/bulk-upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` },
        body: formData
      });

      if (response.ok) {
        alert(`📁 Folder Directory "${targetedName}" successfully initialized!`);
        
        // 🚀 AUTO-LOCK: Set this newly created folder name as the active target container upload node
        setSelectedTargetEvent(targetedName);
        
        setCustomEventName("");
        setCustomClubName("");
        setCustomDescription("");
        
        await fetchGalleryAssets("");
      } else {
        const errData = await response.json();
        alert(`Failed to initialize directory: ${errData.error || 'Server Processing Dropped'}`);
      }
    } catch (err) {
      console.error("Folder generation network interruption:", err);
      alert("Could not reach backend cloud storage upload router.");
    } finally {
      setLoading(false);
    }
  };

  // 2. MULTI-PART STREAMING MULTI-FILE BULK INGESTION HANDLER
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const formData = new FormData();
    
    // 🚀 FIXED RESOLUTION STREAM PIPELINE:
    // Priority 1: Use an explicitly highlighted/selected empty container frame context string
    // Priority 2: Read current real-time text input state string
    // Priority 3: Fall back to standard default sandbox directory path "General_Pool"
    let targetUploadFolder = "General_Pool";
    if (selectedTargetEvent) {
      targetUploadFolder = selectedTargetEvent;
    } else if (customEventName.trim()) {
      targetUploadFolder = customEventName.trim();
    }
    
    formData.append("eventName", targetUploadFolder);
    formData.append("clubName", customClubName.trim() || "Active Sandbox Admin");
    formData.append("eventDescription", customDescription.trim() || "Custom Managed Event Storage Container.");
    formData.append("username", "Event Organiser");

    for (let i = 0; i < uploadedFiles.length; i++) {
      formData.append("photos", uploadedFiles[i]);
    }

    setUploading(true);
    setLoading(true); 
    
    try {
      const response = await fetch("http://localhost:5000/api/media/bulk-upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` },
        body: formData 
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (response.ok) {
          alert(`🎉 Success! Files compiled inside target branch "${targetUploadFolder}". ${result.count || uploadedFiles.length} assets categorized.`);
          
          setSearchQuery(""); 
          setCustomEventName("");
          setCustomClubName("");
          setCustomDescription("");
          setSelectedTargetEvent(null); // Clear folder lock target frame cleanly

          if (result.catalog && Array.isArray(result.catalog)) {
            setItems(result.catalog);
            if (result.catalog.length > 0) {
              setActiveAsset(result.catalog[0]); 
            }
          } else {
            await fetchGalleryAssets(""); 
          }
        } else {
          alert(`Ingestion Pipeline Failure: ${result.error || 'Server error'}`);
        }
      } else {
        console.error("Server returned non-JSON payload output format.");
        alert("⚠️ Backend did not return a valid configuration catalog array.");
      }
    } catch (err) {
      console.error("Network connectivity drop:", err);
      alert("Could not reach backend upload streams on local proxy cluster.");
    } finally {
      setUploading(false);
      setLoading(false); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const handleLikeToggle = async (mediaId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/media/${mediaId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      const res = await response.json();
      alert(res.message || "Interaction registry updated!");
      await fetchGalleryAssets(searchQuery);
    } catch (err) {
      alert("Like registration operation context drop.");
    }
  };

  const triggerWatermarkedDownload = async (mediaId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/media/${mediaId}/download`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      const res = await response.json();
      alert(`🔒 SECURE DOWNLOAD PACKET\n\nWatermark Stamp: ${res.watermarkText || 'Verified Platform Asset'}\n\nAsset Path: ${res.originalAsset || 'Local S3 Target Node Link'}`);
    } catch (err) {
      alert("Watermarking compilation script runtime crash.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c16] text-white p-8 pb-32 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent">
              Centralized Media Catalog
            </h1>
            <p className="text-gray-400 text-sm mt-1">Cross-referenced indexing architecture powered by automated computer vision tagging.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search tags, categories, clubs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* 📁 INITIALIZE CUSTOM EVENT DIRECTORY */}
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <FolderPlus className="h-5 w-5" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">1. Initialize Custom Event Directory (Optional)</h2>
            </div>
            
            <button
              type="button"
              onClick={handleCreateEmptyFolder}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md flex items-center gap-1.5 shrink-0"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Create Empty Album</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Event Name / Directory Title</label>
              <input 
                type="text"
                placeholder="e.g., Mock_IPL_2026 or FishTank_Finals"
                value={customEventName}
                onChange={(e) => setCustomEventName(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Hosting Club / Core Committee</label>
              <input 
                type="text"
                placeholder="e.g., Coding Club Core"
                value={customClubName}
                onChange={(e) => setCustomClubName(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Brief Description & Metadata Context</label>
              <input 
                type="text"
                placeholder="e.g., Leaderboard slides and award distribution certificates."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="mt-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-indigo-300 leading-relaxed">
              <strong>Architecture Tip:</strong> If you leave these fields empty, photos auto-allocate directly to the standard <code>General_Pool/</code> storage path. If filled, your images are neatly grouped inside <code>uploads/[Your_Event]/[AI_Category]/</code> while fully preserving computer vision tagging!
            </p>
          </div>
        </div>

        {/* AI Action Panel */}
        <div className="bg-gradient-to-r from-[#1e1e38] to-[#13132b] p-5 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border border-indigo-500/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
            <div>
              <div className="font-semibold text-sm text-indigo-200">
                {selectedTargetEvent ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Targeting: "{selectedTargetEvent}" Workspace
                  </span>
                ) : (
                  "Production Batch Ingestion Active"
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {selectedTargetEvent ? "Photos uploaded right now will stream directly into this album's specific subdirectory block context." : "Select and stream massive asset volumes simultaneously straight to your indexing bucket arrays."}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {selectedTargetEvent && (
              <button 
                onClick={() => setSelectedTargetEvent(null)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 underline transition-colors"
              >
                Clear Target Selection
              </button>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleBulkUpload} 
              accept="image/*" 
              multiple
              className="hidden" 
            />
            
            <button 
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
              className={`flex items-center gap-2 bg-gray-800 text-gray-200 px-4 py-2 rounded-xl text-xs font-bold border border-white/5 transition-all shadow-md ${
                uploading ? 'opacity-50 cursor-not-allowed animate-pulse' : 'hover:bg-gray-700 active:scale-95'
              }`}
            >
              <UploadCloud className="h-4 w-4 text-indigo-400" />
              <span>{uploading ? "Streaming Batch..." : "2. Bulk Upload Photos"}</span>
            </button>

            <button 
              onClick={() => router.push('/biometrics')}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 px-5 py-2 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg whitespace-nowrap"
            >
              Execute Facial Recognition Scan
            </button>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        {loading ? (
          <div className="text-center py-24 text-gray-500 font-medium tracking-wide animate-pulse">Querying central relational database...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
            No media indexed matches this structural tag filter string.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const isLocalPlaceholder = item.s3_optimized_url === "placeholder" || !item.s3_optimized_url;
              const currentEventName = item.event?.name || "General Pool Target";
              const isTargetedForUpload = selectedTargetEvent === currentEventName;

              return (
                <div 
                  key={item.id} 
                  onClick={() => {
                    setActiveAsset(item);
                    // 🚀 INTERACTIVE LOCK: Clicking an unpopulated album updates target upload routing path context strings!
                    if (isLocalPlaceholder) {
                      setSelectedTargetEvent(currentEventName);
                    }
                  }}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1c1c35] to-[#121227] border p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    isTargetedForUpload ? 'ring-2 ring-emerald-500 border-transparent' : activeAsset?.id === item.id ? 'border-indigo-500 bg-[#15152e]' : 'border-white/5 hover:border-indigo-500/20'
                  }`}
                >
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-950 mb-4 w-full h-[180px] min-h-[180px] flex items-center justify-center text-center">
                    {isLocalPlaceholder ? (
                      <div className="w-full h-full bg-slate-900/40 flex flex-col items-center justify-center text-indigo-400 border border-dashed border-slate-800 p-4">
                        <ImageIcon className="w-10 h-10 mb-1 text-slate-600 animate-pulse" />
                        <span className="text-[11px] font-bold tracking-wider text-indigo-400/90 uppercase">Empty Workspace Target</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Click here to lock this card for uploads</span>
                      </div>
                    ) : (
                      <img 
                        src={item.s3_optimized_url} 
                        alt={item.title || "Catalog Asset"} 
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500" 
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c16]/90 via-transparent to-transparent opacity-60"></div>
                    <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-indigo-400 font-semibold border border-white/5">
                      {currentEventName}
                    </span>
                    
                    {isTargetedForUpload && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-gray-950 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md animate-bounce">
                        Target Linked
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      {item.category || "Media Asset"}
                    </span>
                    <h3 className="text-white font-semibold text-base tracking-tight truncate group-hover:text-indigo-200 transition-colors">
                      {item.title || `Asset Reference Cluster #${item.id}`}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLikeToggle(item.id); }} 
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors bg-white/5 px-2.5 py-1.5 rounded-lg"
                    >
                      <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> 
                      <span>{item.likes_count ?? 0}</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerWatermarkedDownload(item.id); }}
                      className="p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors border border-white/5"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {Array.isArray(item.ai_tags) && item.ai_tags.length > 0 ? (
                      item.ai_tags.map((tag, idx) => (
                        <span key={idx} className="bg-indigo-500/5 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md border border-indigo-500/10">
                          #{tag.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="bg-gray-800/40 text-gray-500 text-[10px] px-2 py-0.5 rounded-md border border-gray-800/50">#workspace-init</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Bottom Media Dock Controls */}
      {activeAsset && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121229]/95 backdrop-blur-xl border-t border-indigo-500/20 px-6 py-4 flex items-center justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
            {activeAsset.s3_optimized_url === "placeholder" || !activeAsset.s3_optimized_url ? (
              <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-slate-600">
                <ImageIcon className="w-5 h-5" />
              </div>
            ) : (
              <img 
                src={activeAsset.s3_optimized_url} 
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-xl object-cover border border-white/10" 
              />
            )}
            <div className="truncate">
              <h4 className="text-white text-sm font-semibold truncate">
                {activeAsset.title || `Asset Reference Cluster #${activeAsset.id}`}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {activeAsset.event?.club_name || "Coding Club Core"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 max-w-md w-full px-6">
            <div className="flex items-center gap-6 text-gray-400">
              <button className="hover:text-white transition-colors"><SkipBack className="h-4 w-4" /></button>
              <button className="w-10 h-10 rounded-full bg-white text-gray-950 flex items-center justify-center hover:scale-105 transition-all">
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </button>
              <button className="hover:text-white transition-colors"><SkipForward className="h-4 w-4" /></button>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full relative overflow-hidden cursor-pointer group">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-2/5 rounded-full"></div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-400 text-sm w-1/4 justify-end">
            <button className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs bg-white/5 px-3 py-2 rounded-xl">
              <MessageSquare className="h-3.5 w-3.5" /> <span>Comment</span>
            </button>
            <button className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs bg-white/5 px-3 py-2 rounded-xl">
              <Share2 className="h-3.5 w-3.5" /> <span>Share</span>
            </button>
            <button className="hover:text-white transition-colors p-1"><Settings className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}