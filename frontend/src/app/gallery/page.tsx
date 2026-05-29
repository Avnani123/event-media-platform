"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, Download, Sparkles, Play, SkipForward, SkipBack, MessageSquare, Share2, Settings, UploadCloud } from 'lucide-react';

interface EventData {
  name: string;
  club_name?: string;
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  // 1. CLEAR SEARCH COMPONENT PIPELINE
  const fetchGalleryAssets = async (query: string = "") => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/media/search?query=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setItems(data);
          if (data.length > 0 && !activeAsset) {
            setActiveAsset(data[0]);
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

  // 2. BULK STREAM UPLOAD MANAGEMENT WITH INLINE STATE HYDRATION
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const formData = new FormData();
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
          alert(`🎉 Success! ${result.count || uploadedFiles.length} assets uploaded and indexed.`);
          
          setSearchQuery(""); 
          
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
        const fallbackText = await response.text();
        console.error("Server output plain text payload:", fallbackText);
        alert("⚠️ Backend didn't return JSON. Ensure your server handler passes back the live catalog array.");
      }
    } catch (err) {
      console.error("Network connectivity drop:", err);
      alert("Could not reach backend upload stream. Verify your Express server is listening on port 5000.");
    } finally {
      setUploading(false);
      setLoading(false); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  // 3. INTERACTIONS AND ENGAGEMENT 
  const handleLikeToggle = async (mediaId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/media/${mediaId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      const res = await response.json();
      alert(res.message || "Interaction pipeline processed!");
      fetchGalleryAssets(searchQuery);
    } catch (err) {
      alert("Like registration failure");
    }
  };

  const triggerWatermarkedDownload = async (mediaId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/media/${mediaId}/download`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      const res = await response.json();
      alert(`🔒 SECURE DOWNLOAD PACKET\n\nWatermark Stamp: ${res.watermarkText}\n\nAsset Path: ${res.originalAsset}`);
    } catch (err) {
      alert("Watermarking pipeline error");
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

        {/* AI Action Panel */}
        <div className="bg-gradient-to-r from-[#1e1e38] to-[#13132b] p-5 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border border-indigo-500/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
            <div>
              <div className="font-semibold text-sm text-indigo-200">Production Batch Ingestion Active</div>
              <div className="text-xs text-gray-400 mt-0.5">Select and stream massive asset volumes simultaneously straight to your indexing bucket arrays.</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
              <span>{uploading ? "Streaming Batch..." : "Bulk Upload Photos"}</span>
            </button>

            <button 
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch("http://localhost:5000/api/media/ai/discovery", {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${dummyJwt}` }
                  });
                  const res = await response.json();
                  if (res.error) {
                    alert(res.error);
                  } else if (Array.isArray(res)) {
                    setItems(res);
                    if (res.length > 0) setActiveAsset(res[0]); 
                  }
                } catch (err) {
                  console.error("AI scanning execution error:", err);
                } finally {
                  setLoading(false);
                }
              }}
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
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setActiveAsset(item)}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1c1c35] to-[#121227] border p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  activeAsset?.id === item.id ? 'border-indigo-500 bg-[#15152e]' : 'border-white/5 hover:border-indigo-500/20'
                }`}
              >
                {/* Fixed Image Container Bounds */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-950 mb-4 w-full h-[180px] min-h-[180px]">
                  {/* ✅ CRITICAL OVERRIDE: CrossOrigin protection and automated query backup fallback handler */}
                  <img 
                    src={item.s3_optimized_url || "/api/placeholder/400/225"} 
                    alt={item.title || "Catalog Asset"} 
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c16]/90 via-transparent to-transparent opacity-60"></div>
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-indigo-400 font-semibold border border-white/5">
                    {item.event?.name || "Nexus Hackathon"}
                  </span>
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
                    <span>{item.likes_count ?? 12}</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); triggerWatermarkedDownload(item.id); }}
                    className="p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors border border-white/5"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Array.isArray(item.ai_tags) ? (
                    item.ai_tags.map((tag, idx) => (
                      <span key={idx} className="bg-indigo-500/5 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md border border-indigo-500/10">
                        #{tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="bg-gray-800 text-gray-500 text-[10px] px-2 py-0.5 rounded-md">#uncategorized</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Bottom Media Dock Controls */}
      {activeAsset && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121229]/95 backdrop-blur-xl border-t border-indigo-500/20 px-6 py-4 flex items-center justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
            {/* ✅ CRITICAL OVERRIDE: Also updated the media dock element tag renderer */}
            <img 
              src={activeAsset.s3_optimized_url} 
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover border border-white/10" 
            />
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