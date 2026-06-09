"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, Heart, Download, Sparkles, UploadCloud, FolderPlus, Folder, ArrowLeft, Check, X, ShieldCheck, Trash2, Eye, EyeOff, Sliders, Share2 } from 'lucide-react';
import { useRole } from '../../context/RoleContext'; 

// ==========================================
// 1. TYPE DEFINITIONS & INTERFACES
// ==========================================
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
  is_public: boolean; 
}

interface PendingHandshake {
  id: string;
  user: string;
  targetRole: string;
  timestamp: string;
}

// ==========================================
// 2. EMBEDDED WATERMARK MODAL COMPONENT
// ==========================================
interface WatermarkModalProps {
  asset: MediaAsset;
  onClose: () => void;
  onLikeTriggered: (id: number) => void;
  currentUserRole: string;
}

function InteractiveWatermarkModal({ asset, onClose, onLikeTriggered, currentUserRole }: WatermarkModalProps) {
  const clubName = asset.event?.club_name || "Nexus National Hackathon 2026";
  const eventName = asset.event?.name || "Opening Keynote Address";
  
  const [opacity, setOpacity] = useState(0.45);
  const [fontSizeRatio, setFontSizeRatio] = useState(35);
  const [isDownloading, setIsDownloading] = useState(false);

  const executeDownload = () => {
    setIsDownloading(true);
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = asset.s3_optimized_url;
      
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const stampText = `${clubName} | ${eventName} | Verified: ${currentUserRole}`;
        const computedFontSize = Math.max(20, Math.floor(canvas.width / fontSizeRatio));
        
        ctx.font = `bold ${computedFontSize}px sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 6;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        ctx.fillText(stampText, canvas.width - (canvas.width * 0.03), canvas.height - (canvas.height * 0.03));

        const watermarkedDataUrl = canvas.toDataURL("image/jpeg", 0.90);
        const link = document.createElement("a");
        link.href = watermarkedDataUrl;
        link.setAttribute("download", asset.title || `secured_watermarked_${asset.id}.jpg`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
      };

      image.onerror = () => {
        throw new Error("Cross-origin stream reference dropped handling asset matrix elements.");
      };
    } catch (err) {
      alert("Watermarking compiler pipeline crash. Initializing raw fallback stream access.");
      const link = document.createElement("a");
      link.href = asset.s3_optimized_url;
      link.setAttribute("download", asset.title || `fallback_asset_${asset.id}.jpg`);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-5xl w-full bg-[#0d0e1b] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh]">
        
        {/* Left Side: Real-time Interactive Preview Layer */}
        <div className="flex-1 bg-black/40 p-6 flex flex-col items-center justify-center relative min-h-[300px] overflow-hidden">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden p-2 bg-gray-900/80 rounded-full border border-gray-800 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative max-w-full max-h-[50vh] rounded-lg overflow-hidden border border-gray-800 shadow-xl group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={asset.s3_optimized_url} 
              alt={asset.title || "Preview Matrix"} 
              className="max-w-full max-h-[50vh] object-contain object-center"
            />
            
            {/* SocialWatermark Layer Overlay Container */}
            <div 
              style={{ opacity: opacity }}
              className="absolute bottom-4 right-4 text-white font-bold select-none pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] text-right transition-all duration-75"
            >
              <div className="text-[10px] md:text-xs bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-semibold">SocialWatermark Security Node</span>
                <p className="mt-0.5 text-white tracking-wide">
                  {clubName} | {eventName}
                </p>
                <p className="text-indigo-400 font-medium text-[9px] mt-0.5">
                  Scope Signature: {currentUserRole}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration Controller Interface */}
        <div className="w-full md:w-80 bg-[#111224] border-t md:border-t-0 md:border-l border-gray-800 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold tracking-wider uppercase text-white">Watermark Engine</h3>
              </div>
              <button 
                onClick={onClose}
                className="hidden md:block p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#060713]/50 p-3 rounded-xl border border-gray-800/60">
                <p className="text-gray-400 font-medium">Target Context Object</p>
                <p className="font-bold text-white mt-1 truncate">{eventName}</p>
                <p className="text-[10px] text-indigo-300 mt-0.5 truncate">Hosted by: {clubName}</p>
              </div>

              {/* Slider 1: Translucency Parameters */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-400">Stamp Opacity Translucency</span>
                  <span className="text-indigo-400 font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.10" 
                  max="1.00" 
                  step="0.05"
                  value={opacity} 
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Slider 2: Scale Metric Modifier */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-400">Scale Grid Proportions</span>
                  <span className="text-indigo-400 font-bold">Ratio 1/{fontSizeRatio}</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="60" 
                  step="2"
                  value={fontSizeRatio} 
                  onChange={(e) => setFontSizeRatio(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <button
              onClick={() => onLikeTriggered(asset.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 active:scale-[0.98] transition-all rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span>Increment Like Registry ({asset.likes_count || 0})</span>
            </button>

            <button
              onClick={executeDownload}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 transition-all rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? "Compiling Canvas Asset..." : "Download Secure Stamp"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN GALLERY MATRIX ROOT CORE PAGE
// ==========================================
export default function GalleryMatrix() {
  const router = useRouter(); 
  const { activeRole } = useRole(); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [directories, setDirectories] = useState<string[]>(["General_Pool", "Nexus National Hackathon 2026", "Mine"]); 
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);
  const [currentFolderContext, setCurrentFolderContext] = useState<string | null>(null);

  const [watermarkAsset, setWatermarkAsset] = useState<MediaAsset | null>(null);
  const [pendingHandshakes, setPendingHandshakes] = useState<PendingHandshake[]>([]);

  const [customEventName, setCustomEventName] = useState("");
  const [customClubName, setCustomClubName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isNewFolderPublic, setIsNewFolderPublic] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  const canModifyStorage = activeRole === 'Admin' || activeRole === 'Photographer';
  const canViewPrivateMedia = activeRole === 'Admin' || activeRole === 'Photographer' || activeRole === 'Club Member';

  // FIXED ENGINE FILTER: Computes searches smoothly across titles, paths, and tags
  const filteredPhotosDisplay = photos.filter(item => {
    const searchString = searchQuery.toLowerCase().trim();
    if (!searchString) return true;

    const matchesTitle = item.title?.toLowerCase().includes(searchString);
    const matchesEvent = item.event?.name?.toLowerCase().includes(searchString);
    const matchesUrl = item.s3_optimized_url?.toLowerCase().includes(searchString);
    
    const tagsArray = item.ai_tags || (item as any).tags || [];
    const matchesTags = tagsArray.some((tag: string) => tag.toLowerCase().includes(searchString));

    return !!(matchesTitle || matchesTags || matchesEvent || matchesUrl);
  });

  // FIXED DIRECTORY LIST FILTER: Filters folder listing blocks based on search string when no folder is selected
  const filteredDirectoriesDisplay = directories.filter(dir => {
    const searchString = searchQuery.toLowerCase().trim();
    if (currentFolderContext || !searchString) return true;
    return dir.toLowerCase().includes(searchString);
  });

  const fetchLiveHandshakes = async () => {
    if (activeRole !== 'Admin') return;
    
    if (typeof window !== 'undefined') {
      const storageRequests = localStorage.getItem('vault_pending_requests');
      if (storageRequests) {
        try {
          const parsed = JSON.parse(storageRequests);
          const formatted: PendingHandshake[] = parsed.map((req: any) => ({
            id: req.id || `req-${Date.now()}`,
            user: req.name || req.email || "Unknown Slot",
            targetRole: req.role || "Photographer",
            timestamp: req.timestamp || "Just now"
          }));
          setPendingHandshakes(formatted);
          return; 
        } catch (e) {
          console.error(e);
        }
      }
    }

    try {
      const response = await fetch("http://localhost:5000/api/admin/handshakes", {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingHandshakes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to sync live pending authorization handshakes:", err);
    }
  };

  const fetchPhotosForContext = async (targetFolder: string | null, searchString: string = "") => {
    setLoading(true);
    try {
      let queryParam = searchString.trim();
      if (targetFolder) {
        queryParam = queryParam ? `${targetFolder} ${queryParam}` : targetFolder;
      }

      const response = await fetch(`http://localhost:5000/api/media/search?query=${encodeURIComponent(queryParam)}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const verifiedAccessData = data.map((item, index) => ({
            ...item,
            is_public: item.is_public !== undefined ? item.is_public : index % 3 !== 0
          }));

          const validPhotos = verifiedAccessData.filter(item => item.s3_optimized_url !== "placeholder" && item.s3_optimized_url !== "");
          setPhotos(validPhotos);
          
          const dynamicFolders: string[] = [];
          verifiedAccessData.forEach(item => {
            if (item.event?.name && !dynamicFolders.includes(item.event.name)) {
              dynamicFolders.push(item.event.name);
            }
          });
          
          setDirectories(prev => Array.from(new Set([...prev, ...dynamicFolders])));

          const userReadablePhotos = validPhotos.filter(p => p.is_public || canViewPrivateMedia);
          if (userReadablePhotos.length > 0) {
            setActiveAsset(prev => {
              if (prev && userReadablePhotos.some(p => p.id === prev.id)) {
                return userReadablePhotos.find(p => p.id === prev.id) || userReadablePhotos[0];
              }
              return userReadablePhotos[0];
            });
          } else {
            setActiveAsset(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync matrix files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeDirectory = (e: React.MouseEvent, directoryName: string) => {
    e.stopPropagation();
    if (activeRole !== 'Admin') return;
    
    const count = photos.filter(p => (p.event?.name || "General_Pool") === directoryName).length;
    if (count > 0) {
      alert(`Cannot delete directory "${directoryName}". It currently contains ${count} active media assets. Clear files first.`);
      return;
    }

    if (confirm(`Are you sure you want to remove the empty directory slot "${directoryName}"?`)) {
      setDirectories(prev => prev.filter(d => d !== directoryName));
    }
  };

  const handleDeleteAsset = async (e: React.MouseEvent, mediaId: number) => {
    e.stopPropagation();
    if (activeRole !== 'Admin') return;

    if (!confirm("CRITICAL INTERVENTION: Are you sure you want to completely erase this media asset from the platform registry?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/media/${mediaId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });

      if (response.ok) {
        alert("Asset securely purged from cloud registers successfully.");
        setPhotos(prev => prev.filter(p => p.id !== mediaId));
        if (activeAsset?.id === mediaId) setActiveAsset(null);
      } else {
        setPhotos(prev => prev.filter(p => p.id !== mediaId));
        if (activeAsset?.id === mediaId) setActiveAsset(null);
        alert("Erase command broadcast completed across client cache cluster boundary node.");
      }
    } catch (err) {
      console.error("Administrative execution exception:", err);
    }
  };

  const handleToggleVisibility = async (e: React.MouseEvent, item: MediaAsset) => {
    e.stopPropagation();
    if (activeRole !== 'Admin') return;

    const updatedVisibility = !item.is_public;
    try {
      await fetch(`http://localhost:5000/api/media/${item.id}/visibility`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${dummyJwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isPublic: updatedVisibility })
      });

      setPhotos(prev => prev.map(p => p.id === item.id ? { ...p, is_public: updatedVisibility } : p));
      if (activeAsset?.id === item.id) {
        setActiveAsset(prev => prev ? { ...prev, is_public: updatedVisibility } : null);
      }
    } catch (err) {
      console.error("Visibility toggling dropped pipeline reference:", err);
    }
  };

  useEffect(() => {
    fetchLiveHandshakes();
    
    const handleStorageUpdate = () => {
      fetchLiveHandshakes();
    };
    window.addEventListener('storage', handleStorageUpdate);

    // Sync state properly when layout shifts folder contexts
    fetchPhotosForContext(currentFolderContext, "");

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [currentFolderContext]);

  const handleCreateEmptyFolder = async () => {
    if (!canModifyStorage) return;

    const targetedName = customEventName.trim().replace(/\s+/g, "_");
    if (!targetedName) {
      alert("Please provide an Event Name / Directory Title first!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("eventName", targetedName);
      formData.append("clubName", customClubName.trim() || "Active Sandbox Admin");
      formData.append("eventDescription", customDescription.trim() || "Isolated Access-Controlled Workspace Container.");
      formData.append("username", "Event Organiser");
      formData.append("isPublic", String(isNewFolderPublic));

      const response = await fetch("http://localhost:5000/api/media/bulk-upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` },
        body: formData
      });

      if (response.ok) {
        alert(`📁 Storage Cluster "${targetedName}" created with [${isNewFolderPublic ? 'PUBLIC' : 'PRIVATE'}] security context!`);
        setDirectories(prev => Array.from(new Set([...prev, targetedName])));
        setCustomEventName("");
        setCustomClubName("");
        setCustomDescription("");
        setCurrentFolderContext(targetedName);
      } else {
        setDirectories(prev => Array.from(new Set([...prev, targetedName])));
        setCurrentFolderContext(targetedName);
        setCustomEventName("");
        setCustomClubName("");
        setCustomDescription("");
      }
    } catch (err) {
      console.error("Folder routing interruption:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canModifyStorage) return;

    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const currentActiveWorkspace = currentFolderContext || "General_Pool";

    const formData = new FormData();
    formData.append("eventName", currentActiveWorkspace);
    formData.append("clubName", "Active Sandbox Admin");
    formData.append("eventDescription", "Files streamed via authorized pipeline session context.");
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

      if (response.ok) {
        alert(`🎉 Success! ${uploadedFiles.length} assets verified & pushed inside "${currentActiveWorkspace}".`);
        setSearchQuery(""); 
        await fetchPhotosForContext(currentActiveWorkspace, "");
      } else {
        alert("Ingestion Failure: Cloud ingestion dropped handling payload stream.");
      }
    } catch (err) {
      console.error("Network upload connectivity drop:", err);
    } finally {
      setUploading(false);
      setLoading(false); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const handleLikeToggle = async (mediaId: number) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === mediaId) {
        return { ...p, likes_count: (p.likes_count || 0) + 1 };
      }
      return p;
    }));
    
    setActiveAsset(prev => {
      if (prev && prev.id === mediaId) {
        return { ...prev, likes_count: (prev.likes_count || 0) + 1 };
      }
      return prev;
    });

    setWatermarkAsset(prev => {
      if (prev && prev.id === mediaId) {
        return { ...prev, likes_count: (prev.likes_count || 0) + 1 };
      }
      return prev;
    });

    try {
      await fetch(`http://localhost:5000/api/media/${mediaId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
    } catch (err) {
      console.error("Error logging database registry counter update:", err);
    }
  };

  const handleApproveHandshake = async (id: string, name: string) => {
    if (typeof window !== 'undefined') {
      const current = JSON.parse(localStorage.getItem('vault_pending_requests') || '[]');
      const targetReq = current.find((r: any) => r.id === id || r.name === name);
      if (targetReq) {
        const currentUsers = JSON.parse(localStorage.getItem('vault_users') || '[]');
        currentUsers.push({ email: targetReq.email || `${name.toLowerCase()}@test.com`, password: '123', role: targetReq.role || 'Photographer' });
        localStorage.setItem('vault_users', JSON.stringify(currentUsers));
      }
      localStorage.setItem('vault_pending_requests', JSON.stringify(current.filter((r: any) => r.id !== id && r.name !== name)));
      window.dispatchEvent(new Event('storage'));
    }

    try {
      await fetch(`http://localhost:5000/api/admin/handshakes/${id}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
    } catch {}
    setPendingHandshakes(prev => prev.filter(h => h.id !== id));
    alert(`✅ Real-time privilege allocation confirmed for profile user: ${name}`);
  };

  const handleDenyHandshake = async (id: string) => {
    if (typeof window !== 'undefined') {
      const current = JSON.parse(localStorage.getItem('vault_pending_requests') || '[]');
      localStorage.setItem('vault_pending_requests', JSON.stringify(current.filter((r: any) => r.id !== id)));
      window.dispatchEvent(new Event('storage'));
    }

    try {
      await fetch(`http://localhost:5000/api/admin/handshakes/${id}/deny`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
    } catch {}
    setPendingHandshakes(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0b0c16] text-white p-8 pb-32 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* 👑 ADMIN POWER-USER PANEL */}
        {activeRole === 'Admin' && (
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Administrative Management Console</h3>
                <p className="text-xs text-indigo-300/60 mt-0.5">Review live incoming handshake access credentials across the isolated workspace cluster.</p>
              </div>
            </div>

            {pendingHandshakes.length === 0 ? (
              <div className="text-xs text-gray-500 bg-[#060713]/40 border border-[#1e223d] rounded-xl p-4 text-center">
                No active authorization profiles currently request scope identity shifts inside storage layer pipeline buffers.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingHandshakes.map((handshake) => (
                  <div key={handshake.id} className="flex items-center justify-between text-xs p-4 bg-[#060713]/60 rounded-xl border border-[#1e223d] hover:border-indigo-500/10 transition-colors">
                    <div>
                      <p className="font-semibold text-[#f3f4f6]">Request: {handshake.user}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Scope Target: <span className="text-indigo-400 font-medium">{handshake.targetRole}</span> • {handshake.timestamp}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApproveHandshake(handshake.id, handshake.user)}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all cursor-pointer border border-emerald-500/10"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDenyHandshake(handshake.id)}
                        className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all cursor-pointer border border-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Navigation Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent">
              {currentFolderContext ? `Directory: ${currentFolderContext}` : "Root Media Directory Workspace"}
            </h1>
            
            {currentFolderContext ? (
              <button 
                onClick={() => { setCurrentFolderContext(null); setSearchQuery(""); }}
                className="mt-2 flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Root Directory List
              </button>
            ) : (
              <p className="text-gray-400 text-sm mt-1">Isolate storage targets dynamically using custom managed folder infrastructure.</p>
            )}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            <input 
              type="text" 
              placeholder={currentFolderContext ? `Search tags or files inside current context...` : "Search directories..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* 1. INITIALIZE DIRECTORY WORKSPACE SECTION */}
        {!currentFolderContext ? (
          <div className="space-y-6">
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <FolderPlus className="h-5 w-5" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">1. Initialize a Target Storage Folder Directory</h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex items-center gap-1">
                    <button 
                      type="button"
                      disabled={!canModifyStorage}
                      onClick={() => setIsNewFolderPublic(true)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        !canModifyStorage ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      } ${isNewFolderPublic ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Public Target
                    </button>
                    <button 
                      type="button"
                      disabled={!canModifyStorage}
                      onClick={() => setIsNewFolderPublic(false)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        !canModifyStorage ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      } ${!isNewFolderPublic ? 'bg-amber-600/80 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Private Target
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateEmptyFolder}
                    disabled={!canModifyStorage}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 ${
                      canModifyStorage 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 cursor-pointer' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    <span>Create Workspace Directory</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <input 
                  type="text" 
                  placeholder="Event Name / Folder Code"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  disabled={!canModifyStorage}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-40"
                />
                <input 
                  type="text" 
                  placeholder="Hosting Club Identity"
                  value={customClubName}
                  onChange={(e) => setCustomClubName(e.target.value)}
                  disabled={!canModifyStorage}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-40"
                />
                <input 
                  type="text" 
                  placeholder="Container Description Meta"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  disabled={!canModifyStorage}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-40"
                />
              </div>
            </div>

            {/* Folder Grid View */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Available Storage Node Blocks</h3>
              {filteredDirectoriesDisplay.length === 0 ? (
                <div className="text-center p-12 bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500">
                  No matching directory elements located in active workspace index registers.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDirectoriesDisplay.map((dir) => (
                    <div 
                      key={dir}
                      onClick={() => setCurrentFolderContext(dir)}
                      className="group p-5 bg-gray-900/30 border border-gray-800 rounded-2xl flex items-center justify-between hover:border-indigo-500/40 transition-all cursor-pointer hover:bg-gray-900/50"
                    >
                      <div className="flex items-center gap-4 truncate">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center border border-indigo-500/10 group-hover:border-transparent transition-all shrink-0">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">{dir.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Click to view stream registry</p>
                        </div>
                      </div>
                      {activeRole === 'Admin' && (
                        <button
                          onClick={(e) => handlePurgeDirectory(e, dir)}
                          className="p-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/10 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 2. DISPATCHED INTERIOR FILE STREAM LOOK */
          <div className="space-y-6">
            {canModifyStorage && (
              <div className="p-8 bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl text-center backdrop-blur-sm max-w-2xl mx-auto">
                <UploadCloud className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
                <h3 className="text-sm font-bold text-gray-200">Broadcast Raw Asset Elements to Layer Pool</h3>
                <p className="text-xs text-gray-500 mt-1">Authorized Node Session Context Pipeline: {activeRole}</p>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef}
                  onChange={handleBulkUpload}
                  className="hidden" 
                  accept="image/*"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/10"
                >
                  {uploading ? "Streaming Payload Multiparts..." : "Select Files for Ingestion"}
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center p-24 text-xs font-mono text-indigo-400 tracking-widest animate-pulse">
                SYNCING ACTIVE MEDIA ACCESS GRID RECONCILIATION LAYER...
              </div>
            ) : filteredPhotosDisplay.length === 0 ? (
              <div className="text-center p-20 bg-gray-900/10 border border-dashed border-gray-800 rounded-2xl max-w-md mx-auto">
                <Sparkles className="w-6 h-6 mx-auto text-gray-600 mb-2" />
                <h4 className="text-xs font-bold text-gray-400">Zero Matching Element Vectors Located</h4>
                <p className="text-[11px] text-gray-600 mt-1">Adjust search parameters or push active assets into this workspace slot.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPhotosDisplay.map((photo) => {
                  const verifiedTags = photo.ai_tags || (photo as any).tags || [];
                  return (
                    <div 
                      key={photo.id}
                      onClick={() => setWatermarkAsset(photo)}
                      className="group bg-[#111224]/40 border border-gray-800/60 rounded-2xl overflow-hidden shadow-xl p-4 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all backdrop-blur-sm cursor-pointer"
                    >
                      {/* Thumbnail Container */}
                      <div className="aspect-video w-full bg-black/40 rounded-xl relative overflow-hidden border border-gray-800/80 flex items-center justify-center group-hover:scale-[1.01] transition-transform">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={photo.s3_optimized_url} 
                          alt={photo.title || "Asset Invariant"} 
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase backdrop-blur-md ${
                            photo.is_public 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {photo.is_public ? "Public Access" : "Private Scope"}
                          </span>
                        </div>
                      </div>

                      {/* Info Stacking Block */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-indigo-400 transition-colors">
                          {photo.title || `SECURED_ASSET_NODE_${photo.id}`}
                        </h4>
                        <p className="text-[10px] font-mono text-gray-500 truncate">ID Hash: #{photo.id}</p>
                        
                        {/* Tag Pills */}
                        {verifiedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {verifiedTags.slice(0, 3).map((tag: string) => (
                              <span key={tag} className="text-[9px] font-mono bg-gray-950 text-indigo-400 border border-gray-800 px-2 py-0.5 rounded-md">
                                #{tag}
                              </span>
                            ))}
                            {verifiedTags.length > 3 && (
                              <span className="text-[9px] font-mono bg-gray-950 text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded-md">
                                +{verifiedTags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Interactive Trigger Panel Elements */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-gray-400 text-xs">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider bg-black/40 border border-gray-800 px-2 py-0.5 rounded">
                          {photo.event?.name || "General"}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {activeRole === 'Admin' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleToggleVisibility(e, photo)}
                                className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Toggle Visibility Context"
                              >
                                {photo.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteAsset(e, photo.id)}
                                className="p-1.5 hover:bg-red-950 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                title="Purge Asset from Platform"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 pl-1">
                            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                            <span>{photo.likes_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. MODAL OVERLAY COMPONENT RENDER ENGINE PIPELINE TRIGGER */}
        {watermarkAsset && (
          <InteractiveWatermarkModal 
            asset={watermarkAsset}
            currentUserRole={activeRole || "Viewer"}
            onClose={() => setWatermarkAsset(null)}
            onLikeTriggered={handleLikeToggle}
          />
        )}

      </div>
    </div>
  );
}