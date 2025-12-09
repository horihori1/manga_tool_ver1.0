import React, { useState, useRef } from 'react';
import { UploadIcon, SparklesIcon, DownloadIcon, ImageIcon, RefreshIcon, LayersIcon, TrashIcon, PlusIcon } from './components/Icons';
import { generateMangaPanel } from './services/geminiService';

const App: React.FC = () => {
  // State
  // Now stores an array of character sheet images
  const [characterImages, setCharacterImages] = useState<string[]>([]);
  const [poseImage, setPoseImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Refs
  const characterInputRef = useRef<HTMLInputElement>(null);
  const poseInputRef = useRef<HTMLInputElement>(null);

  // Helper to read file to base64
  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle Character File Upload (Multiple)
  const handleCharacterFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await readFile(file);
          newImages.push(dataUrl);
        } catch (e) {
          console.error("Failed to read file", file.name);
        }
      }
    }
    
    if (newImages.length > 0) {
      setCharacterImages(prev => [...prev, ...newImages]);
    }
  };

  // Handle Pose File Upload (Single)
  const handlePoseFile = async (file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      const dataUrl = await readFile(file);
      setPoseImage(dataUrl);
      setError(null);
    } else if (file) {
      setError("Please upload a valid image file.");
    }
  };

  // Drag & Drop Handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  
  const onDropCharacters = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    handleCharacterFiles(e.dataTransfer.files);
  };

  const onDropPose = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    handlePoseFile(e.dataTransfer.files?.[0]);
  };

  const removeCharacterImage = (index: number) => {
    setCharacterImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Generation
  const handleGenerate = async () => {
    if (characterImages.length === 0) {
      setError("Please upload at least one character sheet.");
      return;
    }
    
    if (!poseImage) {
      setError("Please upload a pose/composition reference.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const results = await generateMangaPanel(characterImages, poseImage, customPrompt);
      setGeneratedImages(results);
    } catch (err: any) {
      setError(err.message || "Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `manga-panel-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-2 rounded-lg">
              <LayersIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
              MangaMaker AI
            </h1>
          </div>
          <div className="hidden sm:block text-slate-400 text-sm">
            Powered by Gemini Nano Banana
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 flex items-center animate-pulse">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: Character Sheets (Multiple) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs">1</span>
                Character Sheets
              </h2>
              {characterImages.length > 0 && (
                <button 
                  onClick={() => setCharacterImages([])}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Drop Zone */}
            <div 
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
                ${characterImages.length > 0 ? 'border-indigo-500/50 bg-slate-800 p-4' : 'aspect-square border-slate-700 bg-slate-800/50 hover:border-indigo-400 hover:bg-slate-800'}
              `}
              onDragOver={onDragOver}
              onDrop={onDropCharacters}
            >
              <input 
                type="file" 
                ref={characterInputRef}
                onChange={(e) => handleCharacterFiles(e.target.files)} 
                accept="image/*" 
                multiple
                className="hidden" 
              />
              
              {characterImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {characterImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                      <img src={img} alt={`Char ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeCharacterImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* Add Button in Grid */}
                  <div 
                    onClick={() => characterInputRef.current?.click()}
                    className="aspect-square rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                  >
                     <PlusIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              ) : (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => characterInputRef.current?.click()}
                >
                  <div className="p-4 rounded-full bg-slate-700/50 mb-4 group-hover:scale-110 transition-transform">
                    <UploadIcon className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-slate-300 font-medium text-center">Upload Character Sheets</p>
                  <p className="text-slate-500 text-sm mt-1 text-center">Drag multiple images here</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
               <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Manga Context (Optional)</label>
               <input 
                 type="text" 
                 value={customPrompt}
                 onChange={(e) => setCustomPrompt(e.target.value)}
                 placeholder="e.g., Shonen style, 1920x1080 wallpaper, dramatic..."
                 className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder-slate-600 p-0"
               />
            </div>
          </section>

          {/* COLUMN 2: Pose/Composition Reference */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs">2</span>
                Pose Reference
              </h2>
              {poseImage && (
                <button 
                  onClick={() => setPoseImage(null)}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div 
              className={`
                relative group aspect-video rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
                ${poseImage ? 'border-pink-500/50 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-pink-400 hover:bg-slate-800'}
              `}
              onDragOver={onDragOver}
              onDrop={onDropPose}
            >
              <input 
                type="file" 
                ref={poseInputRef}
                onChange={(e) => handlePoseFile(e.target.files?.[0])} 
                accept="image/*" 
                className="hidden" 
              />
              
              {poseImage ? (
                <>
                  <img 
                    src={poseImage} 
                    alt="Pose Ref" 
                    className="w-full h-full object-contain p-2" 
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => poseInputRef.current?.click()}
                      className="px-4 py-2 bg-white text-slate-900 rounded-full font-medium hover:bg-pink-50 transition-colors flex items-center gap-2"
                    >
                      <RefreshIcon className="w-4 h-4" /> Change
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => poseInputRef.current?.click()}
                >
                  <div className="p-4 rounded-full bg-slate-700/50 mb-4 group-hover:scale-110 transition-transform">
                    <LayersIcon className="w-8 h-8 text-pink-400" />
                  </div>
                  <p className="text-slate-300 font-medium">Pose / Composition</p>
                  <p className="text-slate-500 text-sm mt-1">Upload a photo or sketch</p>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 bg-slate-800/30 p-3 rounded-lg">
                <strong>Tip:</strong> The output will attempt to match the pose and camera angle of this image in <strong>1920x1080 (16:9)</strong> format.
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || characterImages.length === 0 || !poseImage}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 transition-all mt-auto
                ${isGenerating || characterImages.length === 0 || !poseImage
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-500 to-pink-600 hover:from-indigo-400 hover:to-pink-500 text-white transform hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Drawing 10 Variations...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate 10 Patterns
                </>
              )}
            </button>
          </section>

          {/* COLUMN 3: Result */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs">3</span>
              Manga Results (1920x1080)
            </h2>

            <div className="flex-1 min-h-[600px] bg-slate-800/30 rounded-xl border border-slate-700/50 p-2 overflow-y-auto">
              
              {isGenerating && generatedImages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 animate-pulse">
                    The AI Assistant is inking the panels...<br/>
                    <span className="text-xs text-slate-500">Generating 10 variations in parallel</span>
                  </p>
                </div>
              )}

              {!isGenerating && generatedImages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                   <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-500">Generated variations will appear here.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generatedImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800 aspect-video">
                    <img 
                      src={img} 
                      alt={`Variation ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-black/60 to-transparent w-full justify-end">
                      <span className="text-xs font-mono text-white/80 bg-black/50 px-2 py-1 rounded">#{idx + 1}</span>
                      <button 
                        onClick={() => handleDownload(img, idx)}
                        className="p-1.5 bg-white text-slate-900 rounded-lg hover:bg-indigo-50 shadow-lg"
                        title="Download"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;