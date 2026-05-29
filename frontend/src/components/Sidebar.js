import React from 'react';

export default function Sidebar() {
  const menus = [
    { name: 'Home Portal', icon: '🔮', active: true },
    { name: 'Event Catalogs', icon: '🎪' },
    { name: 'AI Face Find', icon: '👤' },
    { name: 'Analytics Terminal', icon: '📊' },
    { name: 'Private Records', icon: '🔒' }
  ];

  return (
    <aside className="w-64 bg-slate-950 min-h-screen border-r border-white/5 p-6 hidden md:flex flex-col justify-between shrink-0">
      <div className="space-y-8">
        {/* Top Branding Section */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-xl">💿</span>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase text-white">MediaHub</h1>
            <p className="text-[9px] font-mono text-slate-500">v2.0.26 ENGINE</p>
          </div>
        </div>

        {/* Dynamic Navigation Options */}
        <nav className="space-y-1">
          <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase block px-2 mb-2">Browse Studio</span>
          {menus.map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${item.active ? 'bg-gradient-to-r from-rose-500/10 to-transparent text-rose-400 border-l-2 border-rose-500' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Identity Matrix */}
      <div className="glass-panel p-3 rounded-xl border border-white/5 bg-slate-900/20">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></div>
          <p className="text-[10px] font-mono text-slate-400">AWS S3 Connection: Online</p>
        </div>
      </div>
    </aside>
  );
}