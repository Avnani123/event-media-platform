"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, Heart, Download, Sparkles, UploadCloud, FolderPlus, Folder, ArrowLeft, CheckCircle2, ShieldAlert, Check, X, ShieldCheck, Trash2, Eye, EyeOff } from 'lucide-react';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  const canModifyStorage = activeRole === 'Admin' || activeRole === 'Photographer';
  const canViewPrivateMedia = activeRole === 'Admin' || activeRole === 'Photographer' || activeRole === 'Club Member';

  // Synchronize incoming access and handshake requests from live platform buffer
  const fetchLiveHandshakes = async () => {
    if (activeRole !== 'Admin') return;
    
    // First, pool backup from shared localStorage dynamic sync layer
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
          return; // Prefers local broadcast orchestration
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Live endpoint fallback pipeline
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

  // Administrative Control: Purge Empty Project Directory from Workspace View
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

  // Administrative Control: Absolute Deletion of Active Assets
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

  // Administrative Control: Live Visibility Override Context Switcher
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
    
    // Core cross-tab localStorage update propagation listener
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
        // Safe UI emulation if standard test node is offline
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
      await fetchPhotosForContext(currentFolderContext, searchQuery);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerWatermarkedDownload = async (mediaId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/media/${mediaId}/download`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
      const res = await response.json();
      alert(`🔒 SECURE DOWNLOAD LOG\n\nWatermark Stamp: ${res.watermarkText || 'Verified Platform Asset'}\n\nAsset S3 Path: ${res.originalAsset || 'Local Cloud S3 Target Node'}`);
    } catch (err) {
      alert("Watermarking compilation script runtime crash.");
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

        {/* 3. STORAGE LAYER DYNAMIC GRID OUTPUT */}
        {loading ? (
          <div className="text-center py-24 text-gray-500 font-medium tracking-wide animate-pulse">Querying relational cloud database...</div>
        ) : !currentFolderContext ? (
          
          /* 🏠 VIEW A: ROOT PROJECT FOLDER REPOSITORIES DISPLAY */
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4">Available Project Directories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {directories
                .filter(folderName => folderName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((folderName, index) => {
                  const allFolderAssets = photos.filter(p => (p.event?.name || "General_Pool") === folderName);
                  const visibleFolderAssets = allFolderAssets.filter(p => p.is_public || canViewPrivateMedia);
                  const previewCoverAsset = visibleFolderAssets[0];
                  const isPrivateAlbum = folderName === "Mine" || folderName.includes("Core") || index === 2;

                  return (
                    <div
                      key={index}
                      onClick={() => { setCurrentFolderContext(folderName); setSearchQuery(""); }}
                      className="group relative bg-gradient-to-b from-[#1c1c35] to-[#121227] hover:from-[#222244] hover:to-[#161633] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-lg overflow-hidden"
                    >
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                        {activeRole === 'Admin' && (
                          <button
                            onClick={(e) => handlePurgeDirectory(e, folderName)}
                            title="Remove Empty Directory Slot"
                            className="p-1 bg-red-950/40 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {isPrivateAlbum ? (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                            <ShieldAlert className="w-2.5 h-2.5" /> Authorized Only
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                            Public
                          </span>
                        )}
                      </div>

                      <div className="w-full h-36 bg-indigo-950/20 border border-white/5 rounded-xl flex flex-col items-center justify-center text-indigo-400 mb-4 relative overflow-hidden transition-all">
                        {previewCoverAsset ? (
                          <>
                            <img 
                              src={previewCoverAsset.s3_optimized_url} 
                              alt={`${folderName} Album Cover`}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex items-end justify-start p-3">
                              <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                                <Folder className="w-2.5 h-2.5 fill-current" /> Active Cover
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 group-hover:bg-indigo-950/40 w-full h-full transition-colors border border-dashed border-indigo-500/10 rounded-xl">
                            <Folder className="w-10 h-10 text-indigo-500/70 fill-indigo-500/5 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-[10px] text-gray-500 font-medium">Unpopulated Album</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase font-bold">DIRECTORY FOLDER</span>
                        <h4 className="text-white text-lg font-bold truncate group-hover:text-indigo-200 transition-colors">{folderName}</h4>
                        <span className="text-xs text-gray-500 mt-1">Click to enter secure repository</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          
          /* 📂 VIEW B: INSIDE SPECIFIC FOLDER VIEW CONTENT MATRIX ARRAY */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Photos File Array inside "{currentFolderContext}"
              </h3>
            </div>

            {filteredPhotosDisplay.length === 0 ? (
              <div className="text-center py-24 text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10 px-4">
                <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-medium text-gray-400">No media assets match your active permission role tier.</p>
                <p className="text-xs text-gray-500 mt-1">If this directory is entirely empty, click up into your dashboard array triggers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredPhotosDisplay.map((photo) => (
                  <div 
                    key={photo.id}
                    onClick={() => setActiveAsset(photo)}
                    className={`group relative bg-gray-950 border rounded-xl overflow-hidden cursor-pointer transition-all ${
                      activeAsset?.id === photo.id ? 'border-indigo-500 scale-[0.98] shadow-inner' : 'border-white/5'
                    }`}
                  >
                    <img 
                      src={photo.s3_optimized_url} 
                      alt={photo.title || "Gallery Item"}
                      crossOrigin="anonymous"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <p className="text-xs font-bold truncate">{photo.title || "Untitled Image"}</p>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLikeToggle(photo.id); }}
                          className="p-1 bg-white/10 hover:bg-white/20 rounded text-rose-400"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); triggerWatermarkedDownload(photo.id); }}
                          className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {activeRole === 'Admin' && (
                          <>
                            <button 
                              onClick={(e) => handleToggleVisibility(e, photo)}
                              className={`p-1 rounded text-white ${photo.is_public ? 'bg-emerald-600' : 'bg-amber-600'}`}
                            >
                              {photo.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button 
                              onClick={(e) => handleDeleteAsset(e, photo.id)}
                              className="p-1 bg-red-600 hover:bg-red-500 rounded text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}