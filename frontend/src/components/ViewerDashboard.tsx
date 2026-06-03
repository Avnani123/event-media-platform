"use client";

import React, { useState } from 'react';
import { Eye, Search, Heart, Download, UserCheck, Sparkles, AlertCircle, Image, HelpCircle } from 'lucide-react';
import { useRole, UserRole } from "../context/RoleContext";

interface PublicAsset {
  id: number;
  title: string;
  eventName: string;
  s3_optimized_url: string;
  ai_tags: string[];
  likes_count: number;
  is_user_tagged?: boolean;
}

export default function ViewerDashboard() {
  const { activeRole } = useRole();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<'all' | 'tagged'>('all');
  const [likedPhotos, setLikedPhotos] = useState<number[]>([]);

  // Local state representing curated public catalog entries
  const [publicPhotos, setPublicPhotos] = useState<PublicAsset[]>([
    {
      id: 201,
      title: "Opening Ceremony Keynote",
      eventName: "Nexus National Hackathon 2026",
      s3_optimized_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
      ai_tags: ["Auditorium", "Crowd", "Keynote", "Tech"],
      likes_count: 24,
      is_user_tagged: true // Emulating that the biometrics scan found this user here
    },
    {
      id: 202,
      title: "Team Hacking Session Desk 12",
      eventName: "Nexus National Hackathon 2026",
      s3_optimized_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60",
      ai_tags: ["Coding", "Workspace", "Lab"],
      likes_count: 12,
      is_user_tagged: false
    },
    {
      id: 203,
      title: "Project Pitching Round 1",
      eventName: "Nexus National Hackathon 2026",
      s3_optimized_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
      ai_tags: ["Presentation", "Judges", "Screens"],
      likes_count: 45,
      is_user_tagged: true
    }
  ]);

  // Secure Downstream Watermarked Retrieval Handler Simulation
  const handleSecureDownload = (photoId: number, title: string) => {
    alert(`🔒 SECURE VIEWER DOWNLOAD INITIATED\n\nAsset ID: ${photoId}\nTitle: ${title}\n\nStatus: Injecting custom user watermark stamp into image meta-layers... Done!`);
  };

  const toggleLocalLike = (photoId: number) => {
    if (likedPhotos.includes(photoId)) {
      setLikedPhotos(prev => prev.filter(id => id !== photoId));
      setPublicPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes_count: p.likes_count - 1 } : p));
    } else {
      setLikedPhotos(prev => [...prev, photoId]);
      setPublicPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  // Filter pipeline logic based on search queries and biometrics matching criteria
  const displayedPhotos = publicPhotos.filter(photo => {
    const matchesSearch = 
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.ai_tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterMode === 'tagged') {
      return matchesSearch && photo.is_user_tagged;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b0c16] text-white p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER BRANDING DESK */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800/60 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
              <Eye className="w-4 h-4" /> Guest Gallery Portal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">Explore Your Memories</h1>
            <p className="text-xs text-gray-400 mt-1">Browse public media distributions or view photos automatically matched to your face profile.</p>
          </div>

          {/* QUICK CONTROLS TOGGLE BAR */}
          <div className="flex items-center gap-3 bg-gray-950 p-1.5 rounded-xl border border-gray-800 text-xs w-full md:w-auto">
            <button 
              onClick={() => setFilterMode('all')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${filterMode === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Image className="w-3.5 h-3.5 inline mr-1.5" /> All Event Photos
            </button>
            <button 
              onClick={() => setFilterMode('tagged')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold transition-all relative cursor-pointer ${filterMode === 'tagged' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <UserCheck className="w-3.5 h-3.5 inline mr-1.5" /> Matched with Me
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            </button>
          </div>
        </div>

        {/* SEARCH FILTER BOX */}
        <div className="relative w-full mb-8">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by event title, photo name, or AI tags (e.g., 'Keynote', 'Coding')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>

        {/* BIOMETRICS INFORMATION NOTICE */}
        {filterMode === 'tagged' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fadeIn">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">AI Face Match Filtering Active</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">The assets below were isolated using high-precision biometric cluster maps verifying your facial characteristics inside public folders.</p>
            </div>
          </div>
        )}

        {/* PHOTO RENDER GRID */}
        {displayedPhotos.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10 px-4">
            <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-400">No images found matching your parameters.</p>
            <p className="text-xs text-gray-500 mt-1">Try resetting your filters or clearing your active search lookup text string.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPhotos.map((photo) => {
              const isLiked = likedPhotos.includes(photo.id);
              
              return (
                <div 
                  key={photo.id}
                  className="group bg-gradient-to-b from-[#121325] to-[#0c0d1b] border border-white/5 hover:border-indigo-500/20 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Photo Node Canvas */}
                  <div className="relative h-56 bg-gray-950 overflow-hidden">
                    <img 
                      src={photo.s3_optimized_url} 
                      alt={photo.title}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Floating Biometric Stamp Tag */}
                    {photo.is_user_tagged && (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 text-[9px] font-extrabold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1 backdrop-blur-sm">
                        <UserCheck className="w-3 h-3 fill-current" /> Found You
                      </span>
                    )}

                    <span className="absolute top-3 right-3 bg-black/60 text-gray-300 text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
                      {photo.eventName}
                    </span>
                  </div>

                  {/* Details Meta Block */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-100 truncate">{photo.title}</h4>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {photo.ai_tags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-gray-900 px-2 py-0.5 text-gray-400 rounded-md border border-gray-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="border-t border-gray-800/60 pt-3 flex items-center justify-between">
                      <button 
                        onClick={() => toggleLocalLike(photo.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                          isLiked ? 'text-rose-400 bg-rose-500/10' : 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/5'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{photo.likes_count}</span>
                      </button>

                      <button 
                        onClick={() => handleSecureDownload(photo.id, photo.title)}
                        className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Securely</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LEGAL COMPLIANCE FOOTER BLOCK */}
        <div className="mt-12 p-4 bg-gray-950/40 border border-gray-800 rounded-xl flex items-center gap-3 text-xs text-gray-500">
          <HelpCircle className="w-4 h-4 text-gray-600 shrink-0" />
          <p>All downloaded materials are automatically signed with standard digital copyright tracking signatures. Misuse or unverified redistribution logs are traceable via cloud platform administrative indices.</p>
        </div>

      </div>
    </div>
  );
}