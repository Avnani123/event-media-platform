"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, Network, Server, Cpu, CheckCircle2, Terminal, X, Activity, Disc } from 'lucide-react';
import { useRole } from "../../context/RoleContext";

const PREDEFINED_USERS = [
  { email: 'admin@test.com', password: '123', role: 'Admin' },
  { email: 'photo@test.com', password: '123', role: 'Photographer' },
  { email: 'member@test.com', password: '123', role: 'Club Member' },
  { email: 'viewer@test.com', password: '123', role: 'Viewer' }
];

export default function SecurityPortalAuth() {
  const router = useRouter();
  const { setActiveRole } = useRole();
  
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPrivilegeRole, setSelectedPrivilegeRole] = useState<'Admin' | 'Photographer' | 'Club Member' | 'Viewer'>('Admin');

  // Request Access Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestedRole, setRequestedRole] = useState('Photographer');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('vault_users')) {
        localStorage.setItem('vault_users', JSON.stringify(PREDEFINED_USERS));
      }
      if (!localStorage.getItem('vault_pending_requests')) {
        localStorage.setItem('vault_pending_requests', JSON.stringify([]));
      }
    }
  }, []);

  const applySandboxPreset = (email: string, pass: string, role: 'Admin' | 'Photographer' | 'Club Member' | 'Viewer') => {
    setUsername(email);
    setPassword(pass);
    setSelectedPrivilegeRole(role);
  };

  const handlePortalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const dynamicUserDB = JSON.parse(localStorage.getItem('vault_users') || JSON.stringify(PREDEFINED_USERS));
      const foundUser = dynamicUserDB.find(
        (u: any) => u.email.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (foundUser || (username.trim() !== "" && password.trim() !== "")) {
        const structuralAssignedRole = foundUser ? foundUser.role : selectedPrivilegeRole;
        
        setActiveRole(structuralAssignedRole);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vault_active_role', structuralAssignedRole);
        }

        setIsLoading(false);
        router.push('/gallery');
      } else {
        setIsLoading(false);
        setErrorMessage('CRITICAL AUTH ERROR: Access Key or Identity mismatch inside cluster.');
      }
    }, 1200);
  };

  const handleAccessRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);

    setTimeout(() => {
      // Pull dynamic system buffer array safely
      const currentRequests = JSON.parse(localStorage.getItem('vault_pending_requests') || '[]');
      
      const newRequest = {
        id: `req-${Date.now()}`,
        name: requestName,
        email: requestEmail,
        role: requestedRole, // Matches dashboard target criteria parser
        reason: requestReason,
        timestamp: 'Just now'
      };
      
      const updatedList = [newRequest, ...currentRequests];
      localStorage.setItem('vault_pending_requests', JSON.stringify(updatedList));
      
      // CRITICAL FIX: Force cross-component storage event to push real-time re-renders
      window.dispatchEvent(new Event('storage'));

      setIsSubmittingRequest(false);
      setRequestSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setRequestSuccess(false);
        setRequestEmail('');
        setRequestName('');
        setRequestReason('');
      }, 1500);
    }, 1000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen w-full bg-[#03040b] flex font-sans text-gray-200 antialiased overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none z-0"></div>

      {/* LEFT PANEL */}
      <div className="w-full md:w-[45%] bg-[#060713]/80 backdrop-blur-xl px-8 py-8 sm:px-14 flex flex-col justify-between border-r border-indigo-500/10 relative z-20 shrink-0 shadow-[15px_0_50px_rgba(0,0,0,0.7)] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-mono text-sm font-bold tracking-[0.2em] bg-gradient-to-r from-indigo-400 via-indigo-200 to-white bg-clip-text text-transparent">MEDIA.VAULT</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400/80 bg-indigo-500/5 border border-indigo-500/20 px-3 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="tracking-wider">SECURE NODE CORE</span>
          </div>
        </div>

        <div className="w-full max-w-[390px] mx-auto my-auto py-4 space-y-5 relative">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-1 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              Initialize Access
            </h2>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Log in with assigned tokens, or choose a sandbox preset profile setup for targeted dynamic platform verification testing below.
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl font-mono text-[10px] text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handlePortalLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-indigo-300/70 tracking-widest uppercase">Identity Link / Email</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 h-4 w-4 text-indigo-400/40" />
                <input
                  type="email"
                  required
                  placeholder="identity@matrix.io"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0a0c20]/60 border border-indigo-500/10 focus:border-indigo-500/50 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-indigo-300/70 tracking-widest uppercase">Security Passphrase</label>
                <span className="text-[9px] text-gray-500 font-mono">Context: <b className="text-indigo-400">123</b></span>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-indigo-400/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0c20]/60 border border-indigo-500/10 focus:border-indigo-500/50 rounded-xl pl-11 pr-11 py-3 text-xs text-white focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-indigo-400/40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-0.5">
              <label className="text-[9px] font-bold text-indigo-300/70 tracking-widest uppercase block">Assign Token Privilege Level</label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['Admin', 'Photographer', 'Club Member', 'Viewer'] as const).map((role) => {
                  const isSelected = selectedPrivilegeRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedPrivilegeRole(role)}
                      className={`p-3 rounded-xl text-left border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[68px] relative overflow-hidden group/btn ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                          : 'bg-[#0a0b16]/30 border-indigo-950/40 text-gray-400 hover:border-indigo-500/20 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full relative z-10">
                        <span className="font-extrabold text-[11px] tracking-wide">{role}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <span className="text-[9px] text-gray-500 font-medium tracking-normal relative z-10">
                        {role === 'Admin' && 'Root Control Scope'}
                        {role === 'Photographer' && 'Direct Media Ingest'}
                        {role === 'Club Member' && 'Private Gallery View'}
                        {role === 'Viewer' && 'Public Read Only'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-2.5 bg-[#0a0c20]/40 border border-indigo-500/5 rounded-xl space-y-1">
              <span className="text-[8px] font-mono text-gray-500 block uppercase tracking-wider">Available Sandbox Key Profiles (Pass: 123)</span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                <button type="button" onClick={() => applySandboxPreset('admin@test.com', '123', 'Admin')} className={`text-left p-1.5 rounded border transition-colors ${username === 'admin@test.com' ? 'bg-indigo-500/10 border-indigo-500/40 text-white' : 'bg-indigo-950/10 border-indigo-950/40 text-indigo-400/80 hover:border-indigo-500/20'}`}>admin@test.com</button>
                <button type="button" onClick={() => applySandboxPreset('photo@test.com', '123', 'Photographer')} className={`text-left p-1.5 rounded border transition-colors ${username === 'photo@test.com' ? 'bg-purple-500/10 border-purple-500/40 text-white' : 'bg-indigo-950/10 border-indigo-950/40 text-purple-400/80 hover:border-indigo-500/20'}`}>photo@test.com</button>
                <button type="button" onClick={() => applySandboxPreset('member@test.com', '123', 'Club Member')} className={`text-left p-1.5 rounded border transition-colors ${username === 'member@test.com' ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-indigo-950/10 border-indigo-950/40 text-emerald-400/80 hover:border-indigo-500/20'}`}>member@test.com</button>
                <button type="button" onClick={() => applySandboxPreset('viewer@test.com', '123', 'Viewer')} className={`text-left p-1.5 rounded border transition-colors ${username === 'viewer@test.com' ? 'bg-white/5 border-white/10 text-white' : 'bg-indigo-950/10 border-indigo-950/40 text-gray-500 hover:border-indigo-500/20'}`}>viewer@test.com</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-xs tracking-widest uppercase rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Disc className="w-3.5 h-3.5 text-white animate-spin" />
                  <span className="font-mono text-[9px] tracking-widest">CONNECTING TO GATEWAY...</span>
                </div>
              ) : (
                <>
                  <span className="tracking-widest">Initialize Terminal Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <span className="text-gray-500 text-xs">No active system slot? </span>
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-400 font-bold text-xs hover:text-indigo-300 transition-colors underline bg-transparent border-none cursor-pointer tracking-wide"
            >
              Request Access from Administrator
            </button>
          </div>
        </div>

        <div className="text-gray-600 text-[9px] font-mono pt-2 border-t border-indigo-500/10 flex justify-between items-center tracking-widest">
          <span>© SYSTEM CORE MATRIX CLUSTER.</span>
          <span className="text-indigo-500/40">SECURE_v2.4.1</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden md:flex flex-1 md:w-[55%] bg-[#030409] relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1129_1px,transparent_1px),linear-gradient(to_bottom,#0f1129_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
        
        <div className="relative w-full max-w-[530px] bg-gradient-to-b from-[#090b1e]/90 to-[#050611]/95 border border-indigo-500/20 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-6">
          <div className="flex justify-between items-center">
            <div className="bg-[#090b22] border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-gray-400 flex items-center gap-2.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin [animation-duration:8s]" />
              <span className="tracking-wider">aws-s3-node: <span className="text-emerald-400 font-bold">ONLINE</span></span>
            </div>
            <div className="bg-[#090b22] border border-purple-500/20 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-gray-400 flex items-center gap-2.5">
              <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="tracking-wider">pipeline: <span className="text-purple-400 font-bold">12ms</span></span>
            </div>
          </div>

          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Server className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">Decentralized Storage Ecosystem</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto font-medium">
                Automated secure orchestration core processing live objects, distributed multi-region media assets, and key privileges dynamically.
              </p>
            </div>
          </div>

          <div className="bg-[#03040a]/90 rounded-2xl p-5 border border-indigo-500/10 font-mono text-[10px] text-indigo-300/90 space-y-2.5">
            <div className="flex items-center gap-2 text-gray-500 pb-2 border-b border-white/[0.04] mb-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-400/60" />
              <span className="tracking-widest text-[9px] font-bold">LIVE TELEMETRY WORKSPACE INFRASTRUCTURE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 tracking-wider">&gt;_ system_cluster_matrix:</span>
              <span className="text-emerald-400 font-bold">CORE_READY</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 tracking-wider">&gt;_ indexed_active_objects:</span>
              <span className="text-purple-300 font-bold">4,912 ASSETS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACCESS REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#070918]/95 border border-indigo-500/30 rounded-2xl p-6 relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" /> Request System Slot
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
            </div>

            {requestSuccess ? (
              <div className="py-8 text-center space-y-2 text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p>Request logged into Admin Pipeline Buffer queue.</p>
              </div>
            ) : (
              <form onSubmit={handleAccessRequestSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-indigo-300/70 uppercase block mb-1">Handle Name</label>
                  <input type="text" required placeholder="Jane Doe" value={requestName} onChange={(e) => setRequestName(e.target.value)} className="w-full bg-[#0a0b16] border border-indigo-500/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500/40" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-indigo-300/70 uppercase block mb-1">Target Identity Email</label>
                  <input type="email" required placeholder="jane@test.com" value={requestEmail} onChange={(e) => setRequestEmail(e.target.value)} className="w-full bg-[#0a0b16] border border-indigo-500/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500/40" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-indigo-300/70 uppercase block mb-1">Requested Privilege Access</label>
                  <select value={requestedRole} onChange={(e) => setRequestedRole(e.target.value)} className="w-full bg-[#0a0b16] border border-indigo-500/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                    <option value="Photographer">Photographer</option>
                    <option value="Club Member">Club Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-indigo-300/70 uppercase block mb-1">Justification Reason</label>
                  <textarea required rows={2} placeholder="Why do you need a slot?" value={requestReason} onChange={(e) => setRequestReason(e.target.value)} className="w-full bg-[#0a0b16] border border-indigo-500/10 rounded-xl px-4 py-2 text-xs text-white outline-none resize-none focus:border-indigo-500/40" />
                </div>
                <button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center transition-colors">
                  {isSubmittingRequest ? 'Transmitting...' : 'Send to Admin Buffer'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}