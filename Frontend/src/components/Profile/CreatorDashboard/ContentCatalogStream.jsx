import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Video, Image as ImageIcon, Globe, Lock, Edit2, Trash2, Save, Ban, UploadCloud } from 'lucide-react';
import { FiTwitter } from 'react-icons/fi';

export default function ContentCatalogStream({
  catalogTab, setCatalogTab, searchQuery, setSearchQuery, filteredCatalog,
  editingItemId, startEditingAsset, handleDeleteAsset, editFormState, setEditFormState,
  editMediaMode, setEditMediaMode, editFileInputRef, editThumbInputRef,
  handleEditMediaFileChange, handleEditThumbFileChange, saveEditedAsset, cancelEditingAsset, typeAccent
}) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[24px] shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {['all', 'video', 'image', 'tweet'].map(tab => (
            <button key={tab} onClick={() => setCatalogTab(tab)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap ${catalogTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab === 'tweet' ? 'Tweets' : tab}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input type="text" placeholder="Filter active index..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition-colors" />
        </div>
      </div>

      <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto bg-slate-950/10">
        <AnimatePresence initial={false}>
          {filteredCatalog.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center text-slate-500 text-xs uppercase tracking-widest font-bold">
              No active assets matching filter thresholds
            </motion.div>
          ) : (
            filteredCatalog.map(asset => {
              const accent = typeAccent[asset.type] || typeAccent.video;
              const isEditing = editingItemId === asset.id;
              return (
                <motion.div key={asset.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 hover:bg-slate-900/40 transition-colors duration-200 ${isEditing ? 'bg-slate-900/60' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 flex gap-4 items-start min-w-0">
                      <div className={`w-20 h-12 bg-slate-950 border ${accent.border} rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative shadow-inner`}>
                        {asset.type === 'video' && (asset.mediaUrl ? <video src={asset.mediaUrl} className="w-full h-full object-cover" /> : <div className={`w-full h-full ${accent.bg} flex items-center justify-center ${accent.text}`}><Video className="w-4 h-4" /></div>)}
                        {asset.type === 'image' && <img src={asset.mediaUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60"} alt="Visual" className="w-full h-full object-cover" />}
                        {asset.type === 'tweet' && <div className={`w-full h-full ${accent.bg} flex items-center justify-center ${accent.text}`}><FiTwitter className="w-4 h-4" /></div>}
                        {asset.images && asset.images.length > 1 && <div className="absolute bottom-0 right-0 bg-slate-950/80 px-1 text-[8px] font-bold text-green-400 rounded-tl-md">+{asset.images.length}</div>}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{asset.title}</h4>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium flex-wrap">
                          <span className={`uppercase font-bold tracking-wider text-[9px] px-1.5 py-0.5 rounded ${accent.bg} ${accent.text}`}>{asset.type}</span>
                          <span>•</span><span>{asset.category}</span><span>•</span><span>{asset.views.toLocaleString()} Impr.</span><span>•</span>
                          {asset.isSubscriberOnly ? (
                            <span className="text-red-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Premium</span>
                          ) : (
                            <span className="text-green-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" /> Public</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button onClick={() => startEditingAsset(asset)} className="p-2 bg-slate-950 hover:bg-purple-950/40 border border-slate-800/80 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 transition-all rounded-xl active:scale-95 shadow-md"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteAsset(asset.id)} className="p-2 bg-slate-950 hover:bg-red-950/40 border border-slate-800/80 hover:border-red-500/50 text-slate-500 hover:text-red-400 transition-all rounded-xl active:scale-95 shadow-md"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>

                  {/* Inline Modification Box */}
                  {isEditing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4 overflow-hidden">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{editFormState.type === 'tweet' ? 'Tweet stream' : 'Title'}</label>
                        {editFormState.type === 'tweet' ? (
                          <textarea value={editFormState.title || ''} onChange={(e) => setEditFormState({ ...editFormState, title: e.target.value })} className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-lg text-white h-20 resize-none focus:outline-none focus:border-purple-500" />
                        ) : (
                          <input type="text" value={editFormState.title || ''} onChange={(e) => setEditFormState({ ...editFormState, title: e.target.value })} className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                          <select value={editFormState.category || 'Development'} onChange={(e) => setEditFormState({ ...editFormState, category: e.target.value })} className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-lg text-slate-300 focus:outline-none appearance-none">
                            <option value="Development">Development</option>
                            <option value="Development">Cartoon</option>
                            <option value="Design">Design</option><option value="Hardware">Hardware</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Visibility</label>
                          <select value={editFormState.isSubscriberOnly ? 'premium' : 'public'} onChange={(e) => setEditFormState({ ...editFormState, isSubscriberOnly: e.target.value === 'premium' })} className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-lg text-slate-300 focus:outline-none appearance-none">
                            <option value="public">Normal View</option><option value="premium">Subscriber Only</option>
                          </select>
                        </div>
                      </div>

                      {editFormState.type !== 'tweet' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{editFormState.type === 'video' ? 'Replace Video' : 'Add Image Node'}</label>
                            <div className="flex gap-1.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                              <button type="button" onClick={() => setEditMediaMode('local')} className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${editMediaMode === 'local' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>Local</button>
                              <button type="button" onClick={() => setEditMediaMode('url')} className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${editMediaMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>URL</button>
                            </div>
                          </div>
                          {editMediaMode === 'url' ? (
                            <div className="space-y-2">
                              <input type="text" value={editFormState.mediaUrl || ''} onChange={(e) => setEditFormState({ ...editFormState, mediaUrl: e.target.value })} placeholder="Paste new media URL..." className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none" />
                              {editFormState.type === 'video' && <input type="text" value={editFormState.thumbnail || ''} onChange={(e) => setEditFormState({ ...editFormState, thumbnail: e.target.value })} placeholder="Paste new thumbnail URL..." className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none" />}
                            </div>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              <label className="flex-1 min-w-[140px] h-16 border border-dashed border-slate-800 hover:border-purple-500/50 bg-slate-900 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2">
                                <UploadCloud className="w-4 h-4 text-slate-600 mb-0.5" /><span className="text-[9px] text-slate-400 font-medium tracking-wide">Upload {editFormState.type}</span>
                                <input ref={editFileInputRef} type="file" accept={editFormState.type === 'video' ? 'video/*' : 'image/*'} onChange={handleEditMediaFileChange} className="hidden" />
                              </label>
                              {editFormState.type === 'video' && (
                                <label className="flex-1 min-w-[140px] h-16 border border-dashed border-slate-800 hover:border-purple-500/50 bg-slate-900 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2">
                                  <ImageIcon className="w-4 h-4 text-slate-600 mb-0.5" /><span className="text-[9px] text-slate-400 font-medium tracking-wide">Upload Thumbnail</span>
                                  <input ref={editThumbInputRef} type="file" accept="image/*" onChange={handleEditThumbFileChange} className="hidden" />
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button onClick={saveEditedAsset} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] px-4 py-2 font-bold uppercase tracking-wider rounded-xl transition-all"><Save className="w-3.5 h-3.5" /> Save Changes</button>
                        <button onClick={cancelEditingAsset} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[10px] px-4 py-2 font-bold uppercase tracking-wider rounded-xl transition-all"><Ban className="w-3.5 h-3.5" /> Cancel Modification</button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}