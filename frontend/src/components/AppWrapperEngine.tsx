'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
// RELATIVE PATHS FIX: Go up out of components/ and into context/ folder cleanly
import { useRole } from "../context/RoleContext"; 
import RoleSimulatorHeader from "./RoleSimulatorHeader";
import PersistentMediaController from "./PersistentMediaController";

export default function AppWrapperEngine({ children }: { children: React.ReactNode }) {
  const { activeRole, setActiveRole } = useRole();
  const pathname = usePathname();
  
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedMockUser, setSelectedMockUser] = useState<string>('admin');

  // 1. Sync global context authentication flag on mount and active role transitions
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedRole = sessionStorage.getItem('vault_active_role');
      
      // If a role exists globally or in session storage, automatically validate this wrapper
      if (activeRole || savedRole) {
        setIsAuthenticated(true);
        if (savedRole && !activeRole) {
          setActiveRole(savedRole as any);
        }
      }
    }
  }, [activeRole, setActiveRole]);

  const executeLoginHandshake = () => {
    let targetedRole: 'Admin' | 'Photographer' | 'Club Member' | 'Viewer' = 'Admin';
    
    if (selectedMockUser === 'admin') targetedRole = 'Admin';
    else if (selectedMockUser === 'photographer') targetedRole = 'Photographer';
    else if (selectedMockUser === 'member') targetedRole = 'Club Member';
    else targetedRole = 'Viewer';

    setActiveRole(targetedRole);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vault_active_role', targetedRole);
    }
    setIsAuthenticated(true);
  };

  const executeSignOutHandshake = () => {
    // Force reset the state to clear the authenticated session
    setActiveRole(null as any);
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vault_active_role');
    }
    setIsAuthenticated(false);
  };

  // Prevent Pre-rendering / Hydration frame layout mismatch dropping
  if (!isMounted) {
    return <div className="min-h-screen bg-[#060713]" />;
  }

  // ─── CRITICAL BYPASS ───
  // If the active URL path is explicitly "/login", bypass the default interceptor 
  // block and allow the new custom login view to manage the interface state directly.
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Fallback interface for regular protected dashboard pages when unauthenticated
  if (!isAuthenticated && !activeRole) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#060713] px-4">
        <div className="w-full max-w-[420px] bg-[#0b0d1b] border border-[#1e223d] rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#f3f4f6] mb-1">Document & Media Console</h2>
            <p className="text-xs text-[#6b7280]">Please simulate a profile authentication login handshake.</p>
          </div>

          <div className="flex flex-col gap-2 mb-5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-[#6b7280]">Select Profile User</label>
            <select 
              value={selectedMockUser}
              onChange={(e) => setSelectedMockUser(e.target.value)}
              className="w-full bg-[#060713] border border-[#1e223d] p-3 rounded-lg text-sm text-[#f3f4f6] outline-none cursor-pointer focus:border-[#6366f1]"
            >
              <option value="admin">Alex Rivera (Role: Admin)</option>
              <option value="photographer">Jordan Vance (Role: Photographer)</option>
              <option value="member">Sarah Jenkins (Role: Club Member)</option>
              <option value="viewer">Guest Visitor (Role: Viewer)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-[#6b7280]">Security Phrase Scope</label>
            <input 
              type="password" 
              value="••••••••••••••••" 
              disabled 
              className="w-full bg-[#060713] border border-[#1e223d] p-3 rounded-lg text-sm text-[#4b5563] outline-none select-none"
            />
          </div>

          <button 
            onClick={executeLoginHandshake}
            className="w-full bg-[#6366f1] text-white text-sm font-semibold p-3.5 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
          >
            Sign In to Sandbox Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 relative">
      <RoleSimulatorHeader onSignOut={executeSignOutHandshake} />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-10 py-8">
        {children}
      </main>
      <PersistentMediaController />
    </div>
  );
}