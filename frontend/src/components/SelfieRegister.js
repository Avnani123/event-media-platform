import React, { useState } from 'react';

export default function SelfieRegister({ userId = 4 }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [syncing, setSyncing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadSelfieProfile = async () => {
    if (!file) return setStatus({ type: 'error', msg: 'Please select an image file first.' });
    
    setSyncing(true);
    setStatus({ type: 'info', msg: 'Processing bio-matrix vectors...' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    try {
      // Direct integration pipeline dispatch hitting the Python FastAPI AI Cluster directly
      const response = await fetch('http://localhost:8000/api/ai/register-face', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setStatus({ type: 'success', msg: 'Biometric face token successfully registered!' });
      } else {
        setStatus({ type: 'error', msg: data.detail || 'Biometric mapping validation failed.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'AI Compute engine connection broken.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4 max-w-md">
      <div>
        <h4 className="text-sm font-bold text-slate-200 tracking-tight flex items-center gap-2">
          👤 AI Smart Match Enrollment
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">Register a clear reference photo of yourself to let the AI notify you whenever you appear in cluster photoshoots.</p>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <div className="h-20 w-20 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-slate-600 relative overflow-hidden shrink-0">
          {preview ? (
            <img src={preview} alt="Selfie Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">📸</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input 
            type="file" 
            accept="image/*" 
            id="selfie-file"
            onChange={handleFileChange}
            className="hidden" 
          />
          <label 
            htmlFor="selfie-file"
            className="block text-center w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 cursor-pointer transition-all"
          >
            Choose Reference Image
          </label>
          
          <button
            onClick={uploadSelfieProfile}
            disabled={syncing}
            className="w-full px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/20"
          >
            {syncing ? 'Analyzing Vectors...' : 'Enroll Face Profile'}
          </button>
        </div>
      </div>

      {status.msg && (
        <div className={`p-2.5 rounded-lg text-[11px] font-mono border ${
          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          status.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        }`}>
          {status.msg}
        </div>
      )}
    </div>
  );
}