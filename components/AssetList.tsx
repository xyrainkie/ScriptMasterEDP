
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Asset, AssetType } from '../types';

interface AssetListProps {
  assets: Asset[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Asset>) => void;
  viewMode: 'TABLE' | 'FORM';
  columns?: string[];
  onColumnsChange?: (cols: string[]) => void;
  editableColumns?: boolean;
}

const AssetList: React.FC<AssetListProps> = ({ assets, onRemove, onUpdate, viewMode, columns, onColumnsChange, editableColumns }) => {
  const [openFormatId, setOpenFormatId] = useState<string | null>(null);
  const [internalColumns, setInternalColumns] = useState<string[]>([]);
  const cols = columns ?? internalColumns;
  const setCols = (next: string[]) => {
    if (onColumnsChange) onColumnsChange(next);
    if (!columns) setInternalColumns(next);
  };
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [openConfigId, setOpenConfigId] = useState<string | null>(null);
  const [lockedDescIds, setLockedDescIds] = useState<Set<string>>(new Set());
  const stop = { onMouseDown: (e: any) => e.stopPropagation(), onKeyDown: (e: any) => e.stopPropagation() };
  const dragColRef = useRef<string | null>(null);
  const onHeaderDragStart = (name: string) => { dragColRef.current = name; };
  const onHeaderDrop = (targetName: string) => {
    const from = cols.indexOf(dragColRef.current ?? '');
    const to = cols.indexOf(targetName);
    if (from >= 0 && to >= 0 && from !== to) {
      const next = [...cols];
      const [col] = next.splice(from, 1);
      next.splice(to, 0, col);
      setCols(next);
    }
    dragColRef.current = null;
  };
  const onHeaderDragOver = (e: any) => { e.preventDefault(); };
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [editingColDraft, setEditingColDraft] = useState<string>('');
  const beginEditCol = (name: string) => { setEditingCol(name); setEditingColDraft(name); };
  const commitEditCol = () => {
    const name = (editingColDraft || '').trim();
    if (!editingCol) return;
    if (!name) { setEditingCol(null); setEditingColDraft(''); return; }
    const idx = cols.indexOf(editingCol);
    if (idx === -1) { setEditingCol(null); setEditingColDraft(''); return; }
    if (cols.some((c, i) => i !== idx && c === name)) { setEditingCol(null); setEditingColDraft(''); return; }
    const next = [...cols];
    next[idx] = name;
    setCols(next);
    // migrate existing asset customFields keys
    assets.forEach((a) => {
      const cf = a.customFields || {};
      if (cf[editingCol] !== undefined) {
        const migrated = { ...cf } as Record<string, string>;
        migrated[name] = cf[editingCol];
        delete migrated[editingCol];
        onUpdate(a.id, { customFields: migrated });
      }
    });
    setEditingCol(null);
    setEditingColDraft('');
  };
  const cancelEditCol = () => { setEditingCol(null); setEditingColDraft(''); };

  useEffect(() => {
    if (columns) return;
    try {
      const saved = localStorage.getItem('asset_custom_columns');
      if (saved) setInternalColumns(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (columns) return;
    try {
      localStorage.setItem('asset_custom_columns', JSON.stringify(internalColumns));
    } catch {}
  }, [internalColumns]);

  const [addingCol, setAddingCol] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const startAddColumn = () => { setAddingCol(true); setNewColName(''); };
  const confirmAddColumn = () => {
    const name = newColName.trim();
    if (!name) return;
    if (cols.includes(name)) { setAddingCol(false); setNewColName(''); return; }
    setCols([...cols, name]);
    setAddingCol(false);
    setNewColName('');
  };
  const cancelAddColumn = () => { setAddingCol(false); setNewColName(''); };

  const removeCustomColumn = (name: string) => {
    setCols(cols.filter(c => c !== name));
    assets.forEach((a) => {
      const cf = a.customFields || {};
      if (cf[name] !== undefined) {
        const next = { ...cf } as Record<string, string>;
        delete next[name];
        onUpdate(a.id, { customFields: next });
      }
    });
  };

  const moveCustomColumn = (name: string, direction: 'left' | 'right') => {
    const idx = cols.indexOf(name);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cols.length) return;
    const next = [...cols];
    const [col] = next.splice(idx, 1);
    next.splice(targetIdx, 0, col);
    setCols(next);
  };

  const getExtraValue = (asset: Asset, key: string): string => {
    return asset.customFields?.[key] ?? '';
  };

  const setExtraValue = (assetId: string, asset: Asset, key: string, value: string) => {
    const current = asset.customFields || {};
    const next = { ...current, [key]: value };
    onUpdate(assetId, { customFields: next });
  };


  const getExtraValueForExtra = (ex: any, key: string): string => {
    return ex?.customFields?.[key] ?? '';
  };

  const setExtraValueForExtra = (asset: Asset, idx: number, key: string, value: string) => {
    const next = (asset.extras || []).map((item, i) => {
      if (i !== idx) return item;
      const cf = item.customFields || {};
      return { ...item, customFields: { ...cf, [key]: value } };
    });
    onUpdate(asset.id, { extras: next });
  };

  const getAssetNote = (asset: Asset): string => {
    return asset.customFields?.note ?? '';
  };

  const setAssetNote = (assetId: string, asset: Asset, value: string) => {
    const cf = asset.customFields || {};
    const next = { ...cf, note: value };
    onUpdate(assetId, { customFields: next });
  };

  const getExtraNote = (ex: any): string => {
    return ex?.customFields?.note ?? '';
  };

  const setExtraNote = (asset: Asset, idx: number, value: string) => {
    const next = (asset.extras || []).map((item, i) => {
      if (i !== idx) return item;
      const cf = item.customFields || {};
      return { ...item, customFields: { ...cf, note: value } };
    });
    onUpdate(asset.id, { extras: next });
  };

  const copyPrevRow = (assetId: string) => {
    const idx = assets.findIndex(a => a.id === assetId);
    if (idx <= 0) return;
    const prev = assets[idx - 1];
    const updates: Partial<Asset> = {
      description: prev.description || '',
      type: prev.type,
      formats: (prev as any).formats ?? [],
      format: (prev as any).format ?? '',
      dimensions: prev.dimensions || '',
      fileSize: prev.fileSize || '',
      customFields: prev.customFields ? { ...prev.customFields } : {},
      extras: prev.extras ? prev.extras.map(ex => ({ ...ex })) : []
    };
    setOpenFormatId(null);
    onUpdate(assetId, updates);
  };

  const selectedAsset = useMemo(() => assets.find(a => a.id === selectedAssetId) || null, [assets, selectedAssetId]);
  const [headerNameDraft, setHeaderNameDraft] = useState<string>("");
  useEffect(() => {
    setHeaderNameDraft(selectedAsset?.name ?? "");
  }, [selectedAsset?.id]);

  const prevCountRef = useRef<number>(assets.length);
  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (assets.length > prevCountRef.current) {
      const newAsset = assets[assets.length - 1];
      if (newAsset && viewMode === 'FORM') {
        setSelectedAssetId(newAsset.id);
        setOpenConfigId(newAsset.id);
      }
    }
    prevCountRef.current = assets.length;
  }, [assets, viewMode]);

  useEffect(() => {
    if (viewMode !== 'FORM') return; // only focus in FORM view
    if (selectedAsset && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [selectedAsset, viewMode]);
  const formatOptionsByType: Record<AssetType, string[]> = {
    [AssetType.IMAGE]: ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', '未明确规定'],
    [AssetType.AUDIO]: ['MP3', 'WAV', 'OGG', '未明确规定'],
    [AssetType.VIDEO]: ['MP4', 'WEBM', 'MOV', '未明确规定'],
    [AssetType.ANIMATION]: ['GIF', 'MP4', 'WEBM', 'JSON', '未明确规定'],
    [AssetType.COMPONENT]: ['ZIP', 'JSON', 'JS', 'HTML', 'CSS', '未明确规定'],
    [AssetType.DEFAULT]: ['未明确规定'],
  } as const;
  if (assets.length === 0) {
    return (
      <div className="text-center py-6 bg-slate-50/50 rounded-lg">
        <p className="text-slate-400 text-xs">此列表为空。</p>
      </div>
    );
  }

  // --- View Mode: FORM (Vertical Layout for Scripting) ---
  if (viewMode === 'FORM') {
    return (
        <div className="flex flex-col gap-6">
            {assets.map((asset, index) => (
                <div key={asset.id} className="bg-white rounded-lg border border-slate-200 flex flex-col md:flex-row group hover:shadow-md transition-shadow">
                    
                    {/* Left: Metadata Sidebar */}
                    <div className="w-full md:w-60 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-col gap-3">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">组件 #{index + 1}</span>
                            <div className="font-bold text-base text-slate-800 break-words">{asset.name}</div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                 asset.type === AssetType.IMAGE ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                 asset.type === AssetType.AUDIO ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                 asset.type === AssetType.VIDEO ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                 'bg-purple-50 text-purple-600 border-purple-100'
                              }`}>
                                 {asset.type}
                              </span>
                              {((asset as any).formats && (asset as any).formats.length > 0) && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-500 border border-slate-200">
                                  {(asset as any).formats.join(', ')}
                                </span>
                              )}
                              {(!((asset as any).formats && (asset as any).formats.length) && asset.format) && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-500 border border-slate-200">
                                  {asset.format}
                                </span>
                              )}
                        </div>

                        <div className="space-y-2 text-xs text-slate-500">
                             {asset.dimensions && (
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-ruler-combined w-4 text-center text-slate-400"></i>
                                    <span className="font-mono">{asset.dimensions}</span>
                                </div>
                             )}
                             {asset.fileSize && (
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-file w-4 text-center text-slate-400"></i>
                                    <span className="font-mono">{asset.fileSize}</span>
                                </div>
                             )}
                        </div>

                        
                        <div className="mt-2">
                          <button
                            onClick={() => onUpdate(asset.id, { enabled: asset.enabled === false ? true : false })}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold border ${asset.enabled === false ? 'bg-white text-slate-500 border-slate-300' : 'bg-green-50 text-green-600 border-green-200'}`}
                          >
                            {asset.enabled === false ? '不使用' : '使用中'}
                          </button>
                        </div>
                    </div>

                    {/* Right: Content Editor + Config */}
                    <div className="flex-grow p-4 flex flex-col relative">
                        {asset.enabled === false && (
                          <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-500">
                            此组件已设为“不使用”。在左侧切换为“使用中”以继续编辑。
                          </div>
                        )}
                        <div className={asset.enabled === false ? 'hidden' : ''}>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400">分项内容</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">
                              {asset.description || '-'}
                            </div>
                          </div>
                          {asset.type && (
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">类型</label>
                              <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">
                                {asset.type}
                              </div>
                            </div>
                          )}
                          {(() => {
                            const fmt = ((asset as any).formats && (asset as any).formats.length) ? (asset as any).formats.join(', ') : (asset.format || '');
                            return fmt ? (
                              <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400">格式</label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{fmt}</div>
                              </div>
                            ) : null;
                          })()}
                          {asset.dimensions && (
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">尺寸</label>
                              <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{asset.dimensions}</div>
                            </div>
                          )}
                          {asset.fileSize && (
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">文件大小</label>
                              <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{asset.fileSize}</div>
                            </div>
                          )}
                        </div>
                        {cols.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cols.filter((c) => !!(getExtraValue(asset, c) || '').trim()).map((c) => (
                              <div key={`${asset.id}-summary-${c}`}>
                                <label className="text-[10px] uppercase font-bold text-slate-400">{c}</label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{getExtraValue(asset, c)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-3">
                          <textarea
                            value={getAssetNote(asset)}
                            onChange={(e) => setAssetNote(asset.id, asset, e.target.value)}
                            placeholder="请输入说明...（独立输入，不影响其它字段）"
                            className={`w-full border border-slate-300 rounded px-2 py-2 text-sm outline-none min-h-[80px] resize-y ${lockedDescIds.has(asset.id) ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                            rows={3}
                            readOnly={lockedDescIds.has(asset.id)}
                          />
                        </div>
                        
                        {/* Extras: Additional content items */}
                        <div className="mt-4">
                          
                          <div className="space-y-2">
                            {(asset.extras || []).map((ex, idx) => (
                              <div key={idx} className="flex flex-col gap-2">
                                
                                <div className="flex items-start gap-2">
                                  <div className="flex-grow flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">分项内容</label>
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">
                                      {ex.content || '-'}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                      {(ex.type || asset.type) && (
                                        <div>
                                          <label className="text-[10px] uppercase font-bold text-slate-400">类型</label>
                                          <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{(ex.type || asset.type) as any}</div>
                                        </div>
                                      )}
                                      {(() => {
                                        const fmt = (ex.formats && ex.formats.length) ? ex.formats.join(', ') : '';
                                        return fmt ? (
                                          <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400">格式</label>
                                            <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{fmt}</div>
                                          </div>
                                        ) : null;
                                      })()}
                                      {ex.dimensions && (
                                        <div>
                                          <label className="text-[10px] uppercase font-bold text-slate-400">尺寸</label>
                                          <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{ex.dimensions}</div>
                                        </div>
                                      )}
                                      {ex.fileSize && (
                                        <div>
                                          <label className="text-[10px] uppercase font-bold text-slate-400">文件大小</label>
                                          <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{ex.fileSize}</div>
                                        </div>
                                      )}
                                    </div>
                                    {cols.length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        {cols.filter((c) => !!(getExtraValueForExtra(ex as any, c) || '').trim()).map((c) => (
                                          <div key={`${asset.id}-extra-${idx}-summary-${c}`}>
                                            <label className="text-[10px] uppercase font-bold text-slate-400">{c}</label>
                                            <div className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700">{getExtraValueForExtra(ex as any, c)}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <textarea
                                      value={getExtraNote(ex)}
                                      onChange={(e) => setExtraNote(asset, idx, e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded px-2 py-2 text-sm outline-none min-h-[80px] resize-y"
                                      rows={3}
                                      placeholder="对此分项的说明..."
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const next = (asset.extras || []).filter((_, i) => i !== idx);
                                      onUpdate(asset.id, { extras: next });
                                    }}
                                    className="text-slate-400 hover:text-red-500"
                                    title="移除分项"
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => setLockedDescIds(prev => {
                              const next = new Set(prev);
                              if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id);
                              return next;
                            })}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700"
                          >
                            {lockedDescIds.has(asset.id) ? '编辑' : '完成'}
                          </button>
                        </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
  }

  // --- View Mode: TABLE (Horizontal Layout for Configuration) ---
  return (
    <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-400">组件名称</label>
          <input
            type="text"
            value={headerNameDraft}
            onFocus={() => { if (!selectedAssetId && assets.length > 0) setSelectedAssetId(assets[0].id); }}
            onChange={(e) => {
              const val = e.target.value;
              setHeaderNameDraft(val);
              const targetId = selectedAsset?.id ?? (assets[0]?.id);
              if (!targetId) return;
              if (!selectedAssetId) setSelectedAssetId(targetId);
              onUpdate(targetId, { name: val });
            }}
            {...stop}
            className="font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-indigo-500 outline-none text-xs"
            placeholder="请选择一行进行编辑"
            ref={nameInputRef}
          />
        </div>
        <div className="flex items-center gap-2">
          {editableColumns && !addingCol && (
            <button type="button" onClick={startAddColumn} className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">自定义列 +</button>
          )}
          {editableColumns && addingCol && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded px-2 py-1 outline-none"
                placeholder="列名"
                {...stop}
              />
              <button type="button" onClick={confirmAddColumn} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">确定</button>
              <button type="button" onClick={cancelAddColumn} className="text-xs bg-white text-slate-700 px-2 py-1 rounded border border-slate-300">取消</button>
            </div>
          )}
        </div>
      </div>
      <table className="w-full text-sm text-left text-slate-600 min-w-[900px]">
        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
                <th className="px-4 py-3 w-1/5">分项内容</th>
                {cols.map((c, i) => (
                  <th key={c} className="px-4 py-3 w-40" onDragOver={onHeaderDragOver} onDrop={() => onHeaderDrop(c)}>
                    <span className="mr-2">
                      {editingCol === c ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={editingColDraft}
                            onChange={(e) => setEditingColDraft(e.target.value)}
                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 outline-none"
                            placeholder="列名"
                            {...stop}
                          />
                          <button type="button" onClick={(e) => { e.preventDefault(); commitEditCol(); }} className="text-slate-600 hover:text-indigo-600" title="保存" {...stop}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button type="button" onClick={(e) => { e.preventDefault(); cancelEditCol(); }} className="text-slate-400 hover:text-slate-600" title="取消" {...stop}>
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ) : (
                        editableColumns ? (
                          <button type="button" onClick={(e) => { e.preventDefault(); beginEditCol(c); }} className="text-slate-600 hover:text-indigo-600 font-semibold" {...stop}>
                            {c}
                          </button>
                        ) : (
                          <span className="text-slate-600 font-semibold">{c}</span>
                        )
                      )}
                    </span>
                    {editableColumns && (
                      <span className="inline-flex items-center gap-1">
                        <button type="button" draggable onDragStart={() => onHeaderDragStart(c)} className="text-slate-400 hover:text-slate-600 cursor-grab" title="拖拽调整顺序" {...stop}>
                          <i className="fas fa-grip-lines"></i>
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); removeCustomColumn(c); }} className="text-slate-400 hover:text-red-500" title="移除此列" {...stop}>
                          <i className="fas fa-times"></i>
                        </button>
                      </span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-3 w-28">类型</th>
                <th className="px-4 py-3 w-40">格式</th>
                <th className="px-4 py-3 w-36">尺寸</th>
                <th className="px-4 py-3 w-36">文件大小</th>
                <th className="px-4 py-3 w-40">说明</th>
                <th className="px-4 py-3 text-right w-12">操作</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
            {assets.map((asset) => (
                <React.Fragment key={asset.id}>
                <tr className="hover:bg-slate-50 group">
                    <td className="px-4 py-2 align-top" onClick={() => setSelectedAssetId(asset.id)}>
                        <div className="flex items-start gap-2">
                          <textarea 
                              value={asset.description}
                              onChange={(e) => onUpdate(asset.id, { description: e.target.value })}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="flex-grow bg-white rounded px-2 py-1 text-xs resize-y border border-slate-200 outline-none min-h-[32px]"
                              rows={1}
                              placeholder="分项内容..."
                          />
                          <button 
                            onClick={() => {
                              const nextExtras = [...(asset.extras || []), { content: asset.description || '', type: asset.type, formats: [], dimensions: '', fileSize: '', collapsed: false }];
                              onUpdate(asset.id, { extras: nextExtras });
                              setOpenFormatId(null);
                            }}
                            className="text-slate-400 hover:text-indigo-600"
                            title="在分项内容后新增个性化分项"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                    </td>
                    {cols.map((c) => (
                      <td key={`${asset.id}-${c}`} className="px-4 py-2 align-top">
                        <input
                          type="text"
                          value={getExtraValue(asset, c)}
                          onChange={(e) => setExtraValue(asset.id, asset, c, e.target.value)}
                          {...stop}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                          placeholder={`输入 ${c}`}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 align-top" onClick={() => setSelectedAssetId(asset.id)}>
                         {(() => {
                           const allTypes = Object.values(AssetType);
                           const selectedTypesStr = (asset.customFields || {}).selected_types || '';
                           const selectedTypes = selectedTypesStr ? selectedTypesStr.split('|').filter(Boolean) : [];
                           const id = `${asset.id}-types`;
                           return (
                             <div className="relative">
                               <button
                                 type="button"
                                 onClick={() => setOpenFormatId(openFormatId === id ? null : id)}
                                 {...stop}
                                 className="flex items-center justify-between w-full bg-white text-xs border border-slate-200 rounded px-2 py-1 outline-none"
                               >
                                 <span className="truncate mr-2">{selectedTypes.length > 0 ? selectedTypes.join(', ') : asset.type || '未选择'}</span>
                                 <i className={`fas fa-chevron-down text-slate-400 ${openFormatId === id ? 'rotate-180 transition-transform' : ''}`}></i>
                               </button>
                               {openFormatId === id && (
                                 <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg p-2 max-h-40 overflow-auto">
                                   {allTypes.map((opt: string) => {
                                     const checked = selectedTypes.includes(opt);
                                     return (
                                       <label key={opt} className="flex items-center gap-2 text-xs px-1 py-1 cursor-pointer hover:bg-slate-50 rounded">
                                         <input
                                           type="checkbox"
                                           checked={checked}
                                           onChange={(e) => {
                                             const next = new Set(selectedTypes);
                                             if (e.target.checked) { next.add(opt); } else { next.delete(opt); }
                                             const arr = Array.from(next);
                                             const selected_types = arr.join('|');
                                             const primaryCandidate = arr.find((v: string): v is AssetType => (allTypes as unknown as string[]).includes(v));
                                             const newType: AssetType = primaryCandidate ?? asset.type;
                                             onUpdate(asset.id, { customFields: { ...(asset.customFields || {}), selected_types }, type: newType, formats: [] } as any);
                                             }}
                                          />
                                         <span>{opt}</span>
                                       </label>
                                     );
                                  })}
                                 </div>
                               )}
                             </div>
                           );
                         })()}
                    </td>
                    <td className="px-4 py-2 align-top relative">
                        {(() => {
                          const selected = (asset as any).formats ?? (asset.format ? [asset.format] : []);
                          const options = (formatOptionsByType as any)[asset.type] ?? ['未明确规定'];
                          return (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenFormatId(openFormatId === asset.id ? null : asset.id)}
                                {...stop}
                                className="flex items-center justify-between w-full bg-white text-xs border border-slate-200 rounded px-2 py-1 outline-none"
                              >
                                <span className="truncate mr-2">{selected.length > 0 ? selected.join(', ') : '未选择'}</span>
                                <i className={`fas fa-chevron-down text-slate-400 ${openFormatId === asset.id ? 'rotate-180 transition-transform' : ''}`}></i>
                              </button>
                              {openFormatId === asset.id && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg p-2 max-h-40 overflow-auto">
                                  {options.map((opt: string) => {
                                    const checked = selected.includes(opt);
                                    return (
                                      <label key={opt} className="flex items-center gap-2 text-xs px-1 py-1 cursor-pointer hover:bg-slate-50 rounded">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const next = new Set(selected);
                                            if (e.target.checked) { next.add(opt); } else { next.delete(opt); }
                                            onUpdate(asset.id, { formats: Array.from(next) } as any);
                                          }}
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </td>
                    <td className="px-4 py-2 align-top" onClick={() => setSelectedAssetId(asset.id)}>
                        <textarea
                            value={asset.dimensions || ''}
                            onChange={(e) => onUpdate(asset.id, { dimensions: e.target.value })}
                            {...stop}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-y min-h-[32px]"
                            rows={1}
                            placeholder="尺寸..."
                        />
                    </td>
                    <td className="px-4 py-2 align-top" onClick={() => setSelectedAssetId(asset.id)}>
                        <textarea
                            value={asset.fileSize || ''}
                            onChange={(e) => onUpdate(asset.id, { fileSize: e.target.value })}
                            {...stop}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-y min-h-[32px]"
                            rows={1}
                            placeholder="文件大小..."
                        />
                    </td>
                    <td className="px-4 py-2 align-top" onClick={() => setSelectedAssetId(asset.id)}>
                        <textarea
                            value={getAssetNote(asset)}
                            onChange={(e) => setAssetNote(asset.id, asset, e.target.value)}
                            {...stop}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-y min-h-[32px]"
                            rows={1}
                            placeholder="说明..."
                        />
                    </td>
                    <td className="px-4 py-2 align-top text-right" onClick={() => setSelectedAssetId(asset.id)}>
                        <button onClick={() => copyPrevRow(asset.id)} className="text-slate-400 hover:text-indigo-600 mr-2" title="复制上一行">
                            <i className="fas fa-copy"></i>
                        </button>
                        <button onClick={() => setOpenConfigId(openConfigId === asset.id ? null : asset.id)} className="text-slate-400 hover:text-indigo-600 mr-2" title="配置">
                            <i className="fas fa-cog"></i>
                        </button>
                        <button onClick={() => onRemove(asset.id)} className="text-slate-300 hover:text-red-500" title="移除">
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
                {openConfigId === asset.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={7 + cols.length} className="px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">组件名称</label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => onUpdate(asset.id, { name: e.target.value })}
                            {...stop}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                            placeholder="组件名"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">类型</label>
                          <select 
                            value={asset.type}
                            onChange={(e) => { const newType = e.target.value as AssetType; setOpenFormatId(null); onUpdate(asset.id, { type: newType, formats: [], format: '' } as any); }}
                            {...stop}
                            className="bg-white text-xs border border-slate-200 rounded px-2 py-1 w-full outline-none"
                          >
                            {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase font-bold text-slate-400">格式</label>
                          {(() => {
                            const selected = (asset as any).formats ?? (asset.format ? [asset.format] : []);
                            const options = (formatOptionsByType as any)[asset.type] ?? ['未明确规定'];
                            const id = `${asset.id}-config`;
                            return (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenFormatId(openFormatId === id ? null : id)}
                                  {...stop}
                                  className="flex items-center justify-between w-full bg-white text-xs border border-slate-200 rounded px-2 py-1 outline-none"
                                >
                                  <span className="truncate mr-2">{selected.length > 0 ? selected.join(', ') : '未选择'}</span>
                                  <i className={`fas fa-chevron-down text-slate-400 ${openFormatId === id ? 'rotate-180 transition-transform' : ''}`}></i>
                                </button>
                                {openFormatId === id && (
                                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg p-2 max-h-40 overflow-auto">
                                    {options.map((opt: string) => {
                                      const checked = selected.includes(opt);
                                      return (
                                        <label key={opt} className="flex items-center gap-2 text-xs px-1 py-1 cursor-pointer hover:bg-slate-50 rounded">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                              const nextVals = new Set(selected);
                                              if (e.target.checked) { nextVals.add(opt); } else { nextVals.delete(opt); }
                                              onUpdate(asset.id, { formats: Array.from(nextVals) } as any);
                                            }}
                                          />
                                          <span>{opt}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">尺寸</label>
                          <input 
                            type="text" 
                            value={asset.dimensions || ''}
                            onChange={(e) => onUpdate(asset.id, { dimensions: e.target.value })}
                            {...stop}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                            placeholder="如 1920x1080"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">文件大小</label>
                          <input 
                            type="text" 
                            value={asset.fileSize || ''}
                            onChange={(e) => onUpdate(asset.id, { fileSize: e.target.value })}
                            {...stop}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                            placeholder="如 2MB"
                          />
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end">
                          <button onClick={() => setOpenConfigId(null)} className="text-xs bg-white text-slate-700 px-2 py-1 rounded border border-slate-300 hover:bg-slate-50">收起配置</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {(asset.extras && asset.extras.length > 0) && (
                  asset.extras.map((ex, idx) => (
                    <tr key={`${asset.id}-extra-${idx}`} className="bg-slate-50">
                      <td className="px-4 py-2 align-top">
                        {(ex.collapsed) ? (
                          <button
                            onClick={() => {
                              const next = (asset.extras || []).map((item, i) => i === idx ? { ...item, collapsed: false } : item);
                              onUpdate(asset.id, { extras: next });
                            }}
                            className="text-xs bg-white text-slate-700 px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        ) : (
                          <textarea
                            value={ex.content || ''}
                            onChange={(e) => {
                              const next = (asset.extras || []).map((item, i) => i === idx ? { ...item, content: e.target.value } : item);
                              onUpdate(asset.id, { extras: next });
                            }}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-y min-h-[32px]"
                            rows={1}
                            placeholder="分项内容..."
                          />
                        )}
                      </td>
                      {cols.map((c) => (
                        <td key={`${asset.id}-extra-${idx}-${c}`} className="px-4 py-2 align-top">
                          <input
                            type="text"
                            value={getExtraValueForExtra(ex as any, c)}
                            onChange={(e) => setExtraValueForExtra(asset, idx, c, e.target.value)}
                            {...stop}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                            placeholder={`输入 ${c}`}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 align-top">
                        {(() => {
                          const allTypes = Object.values(AssetType);
                          const selectedTypesStr = (ex.customFields || {}).selected_types || '';
                          const selectedTypes = selectedTypesStr ? selectedTypesStr.split('|').filter(Boolean) : [];
                          const id = `${asset.id}-extra-${idx}-types`;
                          return (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenFormatId(openFormatId === id ? null : id)}
                                {...stop}
                                className="flex items-center justify-between w-full bg-white text-xs border border-slate-200 rounded px-2 py-1 outline-none"
                              >
                                <span className="truncate mr-2">{selectedTypes.length > 0 ? selectedTypes.join(', ') : (ex.type || asset.type) || '未选择'}</span>
                                <i className={`fas fa-chevron-down text-slate-400 ${openFormatId === id ? 'rotate-180 transition-transform' : ''}`}></i>
                              </button>
                              {openFormatId === id && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg p-2 max-h-40 overflow-auto">
                                  {allTypes.map((opt: string) => {
                                    const checked = selectedTypes.includes(opt);
                                    return (
                                      <label key={opt} className="flex items-center gap-2 text-xs px-1 py-1 cursor-pointer hover:bg-slate-50 rounded">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const nextSet = new Set(selectedTypes);
                                            if (e.target.checked) { nextSet.add(opt); } else { nextSet.delete(opt); }
                                            const arr = Array.from(nextSet);
                                            const selected_types = arr.join('|');
                                            const primaryCandidate = arr.find((v: string): v is AssetType => (allTypes as unknown as string[]).includes(v));
                                            const nextExtras = (asset.extras || []).map((item, i) => i === idx ? { ...item, type: (primaryCandidate ?? (item.type as any)), formats: [], customFields: { ...(item.customFields || {}), selected_types } } : item);
                                            onUpdate(asset.id, { extras: nextExtras });
                                          }}
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    );
                                  })}
                                  
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 align-top relative">
                        {(() => {
                          const selected = (ex.formats ?? []);
                          const typeForOptions = (ex.type || asset.type) as AssetType;
                          const options = (formatOptionsByType as any)[typeForOptions] ?? ['未明确规定'];
                          const id = `${asset.id}-extra-${idx}`;
                          return (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenFormatId(openFormatId === id ? null : id)}
                                {...stop}
                                className="flex items-center justify-between w-full bg-white text-xs border border-slate-200 rounded px-2 py-1 outline-none"
                              >
                                <span className="truncate mr-2">{selected.length > 0 ? selected.join(', ') : '未选择'}</span>
                                <i className={`fas fa-chevron-down text-slate-400 ${openFormatId === id ? 'rotate-180 transition-transform' : ''}`}></i>
                              </button>
                              {openFormatId === id && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg p-2 max-h-40 overflow-auto">
                                  {options.map((opt: string) => {
                                    const checked = selected.includes(opt);
                                    return (
                                      <label key={opt} className="flex items-center gap-2 text-xs px-1 py-1 cursor-pointer hover:bg-slate-50 rounded">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const nextVals = new Set(selected);
                                            if (e.target.checked) { nextVals.add(opt); } else { nextVals.delete(opt); }
                                            const next = (asset.extras || []).map((item, i) => i === idx ? { ...item, formats: Array.from(nextVals) } : item);
                                            onUpdate(asset.id, { extras: next });
                                          }}
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 align-top">
                        <textarea
                          value={ex.dimensions || ''}
                          onChange={(e) => {
                            const next = (asset.extras || []).map((item, i) => i === idx ? { ...item, dimensions: e.target.value } : item);
                            onUpdate(asset.id, { extras: next });
                          }}
                          {...stop}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-y min-h-[32px]"
                          rows={1}
                          placeholder="尺寸..."
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <textarea
                          value={ex.fileSize || ''}
                          onChange={(e) => {
                            const next = (asset.extras || []).map((item, i) => i === idx ? { ...item, fileSize: e.target.value } : item);
                            onUpdate(asset.id, { extras: next });
                          }}
                          {...stop}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-y min-h-[32px]"
                          rows={1}
                          placeholder="文件大小..."
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <textarea
                          value={getExtraNote(ex)}
                          onChange={(e) => setExtraNote(asset, idx, e.target.value)}
                          {...stop}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-y min-h-[32px]"
                          rows={1}
                          placeholder="说明..."
                        />
                      </td>
                      <td className="px-4 py-2 align-top text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const dup = { content: ex.content || '', type: (ex.type || asset.type) as any, formats: [], dimensions: '', fileSize: '', collapsed: true, customFields: ex.customFields ? { ...ex.customFields } : {} };
                            const next = [...(asset.extras || [])];
                            next.splice(idx + 1, 0, dup);
                            onUpdate(asset.id, { extras: next });
                          }}
                          className="text-slate-400 hover:text-indigo-600"
                          title="复制分项"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                        <button
                          onClick={() => {
                            const next = (asset.extras || []).filter((_, i) => i !== idx);
                            onUpdate(asset.id, { extras: next });
                          }}
                          className="text-slate-400 hover:text-red-500"
                          title="移除分项"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                      
                    </tr>
                  ))
                )}
                </React.Fragment>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetList;
