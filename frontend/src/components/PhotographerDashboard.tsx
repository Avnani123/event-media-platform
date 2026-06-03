"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, UploadCloud, ClipboardList, Sliders, CheckCircle2, 
  AlertTriangle, ArrowRight, Battery, Cpu, Radio, HardDrive, 
  Tag, Flame, Eye, Sparkles, FileImage, ShieldAlert, Check
} from 'lucide-react';
import { useRole, UserRole } from "../context/RoleContext";

interface LocalJobAssignment {
  id: string;
  eventName: string;
  timeSlot: string;
  locationContext: string;
  requiredDeliverables: string;
  status: 'Pending' | 'In Progress' | 'Dispatched';
}

interface PreTagImage {
  name: string;
  size: string;
  predictedTags: string[];
  confidence: number;
}

export default function PhotographerDashboard() {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<'upload' | 'assignments' | 'gear' | 'analytics'>('upload');
  const [selectedFolder, setSelectedFolder] = useState<string>("General_Pool");
  const [ingestionStatus, setIngestionStatus] = useState<string | null>(null);
  
  // Advanced Feature State: Live Metadata Simulator
  const [simulatedMetadata, setSimulatedMetadata] = useState<PreTagImage[]>([]);
  
  // Advanced Feature State: Simulated Hardware Battery drain tracking
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [sdCardStorage, setSdCardStorage] = useState<string>("24.1 GB / 128 GB Free");

  const [jobs, setJobs] = useState<LocalJobAssignment[]>([
    { id: "job-101", eventName: "Nexus National Hackathon 2026", timeSlot: "14:00 - 18:00", locationContext: "Main Auditorium Block B", requiredDeliverables: "Candid tech stack shots & prize distributions", status: "In Progress" },
    { id: "job-102", eventName: "Cultural Fusion Stage Tracks", timeSlot: "19:30 - 22:00", locationContext: "Open Air Theater Arena", requiredDeliverables: "Low-light motion stability raw profiles", status: "Pending" }
  ]);

  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-simulate telemetry metrics updates over time
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => (prev > 10 ? prev - 1 : 100));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (activeRole !== 'Photographer' && activeRole !== 'Admin') {
    return (
      <div className="min-h-screen bg-[#0b0c16] flex items-center justify-center p-6">
        <div className="bg-red-950/20 border border-red-500/20 max-w-md rounded-2xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Access Violation Context</h2>
          <p className="text-xs text-gray-400 mt-1">Your cryptographic role token matches "{activeRole}". This operations desk requires strict "Photographer" clearance tokens.</p>
        </div>
      </div>
    );
  }

  const handleAdvancedBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIngestionStatus("Streaming raw image stream buffers to staging S3 buckets...");
    
    // Feature Upgrade: Generate instant pre-tag diagnostics on upload interaction
    const simulatedArray: PreTagImage[] = Array.from(files).map(file => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      predictedTags: ["On-Stage", "Tech Event", "Dynamic Lighting", "Candidate Profile"].sort(() => 0.5 - Math.random()).slice(0, 3),
      confidence: Math.floor(Math.random() * (99 - 85 + 1) + 85)
    }));
    
    setSimulatedMetadata(simulatedArray);

    setTimeout(() => {
      setIngestionStatus(`Successfully dispatched & indexed ${files.length} assets inside "${selectedFolder}".`);
    }, 2500);
  };

  const advanceJobStatus = (id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const nextStatus = j.status === 'Pending' ? 'In Progress' : 'Dispatched';
      return { ...j, status: nextStatus };
    }));
  };

  return (
    <div className="min-h-screen bg-[#0b0c16] text-white p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP STATUS HEADER WITH REAL-TIME HARDWARE TELEMETRY */}
        <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold tracking-widest uppercase">
              <Camera className="w-4 h-4" /> Creator Operations Node
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Photographer Workspace</h1>
          </div>
          
          {/* HARDWARE TELEMETRY FEATURE */}
          <div className="flex items-center gap-4 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 text-xs">
            <div className="flex items-center gap-1.5 border-r border-gray-800 pr-3">
              <Battery className={`w-4 h-4 ${batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
              <span className="text-gray-400 font-mono">Cam Battery: <strong className="text-white font-medium">{batteryLevel}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span className="text-gray-400 font-mono">SD Cache: <strong className="text-white font-medium">{sdCardStorage}</strong></span>
            </div>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION BAR */}
        <div className="flex overflow-x-auto gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800 text-xs mb-8">
          <button 
            onClick={() => setActiveTab('upload')} 
            className={`px-4 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <UploadCloud className="w-3.5 h-3.5 inline mr-1.5" /> Ingestion & AI Tag Previews
          </button>
          <button 
            onClick={() => setActiveTab('assignments')} 
            className={`px-4 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'assignments' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" /> Direct Field Assignments ({jobs.filter(j => j.status !== 'Dispatched').length})
          </button>
          <button 
            onClick={() => setActiveTab('gear')} 
            className={`px-4 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'gear' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <Sliders className="w-3.5 h-3.5 inline mr-1.5" /> Calibration Checks
          </button>
        </div>

        {/* TAB 1: ASSET STREAMING PIPELINE & AI TAG PREVIEWER */}
        {activeTab === 'upload' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-b from-[#121324] to-[#0c0d1a] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4">Direct Content Stream Tunnel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-medium">Target Storage Cluster Root Context</label>
                    <select 
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="bg-gray-950 border border-gray-800 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="General_Pool">General_Pool (Shared Sandbox)</option>
                      <option value="Nexus National Hackathon 2026">Nexus National Hackathon 2026</option>
                      <option value="Mine">Mine (Private Staging Space)</option>
                    </select>
                  </div>

                  <div 
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-800 hover:border-indigo-500/40 rounded-2xl p-8 text-center bg-gray-950/40 transition-all cursor-pointer group"
                  >
                    <UploadCloud className="w-10 h-10 text-gray-500 group-hover:text-indigo-400 mx-auto mb-3 transition-colors" />
                    <span className="text-xs font-bold text-gray-300 block">Click to map files for ingestion</span>
                    <span className="text-[10px] text-gray-500 mt-1 block">Supports hardware cluster parsing arrays (.JPG, .PNG, .RAW)</span>
                    <input type="file" ref={fileRef} onChange={handleAdvancedBatchUpload} multiple accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="bg-gray-950/60 rounded-xl p-5 border border-gray-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> Pipeline Live Diagnostics
                    </h4>
                    {ingestionStatus ? (
                      <p className="text-xs font-mono text-emerald-400 bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20">{ingestionStatus}</p>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Awaiting structural image tracking file streams...</p>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-4 bg-indigo-950/20 p-3 rounded-lg border border-indigo-500/10 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>AI Auto-Tag Generation:</strong> Computer Vision pipeline hooks instantly run tags against your selections below prior to saving metadata records to the primary database stack.</span>
                  </div>
                </div>

              </div>
            </div>

            {/* UPGRADE FEATURE: REAL-TIME AI PRE-TAG DIAGNOSTIC MATRIX */}
            {simulatedMetadata.length > 0 && (
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 animate-fadeIn">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-400" /> Ingestion Staging Layer Pre-Tags Preview
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {simulatedMetadata.map((img, idx) => (
                    <div key={idx} className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/60 flex items-start justify-between text-xs gap-4">
                      <div className="space-y-1 truncate">
                        <p className="font-mono text-gray-200 truncate flex items-center gap-1.5">
                          <FileImage className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {img.name}
                        </p>
                        <p className="text-[10px] text-gray-500">File Payload Weight: {img.size}</p>
                        <div className="flex flex-wrap gap-1 mt-2 pt-1">
                          {img.predictedTags.map((tag, tIdx) => (
                            <span key={tIdx} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-bold px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                          {img.confidence}% Match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE FIELD WORK ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-4 animate-fadeIn">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      job.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      job.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">ID: {job.id}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1.5">{job.eventName}</h4>
                  <p className="text-xs text-gray-400 mt-1">📍 Location Desk: <strong className="text-gray-300 font-medium">{job.locationContext}</strong> • ⏱️ Window: {job.timeSlot}</p>
                  <p className="text-xs text-indigo-300/70 italic mt-0.5">Manifest Criteria: {job.requiredDeliverables}</p>
                </div>

                {job.status !== 'Dispatched' && (
                  <button 
                    onClick={() => advanceJobStatus(job.id)}
                    className="sm:self-center px-4 py-2 bg-gray-950 hover:bg-indigo-600 border border-gray-800 hover:border-indigo-500 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 group shrink-0 cursor-pointer"
                  >
                    <span>{job.status === 'Pending' ? "Begin Tracking Session" : "Signal Upload Completed"}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CALIBRATION CHECKS & LOADOUTS */}
        {activeTab === 'gear' && (
          <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 animate-fadeIn">
            <div className="flex items-center gap-2 text-indigo-400 mb-3">
              <Radio className="w-4 h-4 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Field Loadout Wireless Check</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Validate system connectivity status loops before executing on-site coverage.</p>
            
            <div className="space-y-2.5">
              {[
                { label: "Primary Full-Frame Mirrorless Cluster Integration", status: "Calibrated", health: "100%" },
                { label: "High-Speed S3 Wireless Asset Relayer Transceiver", status: "Online", health: "94ms Latency" },
                { label: "Cryptographic Authorization Payload Token Signer", status: "Active", health: "Verified" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-gray-950/60 rounded-xl border border-gray-800/60 text-xs">
                  <div>
                    <span className="text-gray-300 font-medium block">{item.label}</span>
                    <span className="text-[10px] text-gray-500 font-mono mt-0.5">{item.health}</span>
                  </div>
                  <span className="text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" /> {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}