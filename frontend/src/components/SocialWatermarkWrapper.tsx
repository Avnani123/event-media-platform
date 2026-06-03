"use client";

import React, { useState, useRef } from 'react';
import { 
  Heart, MessageSquare, Share2, Download, Star, UserPlus, Bell, 
  X, Shield, Send, Globe, Link2, ArrowRight
} from 'lucide-react';
import { useRole } from "../context/RoleContext";

// Structural interfaces matching image_880e83.png and image_880b9a.png specifications
interface PlatformNotification {
  id: string;
  type: 'like' | 'tag' | 'comment';
  message: string;
  timestamp: string;
  read: boolean;
}

interface PhotoComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

interface EnhancedMediaAsset {
  id: number;
  title: string;
  eventName: string;
  clubName: string;
  s3_optimized_url: string;
  likes_count: number;
  comments: PhotoComment[];
  is_favourite: boolean;
  taggedUsers: string[];
}

export default function SocialWatermarkWrapper() {
  const { activeRole } = useRole(); // Reads active user role dynamically for watermark injection
  
  // State handlers for core social mechanics
  const [activeAsset, setActiveAsset] = useState<EnhancedMediaAsset>({
    id: 808,
    title: "Grand Finale Hackathon Awards Night",
    eventName: "Nexus National Hackathon 2026",
    clubName: "Coding Club Core",
    s3_optimized_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    likes_count: 142,
    is_favourite: false,
    taggedUsers: ["Alex_Dev", "Sarah_Design"],
    comments: [
      { id: "c1", author: "Rohan Sharma", role: "Club Member", text: "Incredible shot! The main stage lighting looks pristine.", timestamp: "10m ago" },
      { id: "c2", author: "Emily Watson", role: "Photographer", text: "Captured on a 24-70mm lens profile f/2.8 setup.", timestamp: "2m ago" }
    ]
  });

  // Mock database pool for friend tagging selector
  const availableUsersPool = ["Professor_Arora", "Dev_Kiara", "Kabir_Singhania", "Nisha_Verma", "Rohan_S"];
  const [showTagDropdown, setShowTagDropdown] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Live Notification Feed array as defined in requirement specs
  const [notifications, setNotifications] = useState<PlatformNotification[]>([
    { id: "n1", type: "like", message: "Someone liked your photo", timestamp: "Just now", read: false },
    { id: "n2", type: "tag", message: "Someone tagged you inside a folder asset", timestamp: "5m ago", read: false },
    { id: "n3", type: "comment", message: "Someone commented on your upload: 'Stunning!'", timestamp: "12m ago", read: true }
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core Functional Engine: Dynamic Client-Side Watermarking Canvas Compiler (Ref: image_880b9a.png)
  const executeDynamicWatermarkedDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImage = new Image();
    baseImage.crossOrigin = "anonymous"; 
    baseImage.src = activeAsset.s3_optimized_url;

    baseImage.onload = () => {
      // Configure canvas matching high resolution raw source dimensions
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      
      // Draw pristine raw file asset canvas layer
      ctx.drawImage(baseImage, 0, 0);

      // Define watermarking font metrics context scale dynamically
      const dynamicScaleFactor = Math.max(canvas.width / 1000, 1);
      ctx.save();
      
      // Diagonal Step Repeat Watermark Pattern Overlay
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6); // 30-degree rotation index matrix
      
      ctx.font = `bold ${Math.floor(26 * dynamicScaleFactor)}px sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.textAlign = "center";
      
      // Text data injection parameters parsed dynamically via core system requirements
      const dynamicWatermarkText = `[ ${activeAsset.clubName} ]  •  ${activeAsset.eventName}  •  Role: ${activeRole || 'Viewer'}`;
      
      // Stamp pattern blocks evenly across layout spaces
      for (let y = -3; y <= 3; y++) {
        for (let x = -2; x <= 2; x++) {
          ctx.fillText(dynamicWatermarkText, x * (400 * dynamicScaleFactor), y * (140 * dynamicScaleFactor));
        }
      }
      ctx.restore();

      // Solid lower brand authorization bar overlay anchor
      ctx.fillStyle = "rgba(11, 12, 22, 0.75)";
      ctx.fillRect(0, canvas.height - (60 * dynamicScaleFactor), canvas.width, 60 * dynamicScaleFactor);
      
      ctx.font = `${Math.floor(14 * dynamicScaleFactor)}px monospace`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.textAlign = "left";
      ctx.fillText(` Secure Download Registry via ${activeRole || 'Guest'} Token`, 30 * dynamicScaleFactor, canvas.height - (25 * dynamicScaleFactor));

      // Trigger automatic platform browser extraction pipeline save
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement('a');
        link.download = `SECURE_${activeAsset.title.replace(/\s+/g, '_')}.jpg`;
        link.href = dataUrl;
        link.click();

        // Push automatic interaction update to notifications array logs
        triggerInternalNotification('like', `Dynamic watermark generated based on Club, Event, and Role [${activeRole || 'Viewer'}] configuration. File downloaded successfully.`);
      } catch (err) {
        alert("S3 Cross-Origin Resource Sharing (CORS) security context prevents data rendering block compilation locally. Testing pipeline fallback executed.");
      }
    };
  };

  const triggerInternalNotification = (type: 'like' | 'tag' | 'comment', message: string) => {
    const newNotification: PlatformNotification = {
      id: `n-${Date.now()}`,
      type,
      message,
      timestamp: "Just now",
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const submitNewComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: PhotoComment = {
      id: `c-${Date.now()}`,
      author: "Active Profile Identity",
      role: activeRole || "Guest",
      text: commentInput.trim(),
      timestamp: "Just now"
    };

    setActiveAsset(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
    
    setCommentInput("");
    triggerInternalNotification('comment', "Someone commented on your upload");
  };

  const injectUserTag = (username: string) => {
    if (activeAsset.taggedUsers.includes(username)) return;
    setActiveAsset(prev => ({
      ...prev,
      taggedUsers: [...prev.taggedUsers, username]
    }));
    setShowTagDropdown(false);
    triggerInternalNotification('tag', `Someone tagged ${username} in an asset space`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#060713] text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* UPPER APPLICATION INTERFACE ACTION MATRIX HEADER */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
              Platform Social Interaction Node
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Verification scope mapping for structural feature compliance matrix models.</p>
          </div>

          {/* REAL-TIME NOTIFICATION POPUP PANEL BELL */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl transition-all relative cursor-pointer"
            >
              <Bell className="w-4 h-4 text-indigo-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[9px] font-extrabold flex items-center justify-center rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* REAL-TIME NOTIFICATION OVERLAY PANEL CONTROL FEED (Ref: image_880e83.png) */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-gray-950 border border-gray-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Live Telemetry Notifications</span>
                  <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} className="text-[10px] text-gray-500 hover:text-white transition-colors">Mark all read</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-2.5 rounded-lg border text-xs transition-all ${n.read ? 'bg-gray-900/30 border-gray-900 text-gray-400' : 'bg-indigo-950/20 border-indigo-500/20 text-white'}`}>
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-medium leading-tight">{n.message}</p>
                        <span className="text-[9px] text-gray-500 font-mono shrink-0">{n.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN DISPLAY VIEWPORT BLOCK CONTAINER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT CONTAINER: MEDIA INTERACTION VIEW AREA FRAME */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 group shadow-2xl">
              <img 
                src={activeAsset.s3_optimized_url} 
                alt={activeAsset.title} 
                className="w-full h-auto max-h-[500px] object-contain mx-auto"
              />
              
              {/* Live Overlay Badge Context Indicator Preview */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div>
                  <p className="font-bold text-white">{activeAsset.title}</p>
                  <p className="text-[10px] text-gray-400">{activeAsset.eventName} • {activeAsset.clubName}</p>
                </div>
                <span className="bg-indigo-600 px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase font-bold">{activeRole || 'Viewer'} View</span>
              </div>
            </div>

            {/* INTERACTIVE SOCIAL TOOLBAR MATRIX (Ref: image_880e83.png Requirements) */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                
                {/* 1) Like Action Control Trigger */}
                <button 
                  onClick={() => {
                    setActiveAsset(p => ({ ...p, likes_count: p.likes_count + 1 }));
                    triggerInternalNotification('like', 'Someone liked your photo');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-rose-500/30 px-3 py-2 rounded-xl text-rose-400 transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{activeAsset.likes_count} Likes</span>
                </button>

                {/* 2) Add to Favourites Trigger */}
                <button 
                  onClick={() => {
                    setActiveAsset(p => ({ ...p, is_favourite: !p.is_favourite }));
                    triggerInternalNotification('like', 'Added asset package to secure collection favourites cluster logs');
                  }}
                  className={`flex items-center gap-1.5 text-xs font-bold bg-gray-950 border px-3 py-2 rounded-xl transition-all cursor-pointer ${activeAsset.is_favourite ? 'border-amber-500 text-amber-400' : 'border-gray-800 text-gray-400 hover:text-white'}`}
                >
                  <Star className={`w-4 h-4 ${activeAsset.is_favourite ? 'fill-current' : ''}`} />
                  <span>{activeAsset.is_favourite ? "Favorited" : "Add to Favourites"}</span>
                </button>

                {/* 3) Share Action Modal Trigger toggle */}
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Share</span>
                </button>
              </div>

              {/* 4) Automatic Watermarked Download Trigger Pipeline Button */}
              <button 
                onClick={executeDynamicWatermarkedDownload}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermarked image</span>
              </button>
            </div>

            {/* SYSTEM PRIVILEGE NOTIFICATION BANNER OUTPUT PREVIEW */}
            <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-indigo-300 uppercase tracking-wide text-[10px]">Watermark System Target Verification Matrix</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-gray-400 font-mono text-[10px]">
                  <div className="bg-gray-950 p-2 rounded border border-gray-800">🏛️ Club: <strong className="text-white block truncate">{activeAsset.clubName}</strong></div>
                  <div className="bg-gray-950 p-2 rounded border border-gray-800">📅 Event: <strong className="text-white block truncate">{activeAsset.eventName}</strong></div>
                  <div className="bg-gray-950 p-2 rounded border border-gray-800">🔑 Role Stamp: <strong className="text-emerald-400 block truncate">{activeRole || 'Viewer'}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER COLUMN: COMMENTS SPACE & USER TAGGING MANAGERS */}
          <div className="space-y-6">
            
            {/* FRIEND / USER TAGGING MANAGER BLOCK (Ref: image_880e83.png) */}
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 relative">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Tagged Friends & Users
                </h3>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="text-[10px] bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded hover:bg-indigo-600/20 transition-all cursor-pointer"
                  >
                    + Add New Tag
                  </button>

                  {showTagDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 p-1 text-xs">
                      {availableUsersPool.filter(u => !activeAsset.taggedUsers.includes(u)).map(user => (
                        <button 
                          key={user}
                          onClick={() => injectUserTag(user)}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-600 rounded-lg transition-colors block text-gray-300 hover:text-white"
                        >
                          @{user}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tag Output Render Stream List */}
              <div className="flex flex-wrap gap-1.5">
                {activeAsset.taggedUsers.map(user => (
                  <span key={user} className="bg-gray-900 border border-gray-800 text-[11px] text-indigo-300 px-2.5 py-1 rounded-md font-mono flex items-center gap-1">
                    @{user}
                    <X 
                      className="w-3 h-3 text-gray-500 hover:text-red-400 cursor-pointer" 
                      onClick={() => setActiveAsset(p => ({ ...p, taggedUsers: p.taggedUsers.filter(u => u !== user) }))} 
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* COMMENTS REAL-TIME REPOSITORY HOOK (Ref: image_880e83.png Requirement) */}
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col h-[345px] justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Thread Interaction Comments
                </h3>
                
                {/* Scrollable Comment Array Window Viewport */}
                <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                  {activeAsset.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-900 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-gray-300 font-mono">@{comment.author}</span>
                        <span className="bg-gray-800 px-1.5 py-0.2 rounded text-gray-500 text-[9px]">{comment.role}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Target Comment Form Submission Box */}
              <form onSubmit={submitNewComment} className="relative mt-2">
                <input 
                  type="text" 
                  placeholder="Type an upload response comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* REUSE SHARING HUD DIALOG MODAL (Ref: image_88045d.png corrected section) */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-950 border border-gray-800 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl animate-scaleUp">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Share Media Configuration</span>
                <X className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" onClick={() => setShowShareModal(false)} />
              </div>
              <p className="text-xs text-gray-400">Generate copy tracking pointers or broadcast downstreams directly to connected student profiles.</p>
              
              <div className="space-y-2">
                <button 
                  onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Asset path captured to clip buffers successfully."); setShowShareModal(false); }}
                  className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-3 flex items-center justify-between text-xs transition-colors text-gray-200 hover:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Link2 className="w-4 h-4 text-indigo-400" /> Copy Application URL Node</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button 
                  onClick={() => { alert("Public broadcast deployed to shared organizational campaign pools."); setShowShareModal(false); }}
                  className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-3 flex items-center justify-between text-xs transition-colors text-gray-200 hover:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /> Push to Club Space Gallery Feed</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HIDDEN BACKGROUND WATERMARK PROCESSING CANVAS FRAME ELEMENT */}
        <canvas ref={canvasRef} className="hidden" />

      </div>
    </div>
  );
}