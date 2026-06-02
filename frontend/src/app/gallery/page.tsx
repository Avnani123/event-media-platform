"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, Heart, Download, Sparkles, Play, SkipForward, SkipBack, MessageSquare, Share2, Settings, UploadCloud, FolderPlus, Folder, ArrowLeft, CheckCircle2, ShieldAlert, Users, Shield } from 'lucide-react';

// Explicitly tracking standard system roles matching specs
type UserRole = 'Admin' | 'Photographer' | 'Club Member' | 'Viewer';

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
  // Explicit Access Visibility Parameter Added per Security Spec
  is_public: boolean; 
}

export default function GalleryMatrix() {
  const router = useRouter(); 
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // 🔑 AUTHENTICATION AND ACCESS MATRIX ROLES STATE
  const [activeUserRole, setActiveUserRole] = useState<UserRole>('Admin'); 
  const [directories, setDirectories] = useState<string[]>(["General_Pool", "Nexus National Hackathon 2026", "Mine"]); 
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);
  const [currentFolderContext, setCurrentFolderContext] = useState<string | null>(null);

  // Workspace configuration metadata parameters
  const [customEventName, setCustomEventName] = useState<string>("");
  const [customClubName, setCustomClubName] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [isNewFolderPublic, setIsNewFolderPublic] = useState<boolean>(true); // Setting public/private state on creation

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  // Check if current persona can upload media or configure spaces
  const canModifyStorage = activeUserRole === 'Admin' || activeUserRole === 'Photographer';
  // Check if current persona can read private visibility clusters
  const canViewPrivateMedia = activeUserRole === 'Admin' || activeUserRole === 'Photographer' || activeUserRole === 'Club Member';

  // 1. SYNC MEDIA FILES ACCORDING TO SPECIFIC ROUTE SCOPE & ACCESS PROFILE
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
          // Fallback parsing injects visibility values if backend references drop them
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

          // Auto dock the first item readable by user profile
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

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPhotosForContext(currentFolderContext, searchQuery);
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [currentFolderContext, searchQuery, activeUserRole]);

  // 📁 INITIALIZE EMPTY WORKSPACE DIRECTORY WITH PRIVACY RULES
  const handleCreateEmptyFolder = async () => {
    if (!canModifyStorage) {
      alert(`⚠️ Access Denied: Role "${activeUserRole}" does not possess write privileges to build directories.`);
      return;
    }

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
        const errData = await response.json();
        alert(`Failed to initialize workspace directory: ${errData.error || 'Dropped'}`);
      }
    } catch (err) {
      console.error("Folder routing interruption:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. ISOLATED MULTI-FILE STREAMING INGESTION WITH ROLE SANITY CHECKS
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canModifyStorage) {
      alert(`⚠️ Access Denied: User role context "${activeUserRole}" cannot commit files to the cloud infrastructure.`);
      return;
    }

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

  // 🛡️ SECURE INTERFACE FILTERING ENGINES
  const filteredPhotosDisplay = photos.filter(item => {
    if (!currentFolderContext) return false;
    const itemEvent = item.event?.name || "General_Pool";
    if (itemEvent !== currentFolderContext) return false;
    
    // Evaluate explicit item visibility rules per specification checklist
    if (item.is_public) return true; // Public Media: Accessible by everyone
    return canViewPrivateMedia;      // Private Media: Accessible only to authorized club profiles
  });

  return (
    <div className="min-h-screen bg-[#0b0c16] text-white p-8 pb-32 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* INTERFACE ROLE SWITCHER CONTROL DOCK (SIMULATING PRODUCTION ACCESS CONFIGURATIONS) */}
        <div className="bg-[#121324] border border-indigo-500/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-400 w-5 h-5" />
            <div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">Access Control & Role Simulator</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Toggle role profiles to test automated UI restrictions.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['Admin', 'Photographer', 'Club Member', 'Viewer'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveUserRole(role);
                  setActiveAsset(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border ${
                  activeUserRole === role
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>{role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Header Navigation Module Block */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent">
              {currentFolderContext ? `Directory: ${currentFolderContext}` : "Root Media Directory Workspace"}
            </h1>
            
            {currentFolderContext ? (
              <button 
                onClick={() => { setCurrentFolderContext(null); setSearchQuery(""); }}
                className="mt-2 flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all active:scale-95"
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

        {/* 1. INITIALIZE DYNAMIC DIRECTORY COMPONENT (RESTRICTED PER ACCESSIBILITY METRICS RULES) */}
        {!currentFolderContext && (
          <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <FolderPlus className="h-5 w-5" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">1. Initialize a Target Storage Folder Directory</h2>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Public / Private Configuration Selector */}
                <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => setIsNewFolderPublic(true)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${isNewFolderPublic ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Public Target
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsNewFolderPublic(false)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${!isNewFolderPublic ? 'bg-amber-600/80 text-white' : 'text-gray-400 hover:text-white'}`}
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
                  placeholder={canModifyStorage ? "e.g., Internal_Core_Records" : "Requires Admin or Photographer access privileges"}
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium">Hosting Committee (Optional)</label>
                <input 
                  type="text"
                  disabled={!canModifyStorage}
                  placeholder="e.g., Coding Club Core"
                  value={customClubName}
                  onChange={(e) => setCustomClubName(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium">Description Metadata</label>
                <input 
                  type="text"
                  disabled={!canModifyStorage}
                  placeholder="e.g., Operational reference files."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. ACTIONS COMMAND BAR SCALED TO ACTIVE AREA CONTEXT */}
        <div className="bg-gradient-to-r from-[#1e1e38] to-[#13132b] p-5 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border border-indigo-500/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
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
                Current Authenticated Execution Context Strategy: <strong className="text-indigo-400 font-semibold underline">{activeUserRole}</strong>.
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
                if (!canModifyStorage) {
                  alert(`⚠️ Access Denied: Role "${activeUserRole}" does not have write permissions.`);
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={uploading || !canModifyStorage}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                !currentFolderContext || !canModifyStorage
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
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
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 px-5 py-2 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg whitespace-nowrap"
            >
              {currentFolderContext ? `Scan Face Profiles inside ${currentFolderContext}` : "Execute Global Biometrics Scan"}
            </button>
          </div>
        </div>

        {/* 3. DYNAMIC CONTENT SPLITTER SWITCH MATRIX */}
        {loading ? (
          <div className="text-center py-24 text-gray-500 font-medium tracking-wide animate-pulse">Querying relational cloud database...</div>
        ) : !currentFolderContext ? (
          
          /* 🏠 VIEW A: ROOT VIEW DISPLAYING ACCESSIBLE FOLDERS COVER TILES */
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4">Available Project Directories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {directories
                .filter(folderName => folderName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((folderName, index) => {
                  // Scan the global image cache array inside local memory states
                  const allFolderAssets = photos.filter(p => (p.event?.name || "General_Pool") === folderName);
                  
                  // Enforce explicit security checks: filter out non-public items if role profile is restricted
                  const visibleFolderAssets = allFolderAssets.filter(p => p.is_public || canViewPrivateMedia);
                  const previewCoverAsset = visibleFolderAssets[0];

                  // Mark specific folders private for layout visualization indicators
                  const isPrivateAlbum = folderName === "Mine" || folderName.includes("Core") || index === 2;

                  return (
                    <div
                      key={index}
                      onClick={() => { setCurrentFolderContext(folderName); setSearchQuery(""); }}
                      className="group relative bg-gradient-to-b from-[#1c1c35] to-[#121227] hover:from-[#222244] hover:to-[#161633] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-lg overflow-hidden"
                    >
                      {/* Security Access Badges placed over top corner tracks */}
                      <div className="absolute top-3 right-3 z-20">
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
          
          /* 📂 VIEW B: SUBFOLDER VIEW DISPLAYING IMAGES ONLY */
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
                <p className="text-xs text-gray-500 mt-1">If this directory is entirely empty, click "Upload Photos" above to populate it.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {filteredPhotosDisplay.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveAsset(item)}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1c1c35] to-[#121227] border p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                      activeAsset?.id === item.id ? 'border-indigo-500 bg-[#15152e]' : 'border-white/5 hover:border-indigo-500/20'
                    }`}
                  >
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-950 mb-4 w-full h-[180px] min-h-[180px]">
                      <img 
                        src={item.s3_optimized_url} 
                        alt={item.title || "Catalog Asset"} 
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c16]/90 via-transparent to-transparent opacity-60"></div>
                      
                      {/* Operational item metadata tags specifying visibility */}
                      <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono border border-white/5">
                        {item.is_public ? "🔓 PUBLIC" : "🔒 PRIVATE"}
                      </span>

                      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-indigo-400 font-semibold border border-white/5">
                        {item.event?.name}
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
                        <span className="bg-gray-800/40 text-gray-500 text-[10px] px-2 py-0.5 rounded-md border border-gray-800/50">#vision-tag</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Bottom Media Dock Controls Bar */}
      {activeAsset && (activeAsset.is_public || canViewPrivateMedia) && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121229]/95 backdrop-blur-xl border-t border-indigo-500/20 px-6 py-4 flex items-center justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] animate-slideUp">
          <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
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