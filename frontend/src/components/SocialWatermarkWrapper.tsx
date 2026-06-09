"use client";

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { 
  Heart, MessageSquare, Share2, Download, Star, UserPlus, Bell, 
  X, Shield, Send, Globe, Link2, ArrowRight, ShieldCheck, Check, Search
} from 'lucide-react';

// Create a local Role Context to guarantee error-free compilation and full standalone execution
interface RoleContextType {
  activeRole: string;
  setActiveRole: (role: string) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<string>("Admin");
  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    return { activeRole: "Admin", setActiveRole: () => {} };
  }
  return context;
}

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

// Updated Tag interface with relative coordinates for absolute rendering over image
interface VisualTag {
  username: string;
  xPercentage: number; // e.g., 35 for 35% from left
  yPercentage: number; // e.g., 50 for 50% from top
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
  taggedUsers: VisualTag[]; 
}

interface SocialWatermarkWrapperProps {
  initialAssetData?: Partial<EnhancedMediaAsset>;
  onCloseRequested?: () => void;
}

export default function SocialWatermarkContent({ 
  initialAssetData, 
  onCloseRequested 
}: SocialWatermarkWrapperProps) {
  const { activeRole, setActiveRole } = useRole(); 
  
  // State for search query input (Fixed unterminated string)
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [activeAsset, setActiveAsset] = useState<EnhancedMediaAsset>({
    id: initialAssetData?.id || 808,
    title: initialAssetData?.title || "Grand Finale Hackathon Awards Night",
    eventName: initialAssetData?.eventName || "Nexus National Hackathon 2026",
    clubName: initialAssetData?.clubName || "Coding Club Core",
    s3_optimized_url: initialAssetData?.s3_optimized_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    likes_count: initialAssetData?.likes_count !== undefined ? initialAssetData.likes_count : 142,
    is_favourite: initialAssetData?.is_favourite || false,
    taggedUsers: initialAssetData?.taggedUsers || [
      { username: "Alex_Dev", xPercentage: 30, yPercentage: 40 },
      { username: "Sarah_Design", xPercentage: 65, yPercentage: 55 }
    ],
    comments: initialAssetData?.comments || [
      { id: "c1", author: "Rohan Sharma", role: "Club Member", text: "Incredible shot! The main stage lighting looks pristine.", timestamp: "10m ago" },
      { id: "c2", author: "Emily Watson", role: "Photographer", text: "Captured on a 24-70mm lens profile f/2.8 setup.", timestamp: "2m ago" }
    ]
  });

  useEffect(() => {
    if (initialAssetData) {
      setActiveAsset({
        id: initialAssetData.id || 808,
        title: initialAssetData.title || "Grand Finale Hackathon Awards Night",
        eventName: initialAssetData.eventName || "Nexus National Hackathon 2026",
        clubName: initialAssetData.clubName || "Coding Club Core",
        s3_optimized_url: initialAssetData.s3_optimized_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
        likes_count: initialAssetData.likes_count !== undefined ? initialAssetData.likes_count : 142,
        is_favourite: initialAssetData.is_favourite || false,
        taggedUsers: initialAssetData.taggedUsers || [
          { username: "Alex_Dev", xPercentage: 30, yPercentage: 40 },
          { username: "Sarah_Design", xPercentage: 65, yPercentage: 55 }
        ],
        comments: initialAssetData.comments || []
      });
    }
  }, [initialAssetData]);

  const availableUsersPool = ["Professor_Arora", "Dev_Kiara", "Kabir_Singhania", "Nisha_Verma", "Rohan_S"];
  const [showTagDropdown, setShowTagDropdown] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showRoleSelector, setShowRoleSelector] = useState<boolean>(false);
  
  const [activeSecureLog, setActiveSecureLog] = useState<{
    watermarkText: string;
    s3Path: string;
    role: string;
  } | null>(null);

  const [notifications, setNotifications] = useState<PlatformNotification[]>([
    { id: "n1", type: "like", message: "Someone liked your photo", timestamp: "Just now", read: false },
    { id: "n2", type: "tag", message: "Someone tagged you inside a folder asset", timestamp: "5m ago", read: false },
    { id: "n3", type: "comment", message: "Someone commented on your upload: 'Stunning!'", timestamp: "12m ago", read: true }
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const triggerInternalNotification = (type: 'like' | 'tag' | 'comment', message: string) => {
    const newNotification: PlatformNotification = {
      id: `n-${Date.now()}`,
      type,
      message,
      timestamp: "Just now",
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
    setShowNotifications(true);
  };

  const executeDynamicWatermarkedDownload = () => {
    const club = activeAsset.clubName;
    const event = activeAsset.eventName;
    const role = activeRole || "Viewer";

    setActiveSecureLog({
      watermarkText: `${club}  •  ${event}  •  Role: ${role}`,
      s3Path: activeAsset.s3_optimized_url,
      role: role
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImage = new Image();
    baseImage.crossOrigin = "anonymous"; 
    baseImage.src = activeAsset.s3_optimized_url;

    baseImage.onload = () => {
      try {
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
        ctx.drawImage(baseImage, 0, 0);

        const dynamicScaleFactor = Math.max(canvas.width / 1000, 1);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        
        ctx.font = `bold ${Math.floor(24 * dynamicScaleFactor)}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.textAlign = "center";
        
        const dynamicWatermarkText = `${club}  •  ${event}  •  Role: ${role}`;
        
        for (let y = -4; y <= 4; y++) {
          for (let x = -3; x <= 3; x++) {
            ctx.fillText(dynamicWatermarkText, x * (450 * dynamicScaleFactor), y * (160 * dynamicScaleFactor));
          }
        }
        ctx.restore();

        ctx.fillStyle = "rgba(11, 12, 22, 0.85)";
        ctx.fillRect(0, canvas.height - (70 * dynamicScaleFactor), canvas.width, 70 * dynamicScaleFactor);
        
        ctx.font = `bold ${Math.floor(16 * dynamicScaleFactor)}px monospace`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.textAlign = "left";
        ctx.fillText(`  🔒 SECURED PORTAL DOWNLOAD  |  ${club}  |  ${event}  |  Role: ${role}`, 20 * dynamicScaleFactor, canvas.height - (30 * dynamicScaleFactor));

        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement('a');
        link.download = `SECURE_${activeAsset.title.replace(/\s+/g, '_')}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        triggerInternalNotification('like', `Watermarked file downloaded: ${activeAsset.title}`);
      } catch (err) {
        const directLink = document.createElement('a');
        directLink.download = `SECURE_${activeAsset.title.replace(/\s+/g, '_')}.jpg`;
        directLink.href = activeAsset.s3_optimized_url;
        directLink.target = "_blank";
        document.body.appendChild(directLink);
        directLink.click();
        document.body.removeChild(directLink);
        
        triggerInternalNotification('like', `Direct file proxy download initiated as fallback.`);
      }
    };

    if (baseImage.complete) {
      baseImage.onload(null as any);
    }
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
    
    triggerInternalNotification('comment', `Someone commented on your upload: "${commentInput.trim()}"`);
    setCommentInput("");
  };

  const injectUserTag = (username: string) => {
    if (activeAsset.taggedUsers.some(t => t.username === username)) return;
    
    const newTag: VisualTag = {
      username,
      xPercentage: Math.floor(Math.random() * 50) + 20, 
      yPercentage: Math.floor(Math.random() * 50) + 20
    };

    setActiveAsset(prev => ({
      ...prev,
      taggedUsers: [...prev.taggedUsers, newTag]
    }));
    setShowTagDropdown(false);
    triggerInternalNotification('tag', `Someone tagged @${username} inside a folder asset workspace node`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#060713] text-white p-4 md:p-6 pb-24 relative">
      <canvas ref={canvasRef} className="hidden" />
      <div className="max-w-6xl mx-auto">
        
        {/* UPPER INTERFACE ACTION MATRIX HEADER */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-indigo-400 bg-clip-text text-transparent">
              Platform Social Interaction Node
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Verification scope mapping for social system operations.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* INTERACTIVE ROLE SELECTOR */}
            <div className="relative">
              <button 
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-500 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-300 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Role: <strong className="text-white">{activeRole}</strong></span>
              </button>

              {showRoleSelector && (
                <div className="absolute right-0 mt-2.5 w-40 bg-gray-950 border border-indigo-500/30 rounded-xl p-1.5 shadow-2xl z-50 space-y-1">
                  {['Admin', 'Photographer', 'Club Member', 'Viewer'].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setActiveRole(role);
                        setShowRoleSelector(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        activeRole === role ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                      }`}
                    >
                      <span>{role}</span>
                      {activeRole === role && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NOTIFICATION POPUP TRIGGER */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl border transition-all relative cursor-pointer ${showNotifications ? 'bg-indigo-950/40 border-indigo-500' : 'bg-gray-900 border-gray-800 hover:bg-gray-800'}`}
              >
                <Bell className="w-4 h-4 text-indigo-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[9px] font-extrabold flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-gray-950 border border-indigo-500/30 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Live Interaction Telemetry Feed
                    </span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} 
                      className="text-[10px] text-gray-500 hover:text-white transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-lg border text-xs transition-all transform ${
                          !n.read ? 'bg-indigo-950/30 border-indigo-500/40 text-white font-medium' : 'bg-gray-900/30 border-gray-900 text-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="leading-snug">{n.message}</p>
                          <span className="text-[9px] text-indigo-400 font-mono shrink-0 bg-indigo-950 px-1 rounded">{n.type}</span>
                        </div>
                        <p className="text-[8px] text-gray-500 font-mono mt-1 text-right">{n.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {onCloseRequested && (
              <button 
                onClick={onCloseRequested}
                className="p-2.5 bg-gray-900 hover:bg-red-950/40 border border-gray-800 hover:border-red-900/50 rounded-xl text-gray-400 hover:text-red-400 transition-all text-xs font-bold px-4 cursor-pointer"
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>

        {/* DYNAMIC SEARCH COMPONENT PILL */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Search tagged users (e.g., Alex_Dev)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-2.5 text-gray-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* MAIN DISPLAY VIEWPORT BLOCK CONTAINER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT PANEL AREA: CENTRAL MEDIA DISPLAY PIPELINE */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* IMAGE WRAPPER */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 group shadow-2xl flex items-center justify-center min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={activeAsset.s3_optimized_url} 
                alt={activeAsset.title} 
                className="w-full h-auto max-h-[500px] object-contain mx-auto block"
              />
              
              {/* DYNAMIC FLOATING IMAGE TAG LAYER */}
              {activeAsset.taggedUsers.map((tag) => {
                const isMatchedBySearch = searchQuery.trim() !== "" && 
                  tag.username.toLowerCase().includes(searchQuery.toLowerCase());

                return (
                  <div
                    key={tag.username}
                    className={`absolute p-1.5 px-2.5 text-[11px] font-mono rounded-lg border transition-all pointer-events-auto backdrop-blur-md shadow-xl ${
                      isMatchedBySearch 
                        ? 'bg-amber-500 border-amber-300 text-black font-extrabold scale-110 ring-4 ring-amber-500/30 z-30' 
                        : 'bg-black/75 border-white/20 text-indigo-300 hover:bg-indigo-950/90 hover:border-indigo-500 z-20'
                    }`}
                    style={{ left: `${tag.xPercentage}%`, top: `${tag.yPercentage}%` }}
                  >
                    @{tag.username}
                  </div>
                );
              })}

              <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur-md border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs z-10">
                <div>
                  <p className="font-bold text-white truncate max-w-[200px] sm:max-w-md">{activeAsset.title}</p>
                  <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{activeAsset.eventName} • {activeAsset.clubName}</p>
                </div>
                <span className="bg-indigo-600 px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase font-bold shrink-0">{activeRole || 'Viewer'} View</span>
              </div>
            </div>

            {/* INTERACTIVE SOCIAL TOOLBAR MATRIX */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                
                {/* LIKE TRIGGER ACTION HOOK */}
                <button 
                  onClick={() => {
                    setActiveAsset(p => ({ ...p, likes_count: p.likes_count + 1 }));
                    triggerInternalNotification('like', `Someone liked your photo! Total counts updated to: ${activeAsset.likes_count + 1}`);
                  }}
                  className="flex items-center gap-2 text-xs font-bold bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-rose-500/40 px-3 py-2 rounded-xl text-rose-400 transition-all cursor-pointer group active:scale-95"
                >
                  <Heart className="w-4 h-4 fill-current transform group-hover:scale-110 transition-transform" />
                  <span>{activeAsset.likes_count} Likes</span>
                </button>

                {/* FAVORITES TOGGLE MATRIX */}
                <button 
                  onClick={() => {
                    const nextState = !activeAsset.is_favourite;
                    setActiveAsset(p => ({ ...p, is_favourite: nextState }));
                    triggerInternalNotification('like', nextState ? "Added asset package to secure system metrics collections" : "Removed asset from profile collection flags");
                  }}
                  className={`flex items-center gap-1.5 text-xs font-bold bg-gray-950 border px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                    activeAsset.is_favourite ? 'border-amber-500 text-amber-400 bg-amber-950/20' : 'border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Star className={`w-4 h-4 ${activeAsset.is_favourite ? 'fill-current' : ''}`} />
                  <span>{activeAsset.is_favourite ? "Favorited" : "Add to Favourites"}</span>
                </button>

                {/* SHARE TRIGGER DETECTOR */}
                <button 
                  onClick={() => {
                    setShowShareModal(true);
                    triggerInternalNotification('tag', "Generated dynamic asset access tokens for secure link sharing.");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Share</span>
                </button>
              </div>

              {/* CANVAS DOWNLOAD EXECUTION TRIGGER */}
              <button 
                onClick={executeDynamicWatermarkedDownload}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermarked image</span>
              </button>
            </div>

            {/* SYSTEM PRIVILEGE NOTIFICATION BANNER OUTPUT PREVIEW */}
            <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs w-full">
                <p className="font-bold text-indigo-300 uppercase tracking-wide text-[10px]">Watermark System Target Verification Matrix</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-gray-400 font-mono text-[10px]">
                  <div className="bg-gray-950 p-2 rounded border border-gray-800 truncate">🏛️ Club: <strong className="text-white block truncate">{activeAsset.clubName}</strong></div>
                  <div className="bg-gray-950 p-2 rounded border border-gray-800 truncate">📅 Event: <strong className="text-white block truncate">{activeAsset.eventName}</strong></div>
                  <div className="bg-gray-950 p-2 rounded border border-gray-800 truncate">🔑 Role Stamp: <strong className="text-emerald-400 block truncate">{activeRole || 'Viewer'}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR LAYOUT */}
          <div className="space-y-6">
            
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
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 p-1 text-xs max-h-48 overflow-y-auto">
                      {availableUsersPool.filter(u => !activeAsset.taggedUsers.some(t => t.username === u)).map(user => (
                        <button 
                          key={user}
                          onClick={() => injectUserTag(user)}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-600 rounded-lg transition-colors block text-gray-300 hover:text-white"
                        >
                          @{user}
                        </button>
                      ))}
                      {availableUsersPool.filter(u => !activeAsset.taggedUsers.some(t => t.username === u)).length === 0 && (
                        <div className="p-2 text-center text-gray-500 text-[10px]">All available users tagged</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeAsset.taggedUsers.map(tag => (
                  <span 
                    key={tag.username} 
                    className={`border text-[11px] px-2.5 py-1 rounded-md font-mono flex items-center gap-1 transition-all ${
                      searchQuery.trim() !== "" && tag.username.toLowerCase().includes(searchQuery.toLowerCase())
                        ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold scale-105'
                        : 'bg-gray-900 border-gray-800 text-indigo-300'
                    }`}
                  >
                    @{tag.username}
                    <X 
                      className="w-3 h-3 text-gray-500 hover:text-red-400 cursor-pointer shrink-0" 
                      onClick={() => {
                        setActiveAsset(p => ({ ...p, taggedUsers: p.taggedUsers.filter(u => u.username !== tag.username) }));
                        triggerInternalNotification('tag', `Removed user signature tag link from: @${tag.username}`);
                      }} 
                    />
                  </span>
                ))}
                {activeAsset.taggedUsers.length === 0 && (
                  <p className="text-[11px] text-gray-500 italic">No users are tagged in this workspace node asset.</p>
                )}
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col h-[345px] justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Thread Interaction Comments
                </h3>
                
                <div className="space-y-3 overflow-y-auto h-[210px] pr-1 scrollbar-thin">
                  {activeAsset.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-900/50 p-2.5 rounded-xl border border-gray-900/60 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-gray-300 font-mono">@{comment.author}</span>
                        <span className="bg-gray-800 px-1.5 py-0.2 rounded text-indigo-400 text-[9px] font-semibold">{comment.role}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed font-sans">{comment.text}</p>
                      <p className="text-[8px] text-gray-600 font-mono text-right">{comment.timestamp}</p>
                    </div>
                  ))}
                  {activeAsset.comments.length === 0 && (
                    <p className="text-center text-gray-500 text-xs py-8 italic">No comments written yet. Leave a tracking comment below!</p>
                  )}
                </div>
              </div>

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

        {/* CUSTOM MODAL HUD DISPLAY */}
        {activeSecureLog && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#0b0c16] border-2 border-indigo-500/40 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest font-mono">Secure Download Registry</span>
                </div>
                <button 
                  onClick={() => setActiveSecureLog(null)}
                  className="p-1 rounded-lg bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 space-y-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Watermark Verification Stamp</div>
                  <div className="text-emerald-400 font-bold break-all bg-emerald-950/20 px-2 py-1.5 rounded border border-emerald-950/40">
                    {activeSecureLog.watermarkText}
                  </div>
                </div>

                <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Asset S3 Path Link</div>
                  <div className="text-gray-300 break-all text-[11px] leading-relaxed select-all">
                    {activeSecureLog.s3Path}
                  </div>
                </div>

                <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 space-y-1 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Execution Token</span>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-900/40">
                    {activeSecureLog.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURE ACCESS SHARE MODAL IMPLEMENTATION */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-950 border border-gray-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Share Secure Asset Node</h3>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Generate expiring viewer authorization links scoped down to your current profile role profile signature token.
              </p>
              <div className="flex gap-2 bg-gray-900 p-2 rounded-xl border border-gray-800 items-center">
                <Link2 className="w-4 h-4 text-gray-500 shrink-0 ml-1" />
                <input 
                  type="text" 
                  readOnly 
                  value={`https://platform-node.cluster/share/asset-${activeAsset.id}`} 
                  className="w-full bg-transparent text-xs text-indigo-300 outline-none select-all font-mono truncate"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`https://platform-node.cluster/share/asset-${activeAsset.id}`);
                    triggerInternalNotification('tag', 'Share link metadata mapped directly into local clipboard buffer.');
                    setShowShareModal(false);
                  }}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}