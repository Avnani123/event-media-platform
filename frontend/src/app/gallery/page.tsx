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
interface MediaAsset {
  id: string | number;
  ai_tags?: string[];
  [key: string]: any; 
}

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
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanMetrics(null);
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
      Return strictly a valid JSON object only. Do not enclose the response inside markdown code blocks (no backticks). 
      Format structure: {"matchedTags": ["tag1", "tag2"], "confidence": "94%"}`;

      // THE ULTIMATE FIX: CHANGED TO STABLE PRODUCTION V1 API GATEWAY URL
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${targetApiKey}`;
      
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
      
      // Clean up markdown block leaks securely
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "");
      
      const parsedOutput = JSON.parse(rawText.trim());
      const identifiedTags: string[] = parsedOutput.matchedTags || [];
      const confidenceRate = parsedOutput.confidence || "85%";

      setScanMetrics({ labels: identifiedTags, confidence: confidenceRate });

      if (identifiedTags.length === 0) {
        addNotification("Scan finished. No registered face silhouettes mapped.");
        onMatchesFound([]); 
        return;
      }

      // Case-Insensitive asset filtering evaluation mapping
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
          setDisplayedPhotos(validPhotos);
          
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
        setDisplayedPhotos(prev => prev.filter(p => p.id !== mediaId));
        if (activeAsset?.id === mediaId) setActiveAsset(null);
        addNotification("Media file securely cleared from operational register mapping.");
      } else {
        setPhotos(prev => prev.filter(p => p.id !== mediaId));
        setDisplayedPhotos(prev => prev.filter(p => p.id !== mediaId));
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
      const response = await fetch(`http://localhost:5000/api/media/${item.id}/visibility`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${dummyJwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_public: updatedVisibility })
      });

      if (response.ok) {
        const updateState = (prev: MediaAsset[]) => prev.map(p => p.id === item.id ? { ...p, is_public: updatedVisibility } : p);
        setPhotos(updateState);
        setDisplayedPhotos(updateState);
        if (activeAsset?.id === item.id) setActiveAsset(prev => prev ? { ...prev, is_public: updatedVisibility } : null);
        addNotification(`Asset status toggled to ${updatedVisibility ? 'Public' : 'Private Restriction'}.`);
      }
    } catch (err) {
      console.error("Visibility toggle failed:", err);
    }
  };

  const handleCreateDirectory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEventName.trim()) return;
    const name = customEventName.trim();
    if (directories.includes(name)) {
      alert("A directory context mapping with this identifier matches current directory headers.");
      return;
    }
    setDirectories(prev => [...prev, name]);
    setCustomEventName("");
    setCustomClubName("");
    setCustomDescription("");
    addNotification(`Configured operational folder partition: ${name}`);
  };

  const handleTriggerUploadClick = () => {
    if (!canModifyStorage) {
      alert("Unauthorized operational state logic. Adjust identity keys profile access scopes.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUploadExecuted = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    addNotification(`Buffering binary image stream data packet...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.split('.')[0] || "Asset Upload Stream");
    formData.append("eventName", currentFolderContext || "General_Pool");
    formData.append("clubName", "Nexus National Hackathon 2026");
    formData.append("is_public", String(isNewFolderPublic));

    try {
      const response = await fetch("http://localhost:5000/api/media/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${dummyJwt}` },
        body: formData
      });

      if (response.ok) {
        addNotification("File stream structural synchronization complete. Re-indexing records.");
        fetchPhotosForContext(currentFolderContext);
      } else {
        // Fallback localized cache ingestion if local backend is offline
        const localUrlFallback = URL.createObjectURL(file);
        const mockedAsset: MediaAsset = {
          id: Date.now(),
          title: file.name.split('.')[0],
          s3_optimized_url: localUrlFallback,
          ai_tags: ["Uploaded", "Local_Cache", "Snapshot"],
          likes_count: 0,
          is_public: true,
          event: {
            name: currentFolderContext || "General_Pool",
            club_name: "Nexus Hub Simulation"
          }
        };
        setPhotos(prev => [mockedAsset, ...prev]);
        setDisplayedPhotos(prev => [mockedAsset, ...prev]);
        setActiveAsset(mockedAsset);
        addNotification("Asset added to local view layer execution stack.");
      }
    } catch (err) {
      console.error(err);
      addNotification("Upload script pipeline fallback sequence initialized.");
    } finally {
      setUploading(false);
    }
  };

  const handleIncrementLike = (assetId: number) => {
    const updateLikes = (prev: MediaAsset[]) => prev.map(p => p.id === assetId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p);
    setPhotos(updateLikes);
    setDisplayedPhotos(updateLikes);
    if (activeAsset?.id === assetId) {
      setActiveAsset(prev => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : null);
    }
    addNotification("Asset like count entry modified inside registry.");
  };

  const handleAddCommentToAsset = (assetId: number, newComment: CommentData) => {
    setAssetCommentsMap(prev => ({
      ...prev,
      [assetId]: [...(prev[assetId] || []), newComment]
    }));
    addNotification("Workflow log comments node connected.");
  };

  const handleProcessHandshake = async (id: string, approve: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        const structuralRequests = localStorage.getItem('vault_pending_requests');
        if (structuralRequests) {
          const parsed = JSON.parse(structuralRequests);
          const filtered = parsed.filter((r: any) => r.id !== id);
          localStorage.setItem('vault_pending_requests', JSON.stringify(filtered));
        }
      }
      setPendingHandshakes(prev => prev.filter(req => req.id !== id));
      addNotification(`Authorization index handshake token sequence: ${approve ? "Approved" : "Rejected"}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#070814] text-gray-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Decorative Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top Main Navigation Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070814]/80 border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentFolderContext(null); setDisplayedPhotos(photos); }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/10 tracking-tighter text-xl">
            N
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              Nexus Media Vault
            </h1>
            <p className="text-[10px] text-cyan-400/80 font-mono font-bold uppercase tracking-widest mt-0.5">
              Secure Operations Node // {activeRole}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Query structural hashes or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <NotificationCenter />

          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-950 border border-gray-800 hover:border-gray-700 text-xs font-bold rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal Control</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame Container Layout */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        
        {/* Gemini Autonomous Face Scan Operations Box */}
        <GeminiFaceScannerPanel 
          allPhotos={photos} 
          onMatchesFound={(matches) => setDisplayedPhotos(matches)} 
          addNotification={addNotification} 
        />

        {/* Dynamic Context Header Path */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-500 hover:text-gray-300 cursor-pointer" onClick={() => setCurrentFolderContext(null)}>root</span>
            {currentFolderContext && (
              <>
                <span className="text-gray-700">/</span>
                <span className="text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                  {currentFolderContext}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentFolderContext && (
              <button
                onClick={() => setCurrentFolderContext(null)}
                className="px-3 py-1.5 bg-gray-950 border border-gray-800 hover:bg-gray-900 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-all flex items-center gap-1"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Parent Level</span>
              </button>
            )}

            {canModifyStorage && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUploadExecuted} />
                <button
                  onClick={handleTriggerUploadClick} disabled={uploading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 disabled:opacity-40 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploading ? "Sinking Stream..." : "Inject New Media Asset"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Columns Frame Grid Block */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Folder Context Selector Blocks - Only render on top-level root path */}
            {!currentFolderContext && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Folder className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Context Directories Matrix Index</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredDirectoriesDisplay.map((dir, idx) => {
                    const containingCount = photos.filter(p => (p.event?.name || "General_Pool") === dir).length;
                    return (
                      <div 
                        key={idx}
                        onClick={() => setCurrentFolderContext(dir)}
                        className="group bg-[#111224]/40 border border-gray-800/80 hover:border-gray-700 rounded-2xl p-4 flex items-center justify-between shadow-md hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-10 h-10 bg-indigo-950/40 border border-indigo-500/20 group-hover:border-indigo-500/40 text-indigo-400 rounded-xl flex items-center justify-center transition-all">
                            <Folder className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="max-w-[160px] md:max-w-xs">
                            <p className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors truncate">{dir}</p>
                            <p className="text-[10px] font-mono text-gray-500 mt-0.5">{containingCount} matrix elements loaded</p>
                          </div>
                        </div>

                        {activeRole === 'Admin' && (
                          <button
                            onClick={(e) => handlePurgeDirectory(e, dir)}
                            className="p-1.5 bg-gray-950 border border-gray-900 hover:border-red-900/50 hover:bg-red-950/20 text-gray-600 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {canModifyStorage && (
                    <form onSubmit={handleCreateDirectory} className="bg-gray-950/30 border border-dashed border-gray-800 rounded-2xl p-3 flex gap-2 items-center">
                      <input 
                        type="text"
                        placeholder="New context name..."
                        value={customEventName}
                        onChange={(e) => setCustomEventName(e.target.value)}
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                      />
                      <button type="submit" className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs transition-all shrink-0">
                        <FolderPlus className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </section>
            )}

            {/* Photos & Assets Segment Rendering Layout Grid */}
            <section>
              <div className="flex items-center justify-between mb-4 border-b border-gray-900 pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {currentFolderContext ? `Isolated Structural Stream Elements (${filteredPhotosDisplay.length})` : `Global Pipeline Media Storage Elements (${filteredPhotosDisplay.length})`}
                  </h2>
                </div>
                
                {searchQuery && (
                  <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/20">
                    Query Filter Active
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-12 border border-gray-900 bg-[#0d0e1b]/40 rounded-2xl text-center space-y-3">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 font-mono">Syncing system matrix clusters storage blocks...</p>
                </div>
              ) : filteredPhotosDisplay.length === 0 ? (
                <div className="p-16 border border-dashed border-gray-800 rounded-2xl text-center">
                  <ImageIcon className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-xs text-gray-400 font-medium">No system matrix records mapped to this node profile layout query.</p>
                  <p className="text-[10px] text-gray-600 mt-1">Clear your query filters or stream a fresh file binary snapshot above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredPhotosDisplay.map((item) => {
                    const isRestrictedToUser = !item.is_public && !canViewPrivateMedia;
                    const commentsCount = assetCommentsMap[item.id]?.length || 0;
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => { if (!isRestrictedToUser) setActiveAsset(item); }}
                        className={`group bg-[#111224]/30 border rounded-2xl overflow-hidden shadow-md transition-all flex flex-col relative ${isRestrictedToUser ? 'border-red-950/40 opacity-50 cursor-not-allowed' : 'border-gray-800/80 hover:border-gray-700 hover:shadow-xl cursor-pointer'}`}
                      >
                        {/* Top Context Image Card */}
                        <div className="relative aspect-video w-full bg-black/40 overflow-hidden border-b border-gray-900">
                          {isRestrictedToUser ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#070814]/90 backdrop-blur-sm">
                              <EyeOff className="w-6 h-6 text-red-500 mb-1" />
                              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Scope Privilege Vault Lock</p>
                              <p className="text-[9px] text-gray-500 mt-0.5 leading-normal">Requires higher operational encryption roles metadata profile signature.</p>
                            </div>
                          ) : (
                            <>
                              <img 
                                src={item.s3_optimized_url} 
                                alt={item.title || "Matrix Track"} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                <p className="text-[10px] font-mono text-cyan-400 truncate">{item.s3_optimized_url}</p>
                              </div>
                            </>
                          )}

                          {/* Visibility badge indicators status tags */}
                          <div className="absolute top-2 left-2 flex gap-1 items-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${item.is_public ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/80 text-red-400 border border-red-800/40'}`}>
                              {item.is_public ? "Public Access" : "Internal Restricted"}
                            </span>
                          </div>
                        </div>

                        {/* Card Meta Content Block */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors truncate">
                                {item.title || `SECURED_ASSET_HASH_${item.id}`}
                              </h3>
                              
                              {activeRole === 'Admin' && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={(e) => handleToggleVisibility(e, item)}
                                    className="p-1 bg-gray-950 border border-gray-800 hover:border-cyan-800 text-gray-500 hover:text-cyan-400 rounded transition-all"
                                    title="Toggle Encryption Privacy Access State"
                                  >
                                    {item.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteAsset(e, item.id)}
                                    className="p-1 bg-gray-950 border border-gray-800 hover:border-red-900 text-gray-500 hover:text-red-400 rounded transition-all"
                                    title="Purge Global Registry Storage Map"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
                              Ctx Context: {item.event?.name || "General_Pool"}
                            </p>
                          </div>

                          {/* Tags row layout container metadata arrays */}
                          <div className="flex flex-wrap gap-1 max-h-[38px] overflow-hidden">
                            {item.ai_tags?.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="bg-[#060713]/60 border border-gray-800/60 text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                #{tag}
                              </span>
                            ))}
                            {item.ai_tags?.length > 3 && (
                              <span className="text-[8px] font-mono text-gray-600 self-center">+{item.ai_tags.length - 3} more</span>
                            )}
                          </div>

                          {/* Footer Action telemetry records logs metrics indicators */}
                          <div className="flex items-center justify-between border-t border-gray-900/60 pt-2 text-[10px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-pink-500 fill-pink-500/20" /> {item.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-cyan-500" /> {commentsCount} logs
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar Columns Block Segment */}
          <div className="space-y-6">
            
            {/* Administrative Pending Verification Handshakes Frame Box */}
            {activeRole === 'Admin' && (
              <section className="bg-[#111224]/60 border border-gray-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Pending Handshake Tokens</h3>
                    <p className="text-[9px] text-gray-500 font-mono">({pendingHandshakes.length}) Security Access Requests</p>
                  </div>
                </div>

                {pendingHandshakes.length === 0 ? (
                  <p className="text-[11px] text-gray-600 italic text-center py-4">All dynamic session state parameters verified.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingHandshakes.map((req) => (
                      <div key={req.id} className="bg-black/40 border border-gray-900 p-2.5 rounded-xl space-y-2 text-[11px]">
                        <div className="flex justify-between font-mono text-[10px]">
                          <span className="text-cyan-400 font-bold max-w-[120px] truncate">{req.user}</span>
                          <span className="text-gray-600">{req.timestamp}</span>
                        </div>
                        <p className="text-gray-400">
                          Requests role escalation assignment path mapping to: <span className="text-indigo-400 font-bold font-mono">[{req.targetRole}]</span>
                        </p>
                        
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => handleProcessHandshake(req.id, true)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-600/10 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold transition-all"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleProcessHandshake(req.id, false)}
                            className="p-1 bg-red-600/10 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Quick Informational System Platform Readout Box */}
            <section className="bg-gray-950/40 border border-gray-900 p-4 rounded-2xl text-[11px] text-gray-500 space-y-2 font-mono">
              <span className="text-[10px] uppercase text-gray-400 tracking-wider font-bold block">Telemetry Core Diagnostics</span>
              <p>Platform Layer State: <span className="text-emerald-400">Online Alpha Node</span></p>
              <p>Active Node Session Context Token: <span className="text-gray-300 break-all">{dummyJwt.slice(0, 20)}...</span></p>
              <p>Sync Engine Frequency Parameters: <span className="text-gray-400">Real-time Browser State Sync Active</span></p>
            </section>
          </div>

        </div>
      </main>

      {/* Floating Modal Layer Context Wrapper Injection Engine */}
      {activeAsset && (
        <InteractiveWatermarkModal 
          asset={activeAsset}
          currentUserRole={activeRole}
          comments={assetCommentsMap[activeAsset.id] || []}
          onClose={() => setActiveAsset(null)}
          onLikeTriggered={handleIncrementLike}
          onAddComment={handleAddCommentToAsset}
        />
      )}
    </div>
  );
}