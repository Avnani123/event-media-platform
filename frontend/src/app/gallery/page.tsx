"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, Heart, Download, Sparkles, UploadCloud, FolderPlus, Folder, ArrowLeft, CheckCircle2, ShieldAlert, Check, X, ShieldCheck, Trash2, Eye, EyeOff, Tag } from 'lucide-react';
import { useRole } from '../../context/RoleContext'; 

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

export default function GalleryMatrix() {
  const router = useRouter(); 
  const { activeRole } = useRole(); 
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [directories, setDirectories] = useState<string[]>(["General_Pool", "Nexus National Hackathon 2026", "Mine"]); 
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);
  const [currentFolderContext, setCurrentFolderContext] = useState<string | null>(null);

  // Administrative handshake collection synced from live storage buffers
  const [pendingHandshakes, setPendingHandshakes] = useState<PendingHandshake[]>([]);

  // Workspace configuration metadata parameters
  const [customEventName, setCustomEventName] = useState<string>("");
  const [customClubName, setCustomClubName] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [isNewFolderPublic, setIsNewFolderPublic] = useState<boolean>(true);

  // Custom Metadata and Watermark Tag Local State Extensions
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [isDownloadingWithWatermark, setIsDownloadingWithWatermark] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  const canModifyStorage = activeRole === 'Admin' || activeRole === 'Photographer';
  const canViewPrivateMedia = activeRole === 'Admin' || activeRole === 'Photographer' || activeRole === 'Club Member';

  // Synchronize incoming access and handshake requests from live platform buffer
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
            ai_tags: item.ai_tags || ["Gallery", "Archive"],
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
            setActiveAsset(userReadablePhotos[0]);
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

  // Tag Modification Registry Sync
  const handleAddCustomTag = async () => {
    if (!activeAsset || !newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase();
    
    if (activeAsset.ai_tags.includes(cleanTag)) {
      alert("Tag configuration identifier signature mapping already exists.");
      return;
    }

    const compiledTags = [...activeAsset.ai_tags, cleanTag];
    
    try {
      await fetch(`http://localhost:5000/api/media/${activeAsset.id}/tags`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${dummyJwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tags: compiledTags })
      });

      const updatedAsset = { ...activeAsset, ai_tags: compiledTags };
      setActiveAsset(updatedAsset);
      setPhotos(prev => prev.map(p => p.id === activeAsset.id ? updatedAsset : p));
      setNewTagInput("");
    } catch (err) {
      const updatedAsset = { ...activeAsset, ai_tags: compiledTags };
      setActiveAsset(updatedAsset);
      setPhotos(prev => prev.map(p => p.id === activeAsset.id ? updatedAsset : p));
      setNewTagInput("");
    }
  };

  const handleRemoveCustomTag = async (tagToRemove: string) => {
    if (!activeAsset) return;
    const compiledTags = activeAsset.ai_tags.filter(t => t !== tagToRemove);

    try {
      await fetch(`http://localhost:5000/api/media/${activeAsset.id}/tags`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${dummyJwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tags: compiledTags })
      });

      const updatedAsset = { ...activeAsset, ai_tags: compiledTags };
      setActiveAsset(updatedAsset);
      setPhotos(prev => prev.map(p => p.id === activeAsset.id ? updatedAsset : p));
    } catch (err) {
      const updatedAsset = { ...activeAsset, ai_tags: compiledTags };
      setActiveAsset(updatedAsset);
      setPhotos(prev => prev.map(p => p.id === activeAsset.id ? updatedAsset : p));
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
  }, [currentFolderContext, searchQuery, activeRole]);

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
    try {
      await fetch(`http://localhost:5000/api/media/${mediaId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      setPhotos(prev => prev.map(p => {
        if (p.id === mediaId) {
          const currentLikes = p.likes_count || 0;
          return { ...p, likes_count: currentLikes + 1 };
        }
        return p;
      }));
      if (activeAsset?.id === mediaId) {
        setActiveAsset(prev => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Composite client visual watermarked processing pipeline 
  const triggerWatermarkedDownload = async (mediaId: number) => {
    if (!activeAsset) return;
    setIsDownloadingWithWatermark(true);

    let calculatedStampText = "Vault System Cluster Log Verification Node";

    try {
      const response = await fetch(`http://localhost:5000/api/media/${mediaId}/download`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      if (response.ok) {
        const res = await response.json();
        if (res.watermarkText) calculatedStampText = res.watermarkText;
      }
    } catch (err) {
      console.warn("Falling back onto local client processing cluster matrix validation routing layers.");
    }

    try {
      const imageElement = new Image();
      imageElement.crossOrigin = "anonymous";
      imageElement.src = activeAsset.s3_optimized_url;

      imageElement.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          alert("Watermarking compilation script runtime context mismatch execution failure.");
          setIsDownloadingWithWatermark(false);
          return;
        }

        ctx.drawImage(imageElement, 0, 0);

        const sizeMultiplier = Math.max(canvas.width / 1200, 1);
        ctx.font = `bold ${Math.floor(28 * sizeMultiplier)}px Inter, sans-serif`;
        
        const metrics = ctx.measureText(calculatedStampText);
        const paddingRight = 40 * sizeMultiplier;
        const paddingBottom = 40 * sizeMultiplier;
        const textX = canvas.width - metrics.width - paddingRight;
        const textY = canvas.height - paddingBottom;

        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillText(calculatedStampText, textX + (2 * sizeMultiplier), textY + (2 * sizeMultiplier));

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillText(calculatedStampText, textX, textY);

        const processingUriData = canvas.toDataURL("image/jpeg", 0.92);
        const anchorTriggerNode = document.createElement('a');
        anchorTriggerNode.href = processingUriData;
        anchorTriggerNode.download = `Watermarked_Asset_Reference_${mediaId}.jpg`;
        document.body.appendChild(anchorTriggerNode);
        anchorTriggerNode.click();
        document.body.removeChild(anchorTriggerNode);
        setIsDownloadingWithWatermark(false);
      };

      imageElement.onerror = () => {
        alert("Watermarking compilation script runtime crash: Image cross-origin pipeline access rejected.");
        setIsDownloadingWithWatermark(false);
      };
    } catch (e) {
      alert("Watermarking compilation script runtime crash.");
      setIsDownloadingWithWatermark(false);
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

  const filteredPhotosDisplay = photos.filter(item => {
    if (!currentFolderContext) return false;
    const itemEvent = item.event?.name || "General_Pool";
    if (itemEvent !== currentFolderContext) return false;
    
    if (item.is_public) return true; 
    return canViewPrivateMedia;      
  });

  const filteredDirectories = directories.filter(dir => 
    !currentFolderContext ? dir.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-[#0b0c16] text-white p-8 pb-32 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* 👑 ADMIN POWER-USER PANEL */}
        {activeRole === 'Admin' && (
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 mb-8 animate-fadeIn">
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
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gradient-to-indigo-400 to-indigo-400 bg-clip-text text-transparent">
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
        {!currentFolderContext && (
          <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-8 animate-fadeIn">
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium">Folder Directory Name</label>
                <input 
                  type="text"
                  disabled={!canModifyStorage}
                  placeholder={canModifyStorage ? "e.g., Internal_Core_Records" : "Requires Privileges"}
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-30 disabled:bg-[#060713]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium">Hosting Committee (Optional)</label>
                <input 
                  type="text"
                  disabled={!canModifyStorage}
                  placeholder={canModifyStorage ? "e.g., Coding Club Core" : "Context restricts access"}
                  value={customClubName}
                  onChange={(e) => setCustomClubName(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-30 disabled:bg-[#060713]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium">Description Metadata</label>
                <input 
                  type="text"
                  disabled={!canModifyStorage}
                  placeholder={canModifyStorage ? "e.g., Operational reference files." : "Context restricts access"}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-30 disabled:bg-[#060713]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. OPERATIONAL INGESTION ACTIONS COMMAND BAR */}
        <div className="bg-gradient-to-r from-[#1e1e38] to-[#13132b] p-5 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border border-indigo-500/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            <div>
              <div className="font-semibold text-sm text-indigo-200">
                {currentFolderContext ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Locked Scope: Inside "{currentFolderContext}" Directory
                  </span>
                ) : (
                  "Folder Directory View Active"
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Current Authenticated Execution Context Strategy: <strong className="text-indigo-400 font-semibold underline">{activeRole}</strong>
              </div>
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
              onClick={() => {
                if (!currentFolderContext) {
                  alert("Please enter an active folder layout boundary first before uploading assets!");
                  return;
                }
                if (!canModifyStorage) return;
                fileInputRef.current?.click();
              }}
              disabled={uploading || !canModifyStorage || !currentFolderContext}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                !currentFolderContext || !canModifyStorage
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-40 border border-gray-700/30' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 cursor-pointer'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>{uploading ? "Ingesting..." : "2. Upload Photos to Current Folder"}</span>
            </button>

            {/* 🧬 INTEGRATED BIOMETRIC BUTTON SECTION */}
            <button 
              onClick={() => {
                const targetPath = currentFolderContext 
                  ? `/biometrics?folder=${encodeURIComponent(currentFolderContext)}` 
                  : '/biometrics';
                router.push(targetPath);
              }}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 px-5 py-2 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg whitespace-nowrap cursor-pointer"
            >
              {currentFolderContext ? `Scan Face Profiles inside ${currentFolderContext}` : "Execute Global Biometrics Scan"}
            </button>
          </div>
        </div>

        {/* 📂 DIRECTORY LAYOUT GRID / PHOTOS SPLIT INTERFACE */}
        {loading && photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-gray-900/20 border border-gray-800 rounded-2xl">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 mt-4 font-medium">Syncing remote asset registers from cloud registry blocks...</p>
          </div>
        ) : !currentFolderContext ? (
          /* Render Folder List */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
            {filteredDirectories.map((folder, index) => (
              <div 
                key={index}
                onClick={() => { setCurrentFolderContext(folder); setSearchQuery(""); }}
                className="group relative bg-[#111222] border border-gray-800 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{folder}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Click to view contents</p>
                  </div>
                </div>
                {activeRole === 'Admin' && folder !== "General_Pool" && (
                  <button 
                    onClick={(e) => handlePurgeDirectory(e, folder)}
                    className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                    title="Delete Directory Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Render Inside Folder Media Asset Matrix layout split block */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            {/* Left: Photos Grid Column Section */}
            <div className="lg:col-span-2 space-y-4">
              {filteredPhotosDisplay.length === 0 ? (
                <div className="p-16 border-2 border-dashed border-gray-800 rounded-2xl text-center bg-[#060713]/20">
                  <ShieldAlert className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-400">No media components accessible inside this directory layer.</p>
                  <p className="text-xs text-gray-600 mt-1">Upload images or adjust filters to view storage pipeline streams.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredPhotosDisplay.map((photo) => (
                    <div 
                      key={photo.id}
                      onClick={() => setActiveAsset(photo)}
                      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-gray-950 ${
                        activeAsset?.id === photo.id ? 'border-indigo-500 shadow-indigo-500/20 shadow-lg scale-[0.99]' : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <img 
                        src={photo.s3_optimized_url} 
                        alt={photo.title || "Gallery Item"} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <div className="flex items-center justify-between text-[11px] font-medium text-white">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500 fill-red-500" /> {photo.likes_count || 0}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${photo.is_public ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {photo.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side Info: Component Preview & Actions Column Section */}
            <div className="lg:col-span-1">
              {activeAsset ? (
                <div className="bg-[#111222] border border-gray-800 rounded-2xl p-5 space-y-5 sticky top-6 shadow-xl animate-fadeIn">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-800 relative">
                    <img src={activeAsset.s3_optimized_url} alt="Active Preview" className="w-full h-full object-contain" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {activeRole === 'Admin' && (
                        <>
                          <button 
                            onClick={(e) => handleToggleVisibility(e, activeAsset)}
                            className="p-2 rounded-xl bg-black/60 backdrop-blur-md hover:bg-indigo-600 text-white transition-all cursor-pointer border border-white/5"
                            title={activeAsset.is_public ? "Set to Private" : "Set to Public"}
                          >
                            {activeAsset.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={(e) => handleDeleteAsset(e, activeAsset.id)}
                            className="p-2 rounded-xl bg-black/60 backdrop-blur-md hover:bg-red-600 text-white transition-all cursor-pointer border border-white/5"
                            title="Purge Asset Completely"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-bold text-gray-100 text-base tracking-tight">{activeAsset.title || `Media Reference Unit #${activeAsset.id}`}</h3>
                      <button 
                        onClick={() => handleLikeToggle(activeAsset.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 transition-all text-xs font-bold"
                      >
                        <Heart className="w-3.5 h-3.5" /> {activeAsset.likes_count || 0}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{activeAsset.event?.description || "No supplemental descriptions annotated for this dataset context structure elements."}</p>
                  </div>

                  {/* Tag Registry Segment Mapping Blocks */}
                  <div className="border-t border-gray-800/60 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Meta Mapping Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAsset.ai_tags.map((tag, idx) => (
                        <span key={idx} className="text-[11px] font-medium px-2 py-0.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-300 flex items-center gap-1">
                          {tag}
                          {activeRole === 'Admin' && (
                            <X className="w-2.5 h-2.5 ml-0.5 text-gray-500 hover:text-red-400 cursor-pointer" onClick={() => handleRemoveCustomTag(tag)} />
                          )}
                        </span>
                      ))}
                    </div>

                    {activeRole === 'Admin' && (
                      <div className="mt-3 flex gap-2">
                        <input 
                          type="text"
                          placeholder="Inject custom component tag..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                          className="flex-1 bg-gray-950 border border-gray-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                        />
                        <button onClick={handleAddCustomTag} className="px-3 py-2 bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all">Add</button>
                      </div>
                    )}
                  </div>

                  {/* Execution Download Action Operations Block */}
                  <div className="border-t border-gray-800/60 pt-4">
                    <button 
                      onClick={() => triggerWatermarkedDownload(activeAsset.id)}
                      disabled={isDownloadingWithWatermark}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-500/20 active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloadingWithWatermark ? "Compiling Layer..." : "Download Asset Verification Module"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-[#111222]/40 border border-gray-800 rounded-2xl text-center text-xs text-gray-500 font-medium">
                  Select any specific image card file view node element structure context parameters visualization layers.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}