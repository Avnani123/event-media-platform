import React from 'react';

interface Notification {
  id: string | number;
  message: string;
}

interface NotificationCenterProps {
  notifications?: Notification[]; // Made optional to avoid crashes
  onRemoveNotification: (id: string | number) => void;
}

export default function NotificationCenter({ notifications = [], onRemoveNotification }: NotificationCenterProps) {
  // Defensive guard loops
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((n) => {
        // Safeguard against malformed items in state
        if (!n || !n.id) return null; 
        
        return (
          <div
            key={n.id}
            className="glass-panel p-3.5 rounded-xl border border-cyan-500/30 bg-slate-950/90 backdrop-blur-md shadow-xl flex items-start gap-3 text-xs transition-all duration-300"
          >
            <div className="h-2 w-2 rounded-full bg-cyan-400 mt-1.5 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            
            <div className="flex-1 space-y-0.5">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-200">Terminal Operational Broadcast</span>
                <button 
                  onClick={() => onRemoveNotification(n.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors pl-2 font-bold text-sm"
                  aria-label="Close notification"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-normal">{n.message || ''}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}