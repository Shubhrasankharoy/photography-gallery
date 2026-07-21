import React, { useState, useRef } from 'react';

export function FaceSearchUploader({ onSearch, isSearching }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        alert('Please drop an image file.');
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    onSearch(selectedFile);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        id="face-uploader-input"
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/15'
              : 'border-zinc-200 hover:border-zinc-350 bg-white hover:bg-zinc-55 dark:border-zinc-800 dark:hover:border-zinc-700 dark:bg-zinc-950'
          }`}
        >
          <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Upload Target Image</h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium tracking-wide uppercase mt-1">
            Drag & drop or click to browse
          </p>
          <p className="text-[10px] text-zinc-400 font-light mt-3 max-w-xs leading-relaxed">
            Upload a reference portrait to automatically detect the central region and search for visual similarities.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/85 dark:bg-zinc-950 flex flex-col items-center gap-5">
          <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-zinc-150 dark:border-zinc-900 bg-zinc-100 shadow-inner">
            <img
              src={previewUrl}
              alt="Search reference crop preview"
              className="h-full w-full object-cover"
            />
            {/* Cropping visual overlay (representing center 60% processed region) */}
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
              <div className="relative h-3/5 w-3/5 border-2 border-indigo-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.2)]">
                {/* Visual Corner Highlights */}
                <span className="absolute -top-1 -left-1 h-3.5 w-3.5 border-t-2 border-l-2 border-white rounded-tl-sm"></span>
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 border-t-2 border-r-2 border-white rounded-tr-sm"></span>
                <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 border-b-2 border-l-2 border-white rounded-bl-sm"></span>
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 border-b-2 border-r-2 border-white rounded-br-sm"></span>
                {/* Scanline Animation */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-550/20 to-transparent h-1/2 animate-pulse rounded-lg"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={handleReset}
              disabled={isSearching}
              className="w-1/3 rounded-2xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 py-3 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSearching}
              className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white py-3 text-xs font-black shadow-lg shadow-indigo-600/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search Matches</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FaceSearchUploader;
