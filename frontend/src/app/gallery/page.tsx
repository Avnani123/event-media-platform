"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, Heart, Download, Sparkles, UploadCloud, FolderPlus, Folder, ArrowLeft, Check, X, ShieldCheck, Trash2, Eye, EyeOff, Sliders, Share2, MessageSquare } from 'lucide-react';
import { useRole } from '../../context/RoleContext'; 
import NotificationCenter from '../../components/NotificationCenter';
import { useNotifications } from '../../components/useNotifications';

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

interface CommentData {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

// ==========================================
// 2. EMBEDDED WATERMARK & COMMENT MODAL COMPONENT
// ==========================================
interface WatermarkModalProps {
  asset: MediaAsset;
  onClose: () => void;
  onLikeTriggered: (id: number) => void;
  currentUserRole: string;
  comments: CommentData[];
  onAddComment: (assetId: number, newComment: CommentData) => void;
}

function InteractiveWatermarkModal({ asset, onClose, onLikeTriggered, currentUserRole, comments, onAddComment }: WatermarkModalProps) {
  const clubName = asset.event?.club_name || "Nexus National Hackathon 2026";
  const eventName = asset.event?.name || "Opening Keynote Address";
  
  const [opacity, setOpacity] = useState(0.45);
  const [fontSizeRatio, setFontSizeRatio] = useState(35);
  const [isDownloading, setIsDownloading] = useState(false);
  const [commentInput, setCommentInput] = useState('');

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

  const handlePostCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    
    onAddComment(asset.id, {
      id: Date.now(),
      author: currentUserRole === 'Admin' ? '@Active Sandbox Admin' : `@${currentUserRole}`,
      text: commentInput.trim(),
      timestamp: 'Just Now'
    });
    setCommentInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-6xl w-full bg-[#0d0e1b] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[95vh] lg:h-[85vh]">
        
        {/* Left Side: Preview Panel */}
        <div className="flex-1 bg-black/40 p-6 flex flex-col items-center justify-center relative min-h-[300px] lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-800">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 lg:hidden p-2 bg-gray-900/80 rounded-full border border-gray-800 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative max-w-full max-h-[50vh] lg:max-h-[70vh] rounded-lg overflow-hidden border border-gray-800 shadow-xl group">
            <img 
              src={asset.s3_optimized_url} 
              alt={asset.title || "Preview Matrix"} 
              className="max-w-full max-h-[50vh] lg:max-h-[70vh] object-contain object-center"
            />
            
            <div 
              style={{ opacity: opacity }}
              className="absolute bottom-4 right-4 text-white font-bold select-none pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] text-right transition-all duration-75"
            >
              <div className="text-[10px] md:text-xs bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-semibold">SocialWatermark Security Node</span>
                <p className="mt-0.5 text-white tracking-wide">{clubName} | {eventName}</p>
                <p className="text-indigo-400 font-medium text-[9px] mt-0.5">Scope Signature: {currentUserRole}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration & Comments Segment */}
        <div className="w-full lg:w-[380px] bg-[#111224] p-6 flex flex-col h-auto lg:h-full overflow-y-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold tracking-wider uppercase text-white">Asset Details & Engine</h3>
            </div>
            <button 
              onClick={onClose}
              className="hidden lg:block p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Object Metadata */}
          <div className="bg-[#060713]/50 p-3 rounded-xl border border-gray-800/60 text-xs">
            <p className="text-gray-400 font-medium">Target Context Object</p>
            <p className="font-bold text-white mt-1 truncate">{eventName}</p>
            <p className="text-[10px] text-indigo-300 mt-0.5 truncate">Hosted by: {clubName}</p>
          </div>

          {/* Configuration Sliders */}
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-gray-400">Stamp Opacity Translucency</span>
                <span className="text-cyan-400 font-bold">{Math.round(opacity * 100)}%</span>
              </div>
              <input 
                type="range" min="0.10" max="1.00" step="0.05" value={opacity} 
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-gray-400">Scale Grid Proportions</span>
                <span className="text-cyan-400 font-bold">Ratio 1/{fontSizeRatio}</span>
              </div>
              <input 
                type="range" min="20" max="60" step="2" value={fontSizeRatio} 
                onChange={(e) => setFontSizeRatio(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Real-time Dynamic Comments System */}
          <div className="flex-1 flex flex-col bg-[#060713]/40 border border-gray-800/80 rounded-xl p-3 space-y-3 min-h-[220px]">
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Pipeline Activity Log</span>
              <span className="text-[10px] text-gray-500 font-mono">({comments.length})</span>
            </div>

            {/* Scrollable Comment Loop */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[160px] pr-1 scrollbar-thin">
              {comments.length === 0 ? (
                <p className="text-[11px] text-gray-600 italic text-center pt-6">No workflow commentary registered.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-[#111224]/80 p-2 border border-gray-800/40 rounded-lg text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center font-mono text-[10px]">
                      <span className="text-cyan-400 font-semibold">{c.author}</span>
                      <span className="text-gray-500">{c.timestamp}</span>
                    </div>
                    <p className="text-gray-300 leading-normal font-sans">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Form Input Anchor */}
            <form onSubmit={handlePostCommentSubmit} className="flex gap-1.5 pt-1.5 border-t border-gray-800/60">
              <input 
                type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Append log record entry..."
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-cyan-500 placeholder-gray-600"
              />
              <button type="submit" className="bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-400 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all shrink-0">
                Post
              </button>
            </form>
          </div>

          {/* Bottom Call to Actions */}
          <div className="space-y-2 pt-2 border-t border-gray-800/60">
            <button
              onClick={() => onLikeTriggered(asset.id)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 hover:bg-gray-700 active:scale-[0.98] transition-all rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
              <span>Increment Like Registry ({asset.likes_count || 0})</span>
            </button>

            <button
              onClick={executeDownload} disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 transition-all rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
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
  const { notifications, addNotification, removeNotification } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [directories, setDirectories] = useState<string[]>(["General_Pool", "Nexus National Hackathon 2026", "Mine"]); 
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);
  const [currentFolderContext, setCurrentFolderContext] = useState<string | null>(null);

  // Comments State Map System keyed by assetId
  const [assetCommentsMap, setAssetCommentsMap] = useState<Record<number, CommentData[]>>({});
  const [pendingHandshakes, setPendingHandshakes] = useState<PendingHandshake[]>([]);

  const [customEventName, setCustomEventName] = useState("");
  const [customClubName, setCustomClubName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isNewFolderPublic, setIsNewFolderPublic] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFkbWluIn0";

  const canModifyStorage = activeRole === 'Admin' || activeRole === 'Photographer';
  const canViewPrivateMedia = activeRole === 'Admin' || activeRole === 'Photographer' || activeRole === 'Club Member';

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
      addNotification(`Purged empty storage container: ${directoryName}`);
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
        setPhotos(prev => prev.filter(p => p.id !== mediaId));
        if (activeAsset?.id === mediaId) setActiveAsset(null);
        addNotification("Media file securely cleared from operational register mapping.");
      } else {
        setPhotos(prev => prev.filter(p => p.id !== mediaId));
        if (activeAsset?.id === mediaId) setActiveAsset(null);
        addNotification("Erase command broadcast processed across system cache clusters.");
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
      addNotification(`Asset context successfully altered to: ${updatedVisibility ? 'PUBLIC' : 'PRIVATE'}`);
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
      formData.append("eventDescription", customDescription.trim() || "Isolated Access-Controlled Workspace Workspace.");
      formData.append("username", "Event Organiser");
      formData.append("isPublic", String(isNewFolderPublic));

      const response = await fetch("http://localhost:5000/api/media/bulk-upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` },
        body: formData
      });

      addNotification(`📁 Instantiated active cluster node entry: "${targetedName}"`);
      setDirectories(prev => Array.from(new Set([...prev, targetedName])));
      setCustomEventName("");
      setCustomClubName("");
      setCustomDescription("");
      setCurrentFolderContext(targetedName);
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
        addNotification(`🚀 Pushed ${uploadedFiles.length} raw assets inside context block: "${currentActiveWorkspace}"`);
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
    addNotification("Registering asset verification endorsement into ledger matrix...");
    setPhotos(prev => prev.map(p => p.id === mediaId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
    setActiveAsset(prev => prev && prev.id === mediaId ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : prev);

    try {
      await fetch(`http://localhost:5000/api/media/${mediaId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` }
      });
    } catch (err) {
      console.error("Error logging database registry counter update:", err);
    }
  };

  const handleAddCommentToAsset = (assetId: number, comment: CommentData) => {
    setAssetCommentsMap(prev => ({
      ...prev,
      [assetId]: [...(prev[assetId] || []), comment]
    }));
    addNotification(`Discussion stream appended by: ${comment.author}`);
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
    addNotification(`Scope clearance granted to role identity mapping: ${name}`);
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
    addNotification("Handshake reference access dropped by terminal admin.");
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

        {/* ==========================================
            1. RE-ALIGNED STORAGE MODULE CREATION SECTION
           ========================================== */}
        {!currentFolderContext ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            
            {/* Create Directory Subsection Block */}
            <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
                  <div className="flex items-center gap-2.5 text-cyan-400">
                    <FolderPlus className="h-5 w-5" />
                    <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">Initialize Target Storage Folder</h2>
                  </div>

                  <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex items-center gap-1 shrink-0">
                    <button 
                      type="button" disabled={!canModifyStorage} onClick={() => setIsNewFolderPublic(true)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${!canModifyStorage ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${isNewFolderPublic ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-400' : 'text-gray-400'}`}
                    >
                      Public Target
                    </button>
                    <button 
                      type="button" disabled={!canModifyStorage} onClick={() => setIsNewFolderPublic(false)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${!canModifyStorage ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${!isNewFolderPublic ? 'bg-amber-600/20 border border-amber-500/40 text-amber-400' : 'text-gray-400'}`}
                    >
                      Private Target
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Event Name Identification</label>
                    <input 
                      type="text" placeholder="e.g. Workshop_Session_A" value={customEventName} onChange={(e) => setCustomEventName(e.target.value)} disabled={!canModifyStorage}
                      className="w-full bg-gray-950/80 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Host Club Name</label>
                    <input 
                      type="text" placeholder="e.g. FinTech Club" value={customClubName} onChange={(e) => setCustomClubName(e.target.value)} disabled={!canModifyStorage}
                      className="w-full bg-gray-950/80 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Workspace Block Description</label>
                    <input 
                      type="text" placeholder="Specify event scopes or asset handling restrictions..." value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} disabled={!canModifyStorage}
                      className="w-full bg-gray-950/80 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button" onClick={handleCreateEmptyFolder} disabled={!canModifyStorage}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${canModifyStorage ? 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>Create Workspace Container</span>
                </button>
              </div>
            </div>

            {/* Direct File Ingestion Segment Block */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <UploadCloud className="h-5 w-5" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">Direct Ingestion Hub</h2>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  Stream high-resolution files into the <span className="text-gray-200 font-medium">General Pool</span> directory instantly.
                </p>
              </div>

              <div className="mt-4 flex-1 flex flex-col justify-center">
                <input 
                  type="file" id="direct-upload-node" multiple onChange={handleBulkUpload} ref={fileInputRef} disabled={!canModifyStorage} className="hidden" accept="image/*"
                />
                <label 
                  htmlFor="direct-upload-node"
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all text-center cursor-pointer ${canModifyStorage ? 'border-gray-800 hover:border-cyan-500/50 bg-gray-950/40 hover:bg-gray-950/80' : 'border-gray-800/40 opacity-40 cursor-not-allowed'}`}
                >
                  <UploadCloud className="h-7 w-7 text-gray-500 mb-2" />
                  <span className="text-xs font-semibold block text-gray-300">Select Files for Ingestion</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Supports multi-selection image files</span>
                </label>
              </div>
            </div>

          </div>
        ) : (
          /* Inline contextual file upload inside an active folder layout */
          canModifyStorage && (
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs space-y-0.5">
                <h4 className="font-bold text-gray-200">Append High-Res Imagery Layer</h4>
                <p className="text-gray-400">Direct streaming connection established target context: {currentFolderContext}</p>
              </div>
              <div>
                <input type="file" id="context-upload-node" multiple onChange={handleBulkUpload} ref={fileInputRef} className="hidden" accept="image/*" />
                <label htmlFor="context-upload-node" className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95">
                  <UploadCloud className="w-4 h-4" /> Ingest New Assets Here
                </label>
              </div>
            </div>
          )
        )}

        {/* Directory Card Mapping Grid Rendering Row */}
        {!currentFolderContext && (
          <div className="space-y-4 mb-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-indigo-400" /> Active Directory Map ({filteredDirectoriesDisplay.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredDirectoriesDisplay.map((dir) => {
                const innerCount = photos.filter(p => (p.event?.name || "General_Pool") === dir).length;
                return (
                  <div 
                    key={dir} onClick={() => setCurrentFolderContext(dir)}
                    className="group bg-[#0f1122]/60 hover:bg-[#13162b] border border-gray-800/80 hover:border-indigo-500/30 p-5 rounded-2xl cursor-pointer transition-all duration-200 shadow-lg flex items-center justify-between relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 z-10">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <Folder className="w-5 h-5 fill-indigo-500/10" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-200 truncate max-w-[180px] group-hover:text-white">{dir}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{innerCount} files registered</p>
                      </div>
                    </div>

                    {activeRole === 'Admin' && (
                      <button
                        onClick={(e) => handlePurgeDirectory(e, dir)}
                        className="p-2 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-lg transition-colors z-20 border border-transparent hover:border-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Photo Stream Display Cards Block */}
        {(currentFolderContext || searchQuery) && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <span>🖼️</span> Operational Media Matrix Result ({filteredPhotosDisplay.length})
            </h3>

            {filteredPhotosDisplay.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/10 border border-gray-800 rounded-2xl">
                <p className="text-sm text-gray-500 italic">No storage registers matching the current search parameters were resolved.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredPhotosDisplay.map((item) => (
                  <div 
                    key={item.id} onClick={() => setActiveAsset(item)}
                    className={`group bg-[#0f1122]/60 rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-cyan-500/5 ${activeAsset?.id === item.id ? 'border-cyan-500/80 ring-1 ring-cyan-500/30' : 'border-gray-800 hover:border-gray-700'}`}
                  >
                    <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden border-b border-gray-800">
                      <img 
                        src={item.s3_optimized_url} alt={item.title || "Grid thumbnail"} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {!item.is_public && (
                        <span className="absolute top-2 left-2 bg-amber-500/20 border border-amber-500/30 backdrop-blur-md text-amber-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" /> Private
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 space-y-3">
                      <div className="text-xs flex items-start justify-between gap-2">
                        <div className="truncate">
                          <h4 className="font-bold text-gray-200 truncate group-hover:text-white">{item.title || `Asset ID: #${item.id}`}</h4>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">Dir: {item.event?.name || "General_Pool"}</p>
                        </div>
                        {activeRole === 'Admin' && (
                          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => handleToggleVisibility(e, item)} className="p-1 text-gray-500 hover:text-cyan-400 hover:bg-gray-800 rounded transition-colors">
                              {item.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                            </button>
                            <button onClick={(e) => handleDeleteAsset(e, item.id)} className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(item.ai_tags || []).slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-gray-950 text-gray-400 text-[9px] font-medium px-1.5 py-0.5 rounded border border-gray-800/60">
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-[10px] font-medium text-gray-400">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> {item.likes_count || 0}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveAsset(item); }}
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          Details & Stamp <Sliders className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Embedded interactive dynamic Focus Modal Overlay layer */}
      {activeAsset && (
        <InteractiveWatermarkModal 
          asset={activeAsset}
          currentUserRole={activeRole}
          onClose={() => setActiveAsset(null)}
          onLikeTriggered={handleLikeToggle}
          comments={assetCommentsMap[activeAsset.id] || []}
          onAddComment={handleAddCommentToAsset}
        />
      )}

      {/* Floating Global Live Realtime Notification Layer Component Anchor */}
      <NotificationCenter 
        notifications={notifications} 
        onCloseNotification={removeNotification} 
      />
    </div>
  );
}