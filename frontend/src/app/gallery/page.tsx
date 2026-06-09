"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import { Search, Heart, Download, Sparkles, UploadCloud, FolderPlus, Folder, ArrowLeft, Check, X, ShieldCheck, Trash2, Eye, EyeOff, Sliders, Share2, MessageSquare, Scan, Cpu, AlertTriangle, Image as ImageIcon } from 'lucide-react';
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
  [key: string]: any;
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
// 3. GEMINI DEDICATED FACE SCANNER INTEGRATION PANEL
// ==========================================
interface FaceScannerProps {
  onMatchesFound: (matchedAssets: MediaAsset[]) => void;
  allPhotos: MediaAsset[];
  addNotification: (msg: string) => void;
}

function GeminiFaceScannerPanel({ onMatchesFound, allPhotos, addNotification }: FaceScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [scanMetrics, setScanMetrics] = useState<{ labels: string[]; confidence: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const executeGeminiFaceScan = async () => {
    if (!selectedFile) {
      addNotification("Please upload an identity snapshot reference first.");
      return;
    }

    const targetApiKey = geminiApiKey.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!targetApiKey) {
      setShowConfig(true);
      addNotification("API KEY REQUIRED: Please enter your Gemini API Key in the settings panel.");
      return;
    }

    setIsScanning(true);
    addNotification("Initializing biometric array layout vectors...");

    try {
      const imagePart = await fileToGenerativePart(selectedFile);
      const availableTags = Array.from(new Set(allPhotos.flatMap(p => p.ai_tags || [])));
      
      const prompt = `Analyze this face image. Identify facial structure, accessories, hair, expressions, or clothes. 
      From this list of available database system tags: [${availableTags.join(", ")}], pick the top matching tags that describe this person. 
      Return strictly a valid JSON object only.
      Format structure: {"matchedTags": ["tag1", "tag2"], "confidence": "94%"}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${targetApiKey}`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: imagePart.inlineData.mimeType,
                    data: imagePart.inlineData.data
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const userFriendlyMessage = errorBody?.error?.message || `HTTP Status ${response.status}`;
        
        console.error("Gemini Target Pipeline Rejected:", userFriendlyMessage);
        addNotification(`Gemini Connection Rejected: ${userFriendlyMessage}`);
        setIsScanning(false);
        return; 
      }

      const resultData = await response.json();
      let rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const parsedOutput = JSON.parse(rawText);
      const identifiedTags: string[] = parsedOutput.matchedTags || [];
      const confidenceRate = parsedOutput.confidence || "85%";

      setScanMetrics({ labels: identifiedTags, confidence: confidenceRate });

      if (identifiedTags.length === 0) {
        addNotification("Scan finished. No registered face silhouettes mapped.");
        onMatchesFound([]); 
        return;
      }

      const matchingAssets = allPhotos.filter(photo => 
        photo.ai_tags?.some(tag => identifiedTags.some(idTag => idTag.toLowerCase().trim() === tag.toLowerCase().trim()))
      );

      onMatchesFound(matchingAssets);
      addNotification(`Face query completed. Biometric Confidence Matrix: ${confidenceRate}`);

    } catch (err: any) {
      console.error("Gemini Scanning Layer structural failure:", err);
      addNotification(`Processing Failure: ${err?.message || "Internal compilation error"}`);
    } finally {
      setIsScanning(false);
    }
  };

  const clearScannerState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanMetrics(null);
    onMatchesFound(allPhotos);
  };

  return (
    <div className="bg-[#111224]/80 border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
            <Scan className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-white flex items-center gap-2">
              Gemini AI Identity Verification Terminal
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Stream target face configurations directly into Gemini flash analytical pipelines.</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs font-semibold bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {showConfig ? "Hide Config" : "Settings Engine Key"}
        </button>
      </div>

      {showConfig && (
        <div className="bg-[#060713] border border-gray-800 p-4 rounded-xl mb-4 space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold block">Enter Gemini Access Credentials Token</label>
          <div className="flex gap-2">
            <input 
              type="password" 
              placeholder="AIzaSy... (Paste Gemini API Key here)"
              value={geminiApiKey} 
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-700 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <p className="text-[10px] text-gray-500 italic">Leaves security references to local component runtime cache layers.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="bg-black/20 border border-dashed border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[160px] relative">
          {previewUrl ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-800">
              <img src={previewUrl} alt="Target vector alignment" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={clearScannerState}
                className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-md border border-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col items-center">
              <UploadCloud className="w-8 h-8 text-gray-600" />
              <div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                  Load Reference Portrait
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <p className="text-[10px] text-gray-600">Supports PNG, JPEG biometric captures</p>
            </div>
          )}
        </div>

        <div className="space-y-4 flex flex-col justify-center h-full pt-2">
          <button
            type="button"
            onClick={executeGeminiFaceScan}
            disabled={isScanning || !selectedFile}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none transition-all rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>{isScanning ? "Compiling Face Array..." : "Trigger AI Face Lookup"}</span>
          </button>

          {selectedFile && (
            <button 
              type="button"
              onClick={clearScannerState}
              className="w-full py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-xs font-bold rounded-xl text-gray-400 hover:text-white transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="bg-[#060713]/80 border border-gray-800/60 rounded-xl p-4 min-h-[160px] flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-mono">Telemetry Data Nodes</span>
            {scanMetrics ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-cyan-950/20 border border-cyan-500/10 rounded-lg p-2">
                  <span className="text-xs text-gray-400">Confidence Scale</span>
                  <span className="text-xs font-bold text-cyan-400 font-mono">{scanMetrics.confidence}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1">Identified Silhouette Mapping:</span>
                  <div className="flex flex-wrap gap-1">
                    {scanMetrics.labels.map((lbl, idx) => (
                      <span key={idx} className="bg-gray-900 border border-gray-800 text-gray-300 rounded px-1.5 py-0.5 text-[9px] font-mono">
                        #{lbl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : isScanning ? (
              <p className="text-xs text-cyan-400/80 italic font-mono animate-pulse pt-4 text-center">
                Streaming bytes to Gemini servers...
              </p>
            ) : (
              <p className="text-xs text-gray-600 italic pt-6 text-center">
                Awaiting operational interface input.
              </p>
            )}
          </div>
          
          <div className="text-[9px] text-gray-500 flex items-center gap-1 mt-2 border-t border-gray-900 pt-2">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Cross-matches generated assets via internal tags mapping vectors.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. MAIN GALLERY MATRIX ROOT CORE PAGE
// ==========================================
export default function GalleryMatrix() {
  const router = useRouter(); 
  const { activeRole } = useRole(); 
  const { notifications, addNotification, removeNotification } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [directories, setDirectories] = useState<string[]>(["General_Pool", "Nexus National Hackathon 2026", "Mine"]); 
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<MediaAsset[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);
  const [currentFolderContext, setCurrentFolderContext] = useState<string | null>(null);

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

  useEffect(() => {
    fetchPhotosForContext(currentFolderContext);
    fetchLiveHandshakes();
  }, [currentFolderContext, activeRole]);

  const filteredPhotosDisplay = displayedPhotos.filter(item => {
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
    
    let cachedLocalData: MediaAsset[] = [];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_persistent_photos');
      if (saved) {
        try {
          cachedLocalData = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to compile internal layout storage references:", e);
        }
      }
    }

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
          
          const unifiedArray = [...validPhotos];
          cachedLocalData.forEach(cachedItem => {
            if (!unifiedArray.some(p => p.id === cachedItem.id)) {
              unifiedArray.push(cachedItem);
            }
          });

          const finalFiltered = targetFolder 
            ? unifiedArray.filter(p => p.event?.name === targetFolder)
            : unifiedArray;

          setPhotos(unifiedArray);
          setDisplayedPhotos(finalFiltered);
          
          const dynamicFolders: string[] = [];
          unifiedArray.forEach(item => {
            if (item.event?.name && !dynamicFolders.includes(item.event.name)) {
              dynamicFolders.push(item.event.name);
            }
          });
          
          setDirectories(prev => Array.from(new Set([...prev, ...dynamicFolders])));

          const userReadablePhotos = finalFiltered.filter(p => p.is_public || canViewPrivateMedia);
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
          return;
        }
      }
    } catch (err) {
      console.warn("Backend sandbox disconnected. Initializing offline local cache array pipeline.");
    }

    const finalFilteredFallback = targetFolder 
      ? cachedLocalData.filter(p => p.event?.name === targetFolder)
      : cachedLocalData;

    setPhotos(cachedLocalData);
    setDisplayedPhotos(finalFilteredFallback);
    if (finalFilteredFallback.length > 0) {
      setActiveAsset(finalFilteredFallback[0]);
    } else {
      setActiveAsset(null);
    }
    setLoading(false);
  };

  const handleCreateNewFolderContext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEventName.trim()) {
      addNotification("Context folder label parameters cannot be initialized blank.");
      return;
    }
    
    if (!directories.includes(customEventName.trim())) {
      setDirectories(prev => [...prev, customEventName.trim()]);
      addNotification(`Initialized logical folder container: "${customEventName.trim()}"`);
      setCurrentFolderContext(customEventName.trim());
      setCustomEventName("");
      setCustomClubName("");
      setCustomDescription("");
    } else {
      addNotification("Target operational folder environment already deployed.");
    }
  };

  // FIXED: Implementation added safely allowing multiple files selection/processing in bulk sequential uploads
  const handleBulkMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const filesToUpload = Array.from(e.target.files);
    setUploading(true);
    addNotification(`Registering secure pipeline stream for ${filesToUpload.length} asset entries...`);

    let loadedCount = 0;
    const transientLocalPhotos = [...photos];

    for (const targetedFile of filesToUpload) {
      try {
        const dummyUrl = URL.createObjectURL(targetedFile);
        const systemId = Date.now() + Math.floor(Math.random() * 100000);
        
        const runtimeInferredContext = currentFolderContext || "General_Pool";
        const customDerivedClubName = customClubName.trim() || "Nexus Engineering Consortium";

        const simulatedAILabels = [
          "Auto_Generated",
          targetedFile.type.split('/')[1]?.toUpperCase() || "IMG",
          runtimeInferredContext.replace(/\s+/g, '_'),
          "Biometric_Verified"
        ];

        const constructedAsset: MediaAsset = {
          id: systemId,
          title: targetedFile.name.replace(/\.[^/.]+$/, ""),
          category: targetedFile.type,
          s3_optimized_url: dummyUrl,
          ai_tags: simulatedAILabels,
          likes_count: 0,
          is_public: isNewFolderPublic,
          event: {
            name: runtimeInferredContext,
            club_name: customDerivedClubName,
            description: customDescription || "Simulated local multi-stream storage array packet node."
          }
        };

        transientLocalPhotos.unshift(constructedAsset);
        loadedCount++;
      } catch (err) {
        console.error("Asset matrix parsing anomaly inside sequence processing:", err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_persistent_photos', JSON.stringify(transientLocalPhotos));
    }

    setPhotos(transientLocalPhotos);
    const finalFiltered = currentFolderContext 
      ? transientLocalPhotos.filter(p => p.event?.name === currentFolderContext)
      : transientLocalPhotos;
      
    setDisplayedPhotos(finalFiltered);
    if (finalFiltered.length > 0) setActiveAsset(finalFiltered[0]);

    setUploading(false);
    addNotification(`Bulk payload complete. Successfully processed (${loadedCount}/${filesToUpload.length}) assets.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAdminResolveHandshake = (id: string, authorize: boolean) => {
    const target = pendingHandshakes.find(h => h.id === id);
    setPendingHandshakes(prev => prev.filter(h => h.id !== id));
    
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('vault_pending_requests');
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          const altered = parsed.filter((req: any) => req.id !== id);
          localStorage.setItem('vault_pending_requests', JSON.stringify(altered));
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (authorize && target) {
      addNotification(`AUTHORIZED: Token privileges mapped for ${target.user} -> Role: ${target.targetRole}`);
    } else {
      addNotification(`REJECTED: Security reference revoked.`);
    }
  };

  const toggleAssetSecurityScope = (id: number) => {
    const updated = photos.map(p => p.id === id ? { ...p, is_public: !p.is_public } : p);
    setPhotos(updated);
    
    const contextFiltered = currentFolderContext ? updated.filter(p => p.event?.name === currentFolderContext) : updated;
    setDisplayedPhotos(contextFiltered);
    
    if (activeAsset && activeAsset.id === id) {
      setActiveAsset(updated.find(p => p.id === id) || null);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_persistent_photos', JSON.stringify(updated));
    }
    addNotification("Scope permission updated.");
  };

  const handleTriggerLikeMetric = (id: number) => {
    const upgraded = photos.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p);
    setPhotos(upgraded);
    
    const contextFiltered = currentFolderContext ? upgraded.filter(p => p.event?.name === currentFolderContext) : upgraded;
    setDisplayedPhotos(contextFiltered);
    
    if (activeAsset && activeAsset.id === id) {
      setActiveAsset(upgraded.find(p => p.id === id) || null);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_persistent_photos', JSON.stringify(upgraded));
    }
  };

  const appendCommentLogRegistry = (assetId: number, comment: CommentData) => {
    setAssetCommentsMap(prev => {
      const existing = prev[assetId] || [];
      return {
        ...prev,
        [assetId]: [...existing, comment]
      };
    });
    addNotification("Pipeline activity log appended.");
  };

  const handleInterceptScannerMatches = (matchedPhotos: MediaAsset[]) => {
    setDisplayedPhotos(matchedPhotos);
    if (matchedPhotos.length > 0) {
      setActiveAsset(matchedPhotos[0]);
    } else {
      setActiveAsset(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070814] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Identity Meta Banner strip */}
      <header className="border-b border-gray-900 bg-[#0d0e1b]/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-wider shadow-lg shadow-indigo-950/40">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-white">NEXUS SECURE CORE</h1>
            <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span>Security Auth Rank:</span>
              <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 rounded border border-cyan-800/40 font-bold uppercase">{activeRole}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-64 lg:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search cross-matrix records via tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111224] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-gray-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <NotificationCenter 
            notifications={notifications} 
            onClearNotification={removeNotification} 
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {/* Gemini Biometric Segment Section */}
        <GeminiFaceScannerPanel 
          allPhotos={photos}
          onMatchesFound={handleInterceptScannerMatches}
          addNotification={addNotification}
        />

        {/* Security handshake portal for administration role scopes */}
        {activeRole === 'Admin' && pendingHandshakes.length > 0 && (
          <div className="mb-8 bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-amber-500/10 pb-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Pending Secure Access Pipeline Authorization</h3>
                <p className="text-[11px] text-gray-400">Incoming user credential assignments require local terminal resolution verification.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingHandshakes.map((request) => (
                <div key={request.id} className="bg-[#111224] border border-gray-800 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{request.user}</p>
                    <p className="text-[10px] text-cyan-400 font-mono mt-0.5">Target: {request.targetRole}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => handleAdminResolveHandshake(request.id, false)}
                      className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleAdminResolveHandshake(request.id, true)}
                      className="p-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/40 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          {/* Left Controls & Workspace Directory Node */}
          <div className="space-y-6 xl:col-span-1">
            
            {/* Folder Context Status Segment */}
            <div className="bg-[#111224]/90 border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 font-mono">Workspace Context</span>
                {currentFolderContext && (
                  <button 
                    onClick={() => {
                      setCurrentFolderContext(null);
                      fetchPhotosForContext(null);
                    }}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Pool
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredDirectoriesDisplay.map((folder, index) => {
                  const isActive = currentFolderContext === folder;
                  const isFallback = !currentFolderContext && folder === "General_Pool";
                  const computedSelectedStatus = isActive || (isFallback && folder === "General_Pool" && !currentFolderContext && photos.length === 0);

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const target = folder === "General_Pool" ? null : folder;
                        setCurrentFolderContext(target);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all group cursor-pointer ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border-cyan-500/60 text-cyan-400 shadow-md shadow-cyan-950/20' 
                          : 'bg-black/20 border-gray-800/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                        <span className="text-xs font-medium truncate tracking-wide">{folder}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-40 px-1.5 py-0.5 bg-black/40 rounded border border-gray-800">
                        {photos.filter(p => folder === "General_Pool" ? !p.event?.name : p.event?.name === folder).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Restricted Operational Block Controls Panel */}
            {canModifyStorage ? (
              <div className="bg-[#111224]/90 border border-gray-800 rounded-2xl p-4 lg:p-6 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-indigo-400" /> Deploy New Event Domain
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Initialize isolated environment containers to support bulk payload entries.</p>
                </div>

                <form onSubmit={handleCreateNewFolderContext} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Event Target Designation *</label>
                    <input 
                      type="text" required placeholder="e.g., Cyber_Security_Summit_2026"
                      value={customEventName} onChange={(e) => setCustomEventName(e.target.value)}
                      className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Host Entity / Club</label>
                    <input 
                      type="text" placeholder="e.g., Linux Developers Guild"
                      value={customClubName} onChange={(e) => setCustomClubName(e.target.value)}
                      className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all rounded-xl text-xs font-bold text-white tracking-wide shadow-md cursor-pointer"
                  >
                    Instantiate Folder Node
                  </button>
                </form>

                <div className="border-t border-gray-900 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold text-gray-400 tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Stream Media Uploads
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsNewFolderPublic(!isNewFolderPublic)}
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border transition-colors ${
                        isNewFolderPublic 
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40" 
                          : "bg-red-950/40 text-red-400 border-red-800/40"
                      }`}
                    >
                      {isNewFolderPublic ? "Scope: Public" : "Scope: Protected"}
                    </button>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-800 hover:border-cyan-500/50 bg-black/20 rounded-xl p-6 text-center cursor-pointer group transition-all"
                  >
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleBulkMediaUpload} 
                    />
                    <UploadCloud className="w-8 h-8 text-gray-600 group-hover:text-cyan-400 mx-auto transition-colors" />
                    <p className="text-xs font-bold text-gray-300 mt-2">Trigger Drag & Drop Pipeline</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Supports single/bulk sequential imports</p>
                  </div>
                  {uploading && (
                    <div className="text-[10px] font-mono text-cyan-400 text-center animate-pulse">
                      Synchronizing bulk imagery buffer array...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#111224]/40 border border-gray-900 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 italic">Security clearance verification insufficient to allow structural storage mutations.</p>
              </div>
            )}
          </div>

          {/* Right Matrix Output Visualization Grid */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Segment SubHeader Metadata Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111224]/60 border border-gray-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-sm font-bold uppercase text-white tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" /> 
                  <span>Active Buffer Stream Listing</span>
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Showing {filteredPhotosDisplay.length} of {photos.length} elements mapped in structural memory registry.
                </p>
              </div>

              {/* Auxiliary Search Input for responsiveness */}
              <div className="md:hidden relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Filter keys..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-gray-200"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-20 text-center text-xs font-mono tracking-widest text-cyan-500 animate-pulse">
                PARSING STORAGE MATRIX REFERENCE BLOCK NODES...
              </div>
            ) : filteredPhotosDisplay.length === 0 ? (
              <div className="bg-[#111224]/30 border border-dashed border-gray-800 rounded-2xl p-16 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs font-medium text-gray-400">Zero active media entries found mapped.</p>
                <p className="text-[11px] text-gray-600 max-w-sm mx-auto">Try clearing active search strings, changing directory environments, or pushing fresh image array vectors.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPhotosDisplay.map((photo) => {
                  const isVisible = photo.is_public || canViewPrivateMedia;
                  const isCurrentlyFocused = activeAsset?.id === photo.id;
                  const commentsCount = assetCommentsMap[photo.id]?.length || 0;

                  if (!isVisible) {
                    return (
                      <div key={photo.id} className="bg-black/40 border border-gray-900 opacity-40 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-48 space-y-2">
                        <EyeOff className="w-5 h-5 text-red-500" />
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Access Scope Restricted</p>
                        <p className="text-[10px] text-gray-600">Upgrade session privileges token hierarchy to read packet.</p>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={photo.id}
                      className={`bg-[#111224] border rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col h-full hover:border-gray-700 group ${
                        isCurrentlyFocused ? 'ring-1 ring-cyan-500 border-cyan-500/40' : 'border-gray-800/60'
                      }`}
                    >
                      {/* Image Thumbnail Header segment */}
                      <div className="relative aspect-video bg-black/40 overflow-hidden shrink-0">
                        <img 
                          src={photo.s3_optimized_url} 
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 flex items-end justify-between">
                          <span className="text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm truncate max-w-[70%]">
                            {photo.event?.name || "General_Pool"}
                          </span>
                          
                          <div className="flex gap-1">
                            {canModifyStorage && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAssetSecurityScope(photo.id);
                                }}
                                className={`p-1 rounded bg-black/60 border hover:bg-gray-900 transition-colors cursor-pointer ${
                                  photo.is_public ? 'text-emerald-400 border-emerald-800/40' : 'text-amber-400 border-amber-800/40'
                                }`}
                                title={photo.is_public ? "Public Access Active" : "Private Vault Restrictions Imposed"}
                              >
                                {photo.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Title and Tags Metadata Layer body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white truncate tracking-wide leading-tight group-hover:text-cyan-400 transition-colors">
                            {photo.title || `SECURE_ASSET_${photo.id}`}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-mono truncate">
                            Hash: {photo.s3_optimized_url.split('/').pop()?.substring(0, 24) || photo.id}
                          </p>
                        </div>

                        {photo.ai_tags && photo.ai_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-h-[44px] overflow-hidden">
                            {photo.ai_tags.slice(0, 4).map((tag, idx) => (
                              <span key={idx} className="text-[9px] font-mono bg-black/30 border border-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                                #{tag.toLowerCase()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Interactive Footer Action Layer bar */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-900/60 text-[11px] font-mono text-gray-400 shrink-0">
                          <button 
                            onClick={() => handleTriggerLikeMetric(photo.id)}
                            className="flex items-center gap-1 hover:text-pink-400 transition-colors group/btn cursor-pointer"
                          >
                            <Heart className={`w-3.5 h-3.5 transition-transform group-active/btn:scale-125 ${photo.likes_count ? 'text-pink-500 fill-pink-500' : 'text-gray-500'}`} />
                            <span>{photo.likes_count || 0}</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 opacity-70">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{commentsCount}</span>
                            </span>
                            
                            <button
                              onClick={() => setActiveAsset(photo)}
                              className="text-xs font-bold text-cyan-400 hover:text-white bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg hover:bg-cyan-600 hover:border-cyan-500 transition-all cursor-pointer"
                            >
                              Initialize Watermark Engine
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Real-time Portal Execution Layer Overlay Container for interactive stamping */}
      {activeAsset && (
        <InteractiveWatermarkModal
          asset={activeAsset}
          currentUserRole={activeRole}
          comments={assetCommentsMap[activeAsset.id] || []}
          onAddComment={appendCommentLogRegistry}
          onLikeTriggered={handleTriggerLikeMetric}
          onClose={() => setActiveAsset(null)}
        />
      )}
    </div>
  );
}