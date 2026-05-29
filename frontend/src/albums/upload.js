import React, { useState, useCallback } from 'react';

export default function BulkUploadPortal() {
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const fileObjects = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name
    }));
    setPreviews(prev => [...prev, ...fileObjects]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    setPreviews(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl); // Cleanup storage reference pointer
      copy.splice(index, 1);
      return copy;
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-rose-400 to-purple-500 bg-clip-text text-transparent">
          Bulk Media Upload Terminal
        </h2>
        <p className="text-slate-400 text-sm">Drag, preview, compress, and dispatch event assets up to private cloud buckets instantly.</p>
      </div>

      {/* Interactive Drag & Drop Area */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`glass-panel border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-4xl">📥</div>
          <div>
            <p className="text-sm font-bold text-slate-200">Drag and drop your event media folder files right here</p>
            <p className="text-xs text-slate-500 mt-1">Supports high-res JPEG, PNG, and camera output structures up to 50MB.</p>
          </div>
          <label className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 cursor-pointer">
            Select Files From Device
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
            />
          </label>
        </div>
      </div>

      {/* Image Preview Dynamic Grid Layout Container */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400">
              Media Previews ({previews.length} Files Pending Encryption)
            </h3>
            <button className="bg-white text-slate-950 text-xs font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform shadow-xl">
              🚀 Execute Cloud Processing Core
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {previews.map((item, index) => (
              <div key={index} className="glass-panel p-2 rounded-xl group relative overflow-hidden aspect-square border border-white/5">
                <img 
                  src={item.previewUrl} 
                  alt="preview" 
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" 
                />
                <button 
                  onClick={() => removeImage(index)}
                  className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-white/10 text-white hover:text-rose-400 text-xs h-6 w-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono truncate text-white/80">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}