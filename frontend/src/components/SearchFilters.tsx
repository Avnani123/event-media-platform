import React from 'react';

// 1. Define the missing TypeScript interface for props
interface SearchFiltersProps {
  onFilterChange: (key: string, value: string) => void;
  filters: {
    search: string;
    category: string;
    sortBy: string;
    tag: string;
  };
}

// 2. Type-annotate your component using the interface
export default function SearchFilters({ onFilterChange, filters }: SearchFiltersProps) {
  const categories = ['Fest', 'Competition', 'Workshop', 'Photoshoot', 'Trip'];
  const popularAiTags = ['Main Stage', 'Crowd', 'Presentation', 'Tech', 'Outdoor', 'Abstract', 'Digital', 'Pixelated'];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Text Input Search Input Field */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Search Workspace</label>
          <input 
            type="text"
            placeholder="Search by title, asset name, or AI tags..."
            value={filters?.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Category Context Selector Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Category Pipeline</label>
          <select 
            value={filters?.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Dynamic Metrics Sorting Rule Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Sort Execution Matrix</label>
          <select 
            value={filters?.sortBy || 'date'}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="date">Upload Date (Newest)</option>
            <option value="likes">Popularity (Most Liked)</option>
            <option value="name">Asset Name (A-Z)</option>
          </select>
        </div>

      </div>

      {/* AI Smart Tags Filter Bar Row */}
      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mr-2">AI Smart Tags:</span>
        <button
          type="button"
          onClick={() => onFilterChange('tag', '')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${!filters?.tag ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
        >
          All Tags
        </button>
        {popularAiTags.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => onFilterChange('tag', tag)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${filters?.tag === tag ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
          >
            🏷️ {tag}
          </button>
        ))}
      </div>
    </div>
  );
}