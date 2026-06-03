'use client';

// RELATIVE PATHS FIX: Moving out of components/ and into context/ folder smoothly
import { useRole, UserRole } from "../context/RoleContext";

interface HeaderProps {
  onSignOut: () => void;
}

export default function RoleSimulatorHeader({ onSignOut }: HeaderProps) {
  const { activeRole } = useRole();
  const roles: UserRole[] = ['Admin', 'Photographer', 'Club Member', 'Viewer'];

  const getPillClass = (role: UserRole) => {
    const isActive = activeRole === role;
    
    if (isActive) {
      return "bg-[#6366f1] text-white border-transparent font-medium shadow-md shadow-[#6366f1]/10";
    }
    
    // Sleek layout style matching the inner card buttons in image_928042.png
    return "bg-[#060713] text-[#4b5563] border-[#1e223d] opacity-50 hover:opacity-70 cursor-not-allowed select-none";
  };

  return (
    <div className="bg-[#0b0d1b] border-b border-[#1e223d] px-10 py-4 flex justify-between items-center">
      {/* Left side brand banner */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
          <span className="text-sm text-[#6366f1]">🛡️</span>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f3f4f6]">
            Access Control Terminal
          </h2>
          <p className="text-[11px] text-[#6b7280]">
            Verified Operational Environment Strategy
          </p>
        </div>
      </div>

      {/* Right side controls matching lower layout exactly */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {roles.map((role) => (
            <button
              key={role}
              disabled={true} // 🔒 LOCKEDDOWN: Enforces authenticated permissions rules safely
              className={`px-3.5 py-1.5 rounded-xl text-xs border flex items-center gap-2 transition-all duration-200 font-medium ${getPillClass(role)}`}
            >
              {/* Shield outline icon mimicking the style in the image */}
              <svg 
                className={`w-3.5 h-3.5 ${activeRole === role ? 'text-white' : 'text-[#4b5563]'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {role}
            </button>
          ))}
        </div>

        <button 
          onClick={onSignOut}
          className="border border-[#ef4444]/60 text-[#ef4444] hover:bg-[rgba(239,68,68,0.05)] text-xs font-medium px-4 py-1.5 rounded-xl cursor-pointer transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}