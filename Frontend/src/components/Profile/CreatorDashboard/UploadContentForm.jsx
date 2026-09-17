import React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Video, Image as ImageIcon } from 'lucide-react';
import { FiTwitter } from 'react-icons/fi';

export default function UploadContentForm({
  contentType, setContentType, formTitle, setFormTitle, formCategory, setFormCategory,
  formVisibility, setFormVisibility, mediaInputMode, setMediaInputMode, mediaUrlString, setMediaUrlString,
  thumbnailUrlString, setThumbnailUrlString, uploadedFilesArray, setUploadedFilesArray,
  handleMultiFileChange, handlePublishAsset
}) {

  // Intercept layout change to reset files array safely
  const handleTypeTabSwitch = (type) => {
    setContentType(type);
    setUploadedFilesArray([]);
  };

  // Specific handler for separate local video & thumbnail files setup
  const handleLocalVideoFileSplit = (e, fileIndexSlot) => {
    const file = e.target.files[0];
    if (file) {
      const targetLocalUrl = URL.createObjectURL(file);
      setUploadedFilesArray(prev => {
        const nextState = [...prev];
        nextState[fileIndexSlot] = targetLocalUrl; // Index 0: Video stream URL, Index 1: Thumbnail URL
        return nextState;
      });
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 p-6 rounded-[24px] shadow-2xl relative">
      <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 mb-6">
        <UploadCloud className="w-5 h-5 text-purple-500" />Upload Media Content  
      </h3>

      {/* Media Type Architecture Selectors */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-5">
        {['video', 'image', 'tweet'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeTabSwitch(t)}
            className={`py-2 text-[10px] font-extrabold uppercase tracking-wider transition-all rounded-lg flex items-center justify-center gap-1 ${
              contentType === t 
                ? t === 'video' ? 'bg-blue-600 text-white' : t === 'image' ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'video' && <Video className="w-3 h-3" />}
            {t === 'image' && <ImageIcon className="w-3 h-3" />}
            {t === 'tweet' && <FiTwitter className="w-3 h-3" />}
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handlePublishAsset} className="space-y-4">
        {/* Core Description Input Layer */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            {contentType === 'tweet' ? 'Post Configuration' : 'Content Title'}
          </label>
          {contentType === 'tweet' ? (
            <textarea 
              value={formTitle} 
              onChange={(e) => setFormTitle(e.target.value)} 
              placeholder="Type micro text data stream..." 
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500 transition-colors h-24 resize-none text-slate-200" 
            />
          ) : (
            <input 
              type="text" 
              value={formTitle} 
              onChange={(e) => setFormTitle(e.target.value)} 
              placeholder="Provide system descriptive title..." 
              className={`w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs focus:outline-none transition-colors text-slate-200 ${contentType === 'video' ? 'focus:border-blue-500' : 'focus:border-green-500'}`} 
            />
          )}
        </div>

        {/* Visibility and Category Meta Controls (Excluded from Tweet structure naturally) */}
        {contentType !== 'tweet' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl text-xs p-2.5 text-slate-300 focus:outline-none focus:border-purple-500 transition-colors appearance-none">
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Hardware">Hardware</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Visibility</label>
              <select value={formVisibility} onChange={(e) => setFormVisibility(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl text-xs p-2.5 text-slate-300 focus:outline-none focus:border-purple-500 transition-colors appearance-none">
                <option value="public">Normal View</option>
                <option value="premium">Subscriber Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Upload Pipeline Asset Controller (Used strictly for standard Video / Image tabs) */}
        {contentType !== 'tweet' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Content Upload Source</label>
              <div className="flex gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800/80">
                <button type="button" onClick={() => setMediaInputMode('local')} className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${mediaInputMode === 'local' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Local</button>
                <button type="button" onClick={() => setMediaInputMode('url')} className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${mediaInputMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>URL String</button>
              </div>
            </div>

            {/* URL String Input View Mode */}
            {mediaInputMode === 'url' ? (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <input type="text" value={mediaUrlString} onChange={(e) => setMediaUrlString(e.target.value)} placeholder="Paste absolute media target URL..." className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 text-xs focus:outline-none focus:border-purple-500 transition-colors text-slate-200" />
                {contentType === 'video' && (
                  <input type="text" value={thumbnailUrlString} onChange={(e) => setThumbnailUrlString(e.target.value)} placeholder="Paste video thumbnail image URL..." className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 text-xs focus:outline-none focus:border-purple-500 transition-colors text-slate-200" />
                )}
              </motion.div>
            ) : (
              /* Local Upload Dual vs Single Input File Triggers Matrix */
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {contentType === 'video' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Input slot 1: Video file */}
                    <label className="h-24 border border-dashed border-slate-800 hover:border-blue-500/50 transition-colors bg-slate-950 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 text-center group">
                      <Video className="w-4 h-4 text-slate-600 mb-1 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[9px] text-slate-400 font-medium tracking-wide">Select Video</span>
                      {uploadedFilesArray[0] && <span className="text-[8px] text-blue-400 font-bold mt-1 truncate max-w-full px-1">Loaded ✓</span>}
                      <input type="file" accept="video/*" onChange={(e) => handleLocalVideoFileSplit(e, 0)} className="hidden" />
                    </label>

                    {/* Input slot 2: Video Cover Thumbnail */}
                    <label className="h-24 border border-dashed border-slate-800 hover:border-purple-500/50 transition-colors bg-slate-950 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 text-center group">
                      <ImageIcon className="w-4 h-4 text-slate-600 mb-1 group-hover:text-purple-400 transition-colors" />
                      <span className="text-[9px] text-slate-400 font-medium tracking-wide">Select Thumbnail</span>
                      {uploadedFilesArray[1] && <span className="text-[8px] text-purple-400 font-bold mt-1 truncate max-w-full px-1">Loaded ✓</span>}
                      <input type="file" accept="image/*" onChange={(e) => handleLocalVideoFileSplit(e, 1)} className="hidden" />
                    </label>
                  </div>
                ) : (
                  /* Standard Image Local Drop Configuration */
                  <label className="w-full h-24 border border-dashed border-slate-800 hover:border-green-500/50 transition-colors bg-slate-950 rounded-xl flex flex-col items-center justify-center cursor-pointer p-3 group">
                    <UploadCloud className="w-5 h-5 text-slate-600 mb-1 group-hover:text-green-400 transition-colors" />
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide">Attach Single or Multiple Images</span>
                    {uploadedFilesArray.length > 0 && (
                      <span className="text-[10px] text-green-400 mt-1 font-bold">({uploadedFilesArray.length} assets allocated)</span>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleMultiFileChange} className="hidden" />
                  </label>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Restructured Tweet Module View Config */}
        {contentType === 'tweet' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest block">Tweet Attachment Engine</span>
              
              {/* Added: Source Selector inside Tweet Configuration Layout */}
              <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button type="button" onClick={() => setMediaInputMode('local')} className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${mediaInputMode === 'local' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Local</button>
                <button type="button" onClick={() => setMediaInputMode('url')} className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${mediaInputMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>URL</button>
              </div>
            </div>
            
            {/* Conditional Attachment View Pipeline */}
            {mediaInputMode === 'url' ? (
              <input 
                type="text" 
                value={mediaUrlString} 
                onChange={(e) => setMediaUrlString(e.target.value)} 
                placeholder="Link optional image/video attachment URL..." 
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors" 
              />
            ) : (
              <label className="w-full h-20 border border-dashed border-slate-800 hover:border-purple-500/50 transition-colors bg-slate-900 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 group text-center">
                <UploadCloud className="w-4 h-4 text-slate-600 mb-0.5 group-hover:text-purple-400 transition-colors" />
                <span className="text-[9px] text-slate-400 font-medium tracking-wide">Upload Local Image or Video Clip</span>
                {uploadedFilesArray.length > 0 && (
                  <span className="text-[9px] text-purple-400 font-bold mt-0.5">Content Attached ✓</span>
                )}
                <input type="file" accept="image/*,video/*" onChange={handleMultiFileChange} className="hidden" />
              </label>
            )}
            
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[8px] font-bold uppercase text-slate-600 block mb-1">Stream category</span>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-xs p-2 rounded-lg text-slate-300 focus:outline-none appearance-none">
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                </select>
              </div>
              <div>
                <span className="text-[8px] font-bold uppercase text-slate-600 block mb-1">Target visibility</span>
                <select value={formVisibility} onChange={(e) => setFormVisibility(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-xs p-2 rounded-lg text-slate-300 focus:outline-none appearance-none">
                  <option value="public">Normal View</option>
                  <option value="premium">Subscriber Only</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] transition-all text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-purple-950/20 mt-2">
          Publish Content
        </button>
      </form>
    </div>
  );
}