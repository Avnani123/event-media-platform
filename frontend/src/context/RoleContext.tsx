'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Explicitly defined allowed user access scopes
export type UserRole = 'Admin' | 'Photographer' | 'Club Member' | 'Viewer';

interface RoleContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  // 1. Initialize state with a stable default role ('Viewer' or 'Admin')
  // This guarantees identical HTML output on both server and client during compilation.
  const [activeRole, setActiveRole] = useState<UserRole>('Admin');

  // 2. Safely sync state with sessionStorage ONLY after the layout engine mounts on the browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedRole = sessionStorage.getItem('vault_active_role') as UserRole;
        // Verify that the saved value is one of our valid strict types
        if (savedRole && ['Admin', 'Photographer', 'Club Member', 'Viewer'].includes(savedRole)) {
          setActiveRole(savedRole);
        }
      } catch (error) {
        console.error("Failed to restore session fallback credentials:", error);
      }
    }
  }, []);

  // 3. Define a wrapper function that updates state and seamlessly updates cache storage together
  const handleSetActiveRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vault_active_role', newRole);
    }
  };

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole: handleSetActiveRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within an operational RoleProvider tree.');
  }
  return context;
}