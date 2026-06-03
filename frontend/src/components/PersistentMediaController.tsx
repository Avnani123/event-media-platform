'use client';

// RELATIVE PATHS FIX: Moving out of components/ and into context/ folder smoothly
import { useRole } from "../context/RoleContext";

export default function PersistentMediaController() {
  const { activeRole } = useRole();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0b0d1b] border-t border-[#1e223d] px-10 py-4 flex justify-between items-center z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-[#060713] border border-[#1e223d] flex justify-center items-center font-bold text-[#6366f1]">
          N
        </div>
        <div>
          <h4 className="text-xs font-semibold mb-0.5">Empty Album Workspace</h4>
          <p className="text-[11px] text-[#6b7280]">Active Sandbox {activeRole} Context Stream</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="bg-transparent border-none text-[#6b7280] hover:text-[#f3f4f6] text-xs cursor-pointer">⏮️</button>
        <button className="bg-white text-black w-9 h-9 rounded-full flex justify-center items-center font-bold text-xs cursor-pointer">▶️</button>
        <button className="bg-transparent border-none text-[#6b7280] hover:text-[#f3f4f6] text-xs cursor-pointer">⏭️</button>
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-transparent border border-[#1e223d] text-[#6b7280] hover:text-[#f3f4f6] text-[11px] font-semibold px-3 py-1.5 rounded-md">💬 Comment</button>
        <button className="bg-transparent border border-[#1e223d] text-[#6b7280] hover:text-[#f3f4f6] text-[11px] font-semibold px-3 py-1.5 rounded-md">📤 Share</button>
        <span className="text-[#6b7280] hover:text-[#f3f4f6] text-sm cursor-pointer ml-1">⚙️</span>
      </div>
    </div>
  );
}