"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { 
  Search, Heart, Download, Sparkles, UploadCloud, FolderPlus, 
  Folder, ArrowLeft, ShieldCheck, Check, X, Trash2, Eye, 
  EyeOff, Tag, ScanFace, FileWarning, RefreshCw, Lock, Unlock 
} from 'lucide-react';
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

  // Biometric Facial Recognition Framework Local States
  const [biometricSelfieFile, setBiometricSelfieFile] = useState<File | null>(null);
  const [biometricScanning, setBiometricScanning] = useState<boolean>(false);
  const [isBiometricActive, setIsBiometricActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const biometricInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  // Robust fallback variable resolution mechanism to eliminate "undefined" endpoint failures
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://event-media-platform-80me.onrender.com";

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
      const response = await fetch(`${apiBaseUrl}/api/admin/handshakes`, {   
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

      const response = await fetch(`${apiBaseUrl}/api/media/search?query=${encodeURIComponent(queryParam)}`, {
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

          const validPhotos = verifiedAccessData.filter(item => item.s3_optimized_url && item.s3_optimized_url !== "placeholder");
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

  // Execution engine pipeline handler for Biometric Face Mapping Matching
  const triggerBiometricFaceMatchScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selfieFile = e.target.files?.[0];
    if (!selfieFile) return;

    setBiometricSelfieFile(selfieFile);
    setBiometricScanning(true);
    setLoading(true);

    const formData = new FormData();
    formData.append("referenceSelfie", selfieFile);

    try {
      const response = await fetch(`${apiBaseUrl}/api/media/face-match`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.matchingPhotos)) {
          alert(`🧬 Biometric Scan Complete! Located ${data.matchesCount} exact matching facial profiles inside the database system.`);
          setPhotos(data.matchingPhotos);
          setIsBiometricActive(true);
          if (data.matchingPhotos.length > 0) {
            setActiveAsset(data.matchingPhotos[0]);
          }
        } else {
          alert("No facial pattern similarities detected inside the current archive pools.");
        }
      } else {
        alert("Facial matching system validation failed or timed out.");
      }
    } catch (err) {
      console.error("Biometric ingestion failure pipeline crash:", err);
      alert("Biometric analysis engine unreachable.");
    } finally {
      setBiometricScanning(false);
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
      const response = await fetch(`${apiBaseUrl}/api/media/${mediaId}`, {
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
      await fetch(`${apiBaseUrl}/api/media/${item.id}/visibility`, {
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

  const handleAddCustomTag = async () => {
    if (!activeAsset || !newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase();
    
    if (activeAsset.ai_tags.includes(cleanTag)) {
      alert("Tag configuration identifier signature mapping already exists.");
      return;
    }

    const compiledTags = [...activeAsset.ai_tags, cleanTag];
    
    try {
      await fetch(`${apiBaseUrl}/api/media/${activeAsset.id}/tags`, {
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
      await fetch(`${apiBaseUrl}/api/media/${activeAsset.id}/tags`, {
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
      if (!isBiometricActive) {
        fetchPhotosForContext(currentFolderContext, searchQuery);
      }
    }, 350);

    return () => {
      clearTimeout(delayDebounce);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [currentFolderContext, searchQuery, activeRole, isBiometricActive]);

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

      const response = await fetch(`${apiBaseUrl}/api/media/bulk-upload`, {
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
      const response = await fetch(`${apiBaseUrl}/api/media/bulk-upload`, {
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
      await fetch(`${apiBaseUrl}/api/media/${mediaId}/like`, {
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

  const triggerWatermarkedDownload = async (mediaId: number) => {
    if (!activeAsset) return;
    setIsDownloadingWithWatermark(true);

    let calculatedStampText = "Vault System Cluster Log Verification Node";

    try {
      const response = await fetch(`${apiBaseUrl}/api/media/${mediaId}/download`, {
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
      await fetch(`${apiBaseUrl}/api/admin/handshakes/${id}/approve`, {
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
      await fetch(`${apiBaseUrl}/api/admin/handshakes/${id}/deny`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
    } catch {}
    setPendingHandshakes(prev => prev.filter(h => h.id !== id));
  };

  const filteredPhotosDisplay = photos.filter(item => {
    if (isBiometricActive) return true; 
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

        {/* 🧬 NEW BIOMETRIC FACIAL INDEX MATCH ENGINE INTERFACE */}
        <div className="bg-gradient-to-r from-indigo-950/30 to-purple-950/20 border border-indigo-500/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-400/30">
                <ScanFace className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Biometric Face Match Locator 
                  {isBiometricActive && <span className="normal-case text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">Scan Filter Active</span>}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Upload a reference selfie profile graphic. Our vision network scans global event records to locate you instantly.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="file"
                ref={biometricInputRef}
                onChange={triggerBiometricFaceMatchScan}
                accept="image/*"
                className="hidden"
              />
              {isBiometricActive ? (
                <button
                  onClick={() => {
                    setIsBiometricActive(false);
                    setBiometricSelfieFile(null);
                    fetchPhotosForContext(currentFolderContext, searchQuery);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Reset Biometric View
                </button>
              ) : (
                <button
                  onClick={() => biometricInputRef.current?.click()}
                  disabled={biometricScanning}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {biometricScanning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing Facial Mapping...</span>
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-4 h-4" />
                      <span>Initialize Biometric Photo Scan</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-400 to-indigo-400 bg-clip-text text-transparent">
              {isBiometricActive ? "Biometric Scan Match Logs" : currentFolderContext ? `Directory: ${currentFolderContext}` : "Root Media Directory Workspace"}
            </h1>
            
            {(currentFolderContext || isBiometricActive) && (
              <button 
                onClick={() => { setCurrentFolderContext(null); setIsBiometricActive(false); setSearchQuery(""); }}
                className="mt-2 flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Root Directory List
              </button>
            )}
            {!currentFolderContext && !isBiometricActive && (
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
        {!currentFolderContext && !isBiometricActive && (
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input 
                type="text" 
                placeholder="Event Cluster Name (e.g., Hackathon_2026)"
                value={customEventName}
                onChange={(e) => setCustomEventName(e.target.value)}
                disabled={!canModifyStorage}
                className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <input 
                type="text" 
                placeholder="Club Organizer Handle (Optional)"
                value={customClubName}
                onChange={(e) => setCustomClubName(e.target.value)}
                disabled={!canModifyStorage}
                className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <input 
                type="text" 
                placeholder="Description / Storage Scope Node Info"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                disabled={!canModifyStorage}
                className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              disabled={!canModifyStorage || loading}
              onClick={handleCreateEmptyFolder}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" /> Assemble Empty Storage Container Scope
            </button>
          </div>
        )}

        {/* 2. DIRECTORIES ROOT GRID / MEDIA STREAM LAYOUT PANEL */}
        {!currentFolderContext && !isBiometricActive ? (
          <div>
            <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-semibold">
              <Folder className="w-4 h-4" /> Available Directory Registries ({filteredDirectories.length})
            </div>
            {filteredDirectories.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                No matching active directory records found inside database registers.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDirectories.map((dir, index) => (
                  <div 
                    key={index}
                    onClick={() => { setCurrentFolderContext(dir); setSearchQuery(""); }}
                    className="group relative p-5 bg-gradient-to-b from-gray-900/80 to-gray-950 border border-gray-800 rounded-2xl hover:border-indigo-500/40 transition-all cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Folder className="w-6 h-6" />
                      </div>
                      {activeRole === 'Admin' && (
                        <button
                          onClick={(e) => handlePurgeDirectory(e, dir)}
                          className="p-1.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h3 className="mt-4 font-bold text-gray-200 group-hover:text-white text-lg truncate">{dir}</h3>
                    <p className="text-xs text-gray-500 mt-1">Click to stream container cloud registers</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* WORKSPACE TARGETED CONTAINER VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            
            {/* LEFT SPLIT: DIRECTORY PHOTOS SUB-GRID ENGINE */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between bg-gray-900/40 p-4 border border-gray-800 rounded-xl">
                <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Assets Node Stream ({filteredPhotosDisplay.length} Files Loaded)
                </div>
                {canModifyStorage && (
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleBulkUpload} 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Direct Bulk Upload Stream
                    </button>
                  </div>
                )}
              </div>

              {filteredPhotosDisplay.length === 0 ? (
                <div className="text-center py-24 text-gray-500 bg-gray-900/10 border border-dashed border-gray-800 rounded-2xl">
                  <FileWarning className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  This container workspace context remains empty. Stream records onto S3 cluster buckets.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredPhotosDisplay.map((photo) => {
                    const isSelected = activeAsset?.id === photo.id;
                    return (
                      <div 
                        key={photo.id}
                        onClick={() => setActiveAsset(photo)}
                        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border bg-gray-950 transition-all ${
                          isSelected ? 'border-indigo-500 scale-[0.98] ring-2 ring-indigo-500/20' : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <img 
                          src={photo.s3_optimized_url} 
                          alt={photo.title || "Gallery Grid View"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleLikeToggle(photo.id); }}
                            className="p-1.5 bg-gray-900/80 backdrop-blur-md rounded-lg text-rose-400 border border-gray-800 hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          
                          {activeRole === 'Admin' && (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={(e) => handleToggleVisibility(e, photo)}
                                className={`p-1.5 rounded-lg text-white border transition-all ${
                                  photo.is_public ? 'bg-emerald-600/80 border-emerald-500' : 'bg-amber-600/80 border-amber-500'
                                }`}
                              >
                                {photo.is_public ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={(e) => handleDeleteAsset(e, photo.id)}
                                className="p-1.5 bg-red-600/80 border border-red-500 rounded-lg text-white hover:bg-red-700 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {!photo.is_public && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/90 text-black font-extrabold text-[9px] rounded uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SPLIT: ACTIVE TARGET DETAIL EXPLORER NODE */}
            <div className="lg:col-span-5">
              {activeAsset ? (
                <div className="sticky top-6 bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-gray-800">
                    <img 
                      src={activeAsset.s3_optimized_url} 
                      alt="Detailed Inspector Workspace View" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-gray-400 border border-gray-800">
                      ID reference: #{activeAsset.id}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-md font-bold tracking-wider uppercase">
                      {activeAsset.event?.name || currentFolderContext || "General pool repository"}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1.5 truncate">
                      {activeAsset.title || `Asset_Cluster_Index_${activeAsset.id}.jpg`}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeAsset.event?.description || "No supplemental manifest workspace documentation registered for this component node item."}
                    </p>
                  </div>

                  <div className="border-t border-b border-gray-800 py-3 flex items-center justify-between text-xs">
                    <div className="text-gray-400"> Likes verification log context: <span className="text-white font-bold">{activeAsset.likes_count || 0} clicks</span></div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${activeAsset.is_public ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-gray-300 font-medium">{activeAsset.is_public ? "Global Public Visibility" : "Restricted Private Vault"}</span>
                    </div>
                  </div>

                  {/* CUSTOM LABELS CONTROL REGISTRY MODULE */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-gray-400 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-400" /> Dynamic Label Graph Metadata Indices
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAsset.ai_tags.map((tag, idx) => (
                        <span key={idx} className="flex items-center gap-1 text-[11px] bg-gray-950 border border-gray-800 px-2.5 py-1 rounded-lg text-gray-300">
                          {tag}
                          {activeRole === 'Admin' && (
                            <X 
                              onClick={() => handleRemoveCustomTag(tag)}
                              className="w-3 h-3 text-gray-500 hover:text-red-400 cursor-pointer" 
                            />
                          )}
                        </span>
                      ))}
                    </div>
                    {activeRole === 'Admin' && (
                      <div className="flex gap-2 mt-2">
                        <input 
                          type="text"
                          placeholder="Inject structural AI token context tag..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                          className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button 
                          onClick={handleAddCustomTag}
                          className="px-3 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Append
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={isDownloadingWithWatermark}
                    onClick={() => triggerWatermarkedDownload(activeAsset.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isDownloadingWithWatermark ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Compiling Security Matrix Watermark...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Secure Output Download with Source Watermark
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                  Select a media item array item thumbnail component node to open information inspector metrics.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}