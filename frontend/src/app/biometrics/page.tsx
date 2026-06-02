'use client';
import React, { useState } from 'react';

interface Asset {
  id: number;
  title: string;
  category: string;
  url: string;
  summary_text: string;
  ai_tags: string[];
}

export default function BiometricsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<Asset[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSearchFaces = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setHasSearched(false);
    
    const formData = new FormData();
    formData.append('referenceSelfie', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/media/face-match', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        setMatchedPhotos(data.matchingPhotos);
        setHasSearched(true);
      } else {
        alert(data.error || 'Biometric analysis execution failed.');
      }
    } catch (err) {
      console.error('Fatal facial pipeline verification drop:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Biometric Finder Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload a reference selfie image to isolate matching photos across our media network.
          </p>
        </header>

        {/* Action Panel Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-[#13151a] p-6 rounded-xl border border-gray-800 flex flex-col justify-between h-72">
            <div>
              <h3 className="text-md font-semibold mb-2">1. Select Reference Selfie</h3>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
            </div>
            
            {previewUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-emerald-500 mt-4 bg-gray-900">
                <img src={previewUrl} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="bg-[#13151a] p-6 rounded-xl border border-gray-800 flex flex-col justify-between h-72">
            <div>
              <h3 className="text-md font-semibold mb-2">2. Cross-Reference Index</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Gemini 2.5 Flash will isolate and extract structural data patterns, cross-referencing your profile target directly through the repository files.
              </p>
            </div>

            <button
              onClick={handleSearchFaces}
              disabled={!selectedFile || isLoading}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                !selectedFile || isLoading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-90 shadow-lg shadow-emerald-900/20'
              }`}
            >
              {isLoading ? 'Scanning Platform Stack...' : 'Find Matches'}
            </button>
          </div>
        </div>

        {/* Personalized Matching Results Grid */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>Personalized Gallery Matches</span>
            {hasSearched && (
              <span className="text-xs font-normal bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-800">
                {matchedPhotos.length} Found
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#13151a] rounded-xl border border-gray-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4" />
              <p className="text-xs text-gray-400 animate-pulse">Running full biometric validation matrix scans...</p>
            </div>
          ) : hasSearched && matchedPhotos.length === 0 ? (
            <div className="text-center py-24 bg-[#13151a] rounded-xl border border-gray-800">
              <p className="text-sm text-gray-400">No verification points identified. Try a clearer portrait frame.</p>
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-24 bg-[#13151a]/40 rounded-xl border border-gray-800/50 border-dashed">
              <p className="text-sm text-gray-500">Initiate a selfie validation run to view personalized results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedPhotos.map((photo) => (
                <div key={photo.id} className="bg-[#13151a] rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200 group">
                  <div className="relative aspect-video bg-gray-950 overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt={photo.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-emerald-950/90 text-emerald-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-800 backdrop-blur-xs">
                      {photo.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm line-clamp-1">{photo.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[2rem] leading-relaxed">
                      {photo.summary_text}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {photo.ai_tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-[#1a1d24] text-gray-400 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}