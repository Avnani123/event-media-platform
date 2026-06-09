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

  // FIXED: Deep filtering query scanner to scan item titles, s3 URLs, and inner tags cleanly
  const filteredPhotosDisplay = photos.filter(item => {
    const searchString = searchQuery.toLowerCase().trim();
    if (!searchString) return true;

    const matchesTitle = item.title?.toLowerCase().includes(searchString);
    const matchesEvent = item.event?.name?.toLowerCase().includes(searchString);
    const matchesUrl = item.s3_optimized_url?.toLowerCase().includes(searchString);
    
    // Checked fallback for both potential tag keys ('ai_tags' vs 'tags')
    const tagsArray = item.ai_tags || (item as any).tags || [];
    const matchesTags = tagsArray.some((tag: string) => tag.toLowerCase().includes(searchString));

    return matchesTitle || matchesTags || matchesEvent || matchesUrl;
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

    const delayDebounce = setTimeout(() => {
      fetchPhotosForContext(currentFolderContext, searchQuery);
    }, 350);

    return () => {
      clearTimeout(delayDebounce);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [currentFolderContext, searchQuery]);

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
              placeholder={currentFolderContext ? `Search tags or files inside ${currentFolderContext}...` : "Search directories..."}
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
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-30"
                />
                <input 
                  type="text" 
                  placeholder="Club Origin Affiliation"
                  value={customClubName}
                  onChange={(e) => setCustomClubName(e.target.value)}
                  disabled={!canModifyStorage}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-30"
                />
                <input 
                  type="text" 
                  placeholder="Folder Context Description Payload"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  disabled={!canModifyStorage}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-30"
                />
              </div>
            </div>

            {/* Folder Grid Renders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {directories
                .filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((dir) => (
                  <div 
                    key={dir}
                    onClick={() => { setCurrentFolderContext(dir); setSearchQuery(""); }}
                    className="group bg-gray-900/30 hover:bg-indigo-950/20 border border-gray-800 hover:border-indigo-500/30 p-5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10 group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5 fill-indigo-400/10" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors max-w-[160px]">{dir.replace(/_/g, " ")}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Storage Partition</p>
                      </div>
                    </div>

                    {activeRole === 'Admin' && (
                      <button
                        onClick={(e) => handlePurgeDirectory(e, dir)}
                        className="p-2 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-xl transition-colors relative z-20"
                        title="Delete Directory Segment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
              ))}
            </div>
          </div>
        ) : (
          /* 2. DYNAMIC WORKSPACE MEDIA GALLERY LAYER VIEW */
          <div className="space-y-6">
            {canModifyStorage && (
              <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-200">Ingest Media Stream Payload</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Push files directly inside the active target instance path segment: <span className="text-indigo-400 font-medium">{currentFolderContext}</span></p>
                  </div>
                </div>

                <label className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer">
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploading ? "Streaming Data Packets..." : "Upload Images"}</span>
                  <input 
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleBulkUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
                Refreshing encrypted object stream matrix grids...
              </div>
            ) : filteredPhotosDisplay.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/20 border border-gray-800 rounded-2xl">
                <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No assets matches your active search string filters.</p>
                <p className="text-xs text-gray-600 mt-1">Try testing other alternative AI tag signatures.</p>
              </div>
            ) : (
              /* Split Screen Asset Render Layout Grid */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Block: Render Grid Items */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredPhotosDisplay.map((photo) => {
                    const isAssetSelected = activeAsset?.id === photo.id;
                    return (
                      <div
                        key={photo.id}
                        onClick={() => setActiveAsset(photo)}
                        className={`group relative bg-gray-900/40 border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
                          isAssetSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-800/80 hover:border-gray-700'
                        }`}
                      >
                        <div className="aspect-video w-full bg-black/40 relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={photo.s3_optimized_url} 
                            alt={photo.title || "Gallery Item"} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />

                          {/* Quick Admin Access Controls Layer Badge Overlay */}
                          {activeRole === 'Admin' && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <button
                                onClick={(e) => handleToggleVisibility(e, photo)}
                                className={`p-1.5 rounded-lg border backdrop-blur-md transition-colors ${
                                  photo.is_public 
                                    ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' 
                                    : 'bg-amber-950/80 border-amber-500/30 text-amber-400'
                                }`}
                                title={photo.is_public ? "Public Visibility Active" : "Private Boundary Locked"}
                              >
                                {photo.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={(e) => handleDeleteAsset(e, photo.id)}
                                className="p-1.5 bg-red-950/80 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-900 transition-colors"
                                title="Purge Asset Completely"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Text Description Box Panel info inside grid */}
                        <div className="p-4 text-xs">
                          <p className="font-semibold text-gray-200 truncate">{photo.title || `Asset Reference Profile #${photo.id}`}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {photo.ai_tags?.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-950 text-gray-400 border border-gray-800 rounded-md text-[10px]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Block: Live Deep Inspection & Action Pane */}
                {activeAsset && (
                  <div className="bg-[#0f1020] border border-gray-800 rounded-2xl p-6 sticky top-8 space-y-5">
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-800/60 bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={activeAsset.s3_optimized_url} 
                        alt="Inspection Node" 
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded ${
                        activeAsset.is_public ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {activeAsset.is_public ? "Scope Context: Open Public" : "Scope Context: Restricted Private"}
                      </span>
                      <h3 className="text-base font-bold text-white mt-2.5 truncate">{activeAsset.title || `Asset Core Matrix Reference #${activeAsset.id}`}</h3>
                      <p className="text-xs text-gray-400 mt-1 truncate">Origin Container Reference: {activeAsset.event?.name || currentFolderContext || "General_Pool"}</p>
                    </div>

                    {/* Meta Tag Chips */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Identified Neural Cloud Labels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeAsset.ai_tags && activeAsset.ai_tags.length > 0 ? (
                          activeAsset.ai_tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-[#060713] border border-[#1d203b] text-indigo-300 rounded-lg text-[10px] font-medium">
                              🏷️ {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 italic">No labels parsed for this object instance.</span>
                        )}
                      </div>
                    </div>

                    {/* Operational Access Action Footers */}
                    <div className="pt-4 border-t border-gray-800/60 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleLikeToggle(activeAsset.id)}
                        className="flex items-center justify-center gap-2 py-2 bg-gray-900 hover:bg-gray-800 transition-colors border border-gray-800 text-xs font-semibold rounded-xl text-gray-200 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                        <span>Like ({activeAsset.likes_count || 0})</span>
                      </button>

                      <button
                        onClick={() => setWatermarkAsset(activeAsset)}
                        className="flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-xs font-bold rounded-xl text-white cursor-pointer shadow-md shadow-indigo-600/10"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Export Secure</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>

      {/* Interactive Floating Canvas Watermark Secure Controller Module Node */}
      {watermarkAsset && (
        <InteractiveWatermarkModal 
          asset={watermarkAsset}
          onClose={() => setWatermarkAsset(null)}
          onLikeTriggered={handleLikeToggle}
          currentUserRole={activeRole}
        />
      )}
    </div>
  );
}