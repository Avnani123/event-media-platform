"use client";

import React, { useState } from 'react';
import { Folder, Search, FileText, LayoutGrid, Heart, ShieldCheck, HelpCircle, Key, RefreshCw, Eye } from 'lucide-react';
import { useRole } from "../context/RoleContext";

interface SharedCampaignCollection {
  id: string;
  title: string;
  owningCommittee: string;
  totalAllocatedAssets: number;
  lastSyncTimestamp: string;
}

export default function ClubMemberDashboard() {
  const { activeRole } = useRole();
  const [searchFilter, setSearchFilter] = useState<string>("");
  
  const [collections] = useState<SharedCampaignCollection[]>(
    [
      { id: "c-01", title: "Nexus National Hackathon Promotion Kit", owningCommittee: "Coding Club Core", totalAllocatedAssets: 42, lastSyncTimestamp: "2 hours ago" },
      { id: "c-02", title: "Aesthetic Design Graphics Master Dump", owningCommittee: "Media Graphics Syndicate", totalAllocatedAssets: 19, lastSyncTimestamp: "1 day ago" },
      { id: "c-03", title: "Freshers Induction Gala Archive", owningCommittee: "Cultural Execution Branch", totalAllocatedAssets: 108, lastSyncTimestamp: "May 2026" }
    ]
  );

  return (
    <div className="min-h-screen bg-[#0b0c16] text-white p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* Upper Identity Deck */}
        <div className="bg-gradient-to-r from-[#14152b] to-[#0c0d1a] border border-gray-800/80 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
              Role Scoped Clearance: {activeRole}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Club Communications Hub</h1>
            <p className="text-xs text-gray-400 mt-0.5">Access public press repositories, query global media pools, and compile graphics packages for organizational deployment.</p>
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search shared campaign arrays..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Dashboard Dynamic Matrix Viewport Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Structural Display Panel Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Authorized Asset Distribution Pools</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {collections
                .filter(c => c.title.toLowerCase().includes(searchFilter.toLowerCase()) || c.owningCommittee.toLowerCase().includes(searchFilter.toLowerCase()))
                .map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800/80 hover:border-indigo-500/30 rounded-xl p-5 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                        <Folder className="w-4 h-4 fill-indigo-400/10" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-100 leading-snug tracking-tight group-hover:text-indigo-300 transition-colors">{campaign.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-1">Committee: <strong className="text-gray-400 font-medium">{campaign.owningCommittee}</strong></p>
                    </div>

                    <div className="border-t border-gray-800/60 pt-3 mt-4 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>📦 {campaign.totalAllocatedAssets} Verified Items</span>
                      <span className="text-gray-600">{campaign.lastSyncTimestamp}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Side Reference Clearance Policy Controls Panel Column */}
          <div className="space-y-6">
            <div className="bg-gray-900/20 border border-gray-800/60 rounded-xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Policy Security Context
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                As an authenticated <strong className="text-gray-200 font-semibold">{activeRole}</strong>, you possess systemic authorization indices allowing you to browse and pull from public distribution tracks.
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-800/60 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Public Asset Downstreams</span>
                  <span className="text-emerald-400 font-mono font-bold">GRANTED</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Raw S3 Bucket Storage Ingestion</span>
                  <span className="text-red-400 font-mono font-bold">RESTRICTED</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Secure Watermarked Distribution Logs</span>
                  <span className="text-emerald-400 font-mono font-bold">AUTOMATIC</span>
                </div>
              </div>
            </div>

            {/* Privilege Upgrade Interface Trigger Form Mockup */}
            <div className="bg-gradient-to-br from-[#121124] to-[#0a0a14] border border-indigo-500/10 rounded-xl p-5 text-center">
              <Key className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-gray-200">Require Creative Elevation?</h4>
              <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">Submit an instantaneous cryptographic handshake profile update request to active Admin monitors.</p>
              <button 
                onClick={() => alert("Privilege adjustment tracking payload synchronized inside live platform handshake buffers. Validation pending admin review.")}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all active:scale-95 shadow cursor-pointer"
              >
                Request Creator Clearance Scope
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}