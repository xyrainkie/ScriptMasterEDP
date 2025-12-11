import React, { useState, useEffect } from 'react';
import { CourseProject, Template, Segment, Asset, AssetType, CoursePreset } from './types';
import AssetList from './components/AssetList';
import TextareaWithToolbar from './components/TextareaWithToolbar';

// --- System Default Templates ---
const DEFAULT_TEMPLATES: Template[] = [
    {
        id: 't1',
        name: '互动场景 (Interactive Scene)',
        presets: [
            { id: 'p1', name: '背景图片', type: AssetType.IMAGE, description: '场景大背景', format: 'PNG', dimensions: '1920x1080', uploadInstructions: 'assets/bg/', status: 'PENDING' },
            { id: 'p2', name: '标题音频', type: AssetType.AUDIO, description: '页面标题朗读', format: 'MP3', dimensions: '-', uploadInstructions: 'assets/audio/', status: 'PENDING' },
            { id: 'p3', name: '下一步按钮', type: AssetType.COMPONENT, description: '通用导航', format: 'React', dimensions: '-', uploadInstructions: 'components/NavBtn', status: 'PENDING' }
        ]
    },
    {
        id: 't2',
        name: '视频教学 (Video Lesson)',
        presets: [
            { id: 'v1', name: '教学视频', type: AssetType.VIDEO, description: '核心讲解视频', format: 'MP4', dimensions: '1920x1080', uploadInstructions: 'assets/video/', status: 'PENDING' },
            { id: 'v2', name: '字幕', type: AssetType.COMPONENT, description: 'SRT文件', format: 'SRT', dimensions: '-', uploadInstructions: 'assets/subs/', status: 'PENDING' }
        ]
    },
    {
        id: 't3',
        name: '单词卡片 (Flashcards)',
        presets: [
            { id: 'f1', name: '卡片图片', type: AssetType.IMAGE, description: '单词对应的图片', format: 'PNG', dimensions: '800x600', uploadInstructions: 'assets/cards/', status: 'PENDING' },
            { id: 'f2', name: '单词发音', type: AssetType.AUDIO, description: '单词朗读', format: 'MP3', dimensions: '-', uploadInstructions: 'assets/audio/', status: 'PENDING' }
        ]
    }
];

// --- Default Course Presets ---
const DEFAULT_COURSE_PRESETS: CoursePreset[] = [
    {
        id: 'cp1',
        name: '标准绘本课 (Standard Story)',
        steps: [
            { id: 's1', title: '01. Warm-up', templateId: 't2' }, // Video
            { id: 's2', title: '02. Story Page 1', templateId: 't1' }, // Interactive
            { id: 's3', title: '03. Story Page 2', templateId: 't1' }, // Interactive
            { id: 's4', title: '04. Wrap-up', templateId: 't2' }, // Video
        ]
    }
];

const INITIAL_PROJECT: CourseProject = {
  id: 'course-1',
  title: 'Lesson 1: Demo Course',
  templates: DEFAULT_TEMPLATES,
  coursePresets: DEFAULT_COURSE_PRESETS,
  segments: [] 
};

type ViewState = 'HOME' | 'WORKSPACE';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [project, setProject] = useState<CourseProject>(INITIAL_PROJECT);
  const [activeTab, setActiveTab] = useState<'SCRIPT' | 'CONFIG'>('SCRIPT');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [courseList, setCourseList] = useState<any[]>([]);
  
  // Config Tab State
  const [configMode, setConfigMode] = useState<'TEMPLATE' | 'PRESET'>('TEMPLATE');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_COURSE_PRESETS[0].id);

  // --- Helpers ---
  const updateProject = (updates: Partial<CourseProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleEnterWorkspace = (tab: 'SCRIPT' | 'CONFIG' = 'SCRIPT') => {
      setActiveTab(tab);
      setCurrentView('WORKSPACE');
  };

  // --- Template Management (Config Tab) ---
  const activeTemplate = project.templates.find(t => t.id === selectedTemplateId) || project.templates[0];

  const updateTemplatePresets = (templateId: string, newPresets: Asset[]) => {
      const newTemplates = project.templates.map(t => 
          t.id === templateId ? { ...t, presets: newPresets } : t
      );
      const nextSegments = project.segments.map(seg => {
        if (seg.templateId !== templateId) return seg;
        const updatedAssets = seg.assets.map(a => {
          const preset = newPresets.find(p => p.name === a.name && p.type === a.type);
          if (!preset) return a;
          const presetNote = preset.customFields?.note;
          const currentNote = a.customFields?.note;
          if (!presetNote || (currentNote && currentNote.trim() !== '')) return a;
          const cf = { ...(a.customFields || {}), note: presetNote };
          return { ...a, customFields: cf };
        });
        return { ...seg, assets: updatedAssets };
      });
      updateProject({ templates: newTemplates, segments: nextSegments });
  };

  const updateTemplateName = (templateId: string, newName: string) => {
      const newTemplates = project.templates.map(t => 
          t.id === templateId ? { ...t, name: newName } : t
      );
      updateProject({ templates: newTemplates });
  };

  const updateTemplateThumbnail = (templateId: string, newThumbnail: string) => {
      const newTemplates = project.templates.map(t => 
          t.id === templateId ? { ...t, thumbnail: newThumbnail } : t
      );
      updateProject({ templates: newTemplates });
  };

  const updateTemplateColumns = (templateId: string, cols: string[]) => {
      const newTemplates = project.templates.map(t => 
          t.id === templateId ? { ...t, customColumns: cols } : t
      );
      updateProject({ templates: newTemplates });
  };

  const createTemplate = () => {
      const newTemplate: Template = {
          id: crypto.randomUUID(),
          name: '新模版 (New Template)',
          presets: []
      };
      updateProject({ templates: [...project.templates, newTemplate] });
      setSelectedTemplateId(newTemplate.id);
  };

  const deleteTemplate = (id: string) => {
      if(project.templates.length <= 1) {
          alert("至少保留一个模版");
          return;
      }
      if(confirm("确定删除此模版配置吗？")) {
          const newTemplates = project.templates.filter(t => t.id !== id);
          updateProject({ templates: newTemplates });
          setSelectedTemplateId(newTemplates[0].id);
      }
  };

  // --- Course Preset Management (Config Tab) ---
  const activePreset = project.coursePresets.find(p => p.id === selectedPresetId);

  const createPreset = () => {
      const newPreset: CoursePreset = {
          id: crypto.randomUUID(),
          name: '新课型 (New Course Type)',
          steps: []
      };
      updateProject({ coursePresets: [...project.coursePresets, newPreset] });
      setSelectedPresetId(newPreset.id);
  };

  const updatePresetName = (id: string, name: string) => {
      updateProject({ coursePresets: project.coursePresets.map(p => p.id === id ? { ...p, name } : p) });
  };

  const deletePreset = (id: string) => {
      if(confirm("确定删除此课型配置吗？")) {
        const newPresets = project.coursePresets.filter(p => p.id !== id);
        updateProject({ coursePresets: newPresets });
        if(newPresets.length > 0) setSelectedPresetId(newPresets[0].id);
      }
  };

  const addStepToPreset = (presetId: string) => {
      const preset = project.coursePresets.find(p => p.id === presetId);
      if(!preset) return;
      const newStep = { id: crypto.randomUUID(), title: '新环节', templateId: project.templates[0].id };
      updateProject({ 
          coursePresets: project.coursePresets.map(p => p.id === presetId ? { ...p, steps: [...p.steps, newStep] } : p)
      });
  };

  const updatePresetStep = (presetId: string, stepId: string, updates: any) => {
      // Update preset step
      const nextPresets = project.coursePresets.map(p => p.id === presetId ? {
          ...p,
          steps: p.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
      } : p);

      // If updating note, sync to current segments with matching title/template
      let nextSegments = project.segments;
      if (updates && typeof updates.note !== 'undefined') {
        const preset = nextPresets.find(p => p.id === presetId);
        const step = preset?.steps.find(s => s.id === stepId);
        if (step) {
          nextSegments = project.segments.map(seg => (
            (seg.title === step.title || (seg.templateId === step.templateId && !!step.templateId))
              ? { ...seg, note: updates.note }
              : seg
          ));
        }
      }
      updateProject({ coursePresets: nextPresets, segments: nextSegments });
  };

  const removePresetStep = (presetId: string, stepId: string) => {
      updateProject({
          coursePresets: project.coursePresets.map(p => p.id === presetId ? {
              ...p,
              steps: p.steps.filter(s => s.id !== stepId)
          } : p)
      });
  };

  // --- Segment Management (Script Tab) ---
  const generateSegment = (templateId: string, titleOverride?: string): Segment | null => {
      const template = project.templates.find(t => t.id === templateId);
      if (!template) return null;

      const newAssets: Asset[] = template.presets.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          description: p.description || '', 
          status: 'PENDING',
          enabled: true,
      }));

      return {
          id: crypto.randomUUID(),
          title: titleOverride || template.name,
          templateId: template.id,
          templateName: template.name,
          assets: newAssets
      };
  };

  const addEmptySegment = () => {
      const newSegment: Segment = {
          id: crypto.randomUUID(),
          title: '新环节 (New Segment)',
          templateId: '',
          templateName: '',
          assets: []
      };
      updateProject({ segments: [...project.segments, newSegment] });
  };

  const applyTemplateToSegment = (segmentId: string, templateId: string) => {
      const template = project.templates.find(t => t.id === templateId);
      if(!template) return;

      const newAssets: Asset[] = template.presets.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          description: p.description || '', 
          status: 'PENDING',
          enabled: true,
      }));

      updateProject({
          segments: project.segments.map(s => s.id === segmentId ? {
              ...s,
              templateId: template.id,
              templateName: template.name,
              title: s.title === '新环节 (New Segment)' ? template.name : s.title,
              assets: newAssets
          } : s)
      });
  };

  const removeSegment = (segmentId: string) => {
      if(confirm("确定删除此环节内容吗？")) {
          updateProject({ segments: project.segments.filter(s => s.id !== segmentId) });
      }
  };

  const updateSegment = (segmentId: string, updates: Partial<Segment>) => {
      const nextSegments = project.segments.map(s => s.id === segmentId ? { ...s, ...updates } : s);
      // If updating segment note, also sync to matching preset step (by title)
      let nextPresets = project.coursePresets;
      if (typeof updates.note !== 'undefined') {
        const segCurrent = project.segments.find(s => s.id === segmentId);
        nextPresets = project.coursePresets.map(p => ({
          ...p,
          steps: p.steps.map(st => (
            (st.title === (segCurrent?.title || st.title)) || (st.templateId === (segCurrent?.templateId || st.templateId))
              ? { ...st, note: updates.note as any }
              : st
          ))
        }));
      }
      updateProject({ segments: nextSegments, coursePresets: nextPresets });
  };

  const syncSegmentToTemplate = (segment: Segment) => {
      const template = project.templates.find(t => t.id === segment.templateId);
      if(!template) {
          alert("找不到原模版，可能已被删除。");
          return;
      }
      if(!confirm("警告：这将根据“模版配置”重置此环节的组件列表结构（会尽可能保留同名组件的内容）。确定要同步吗？")) return;

      const newAssets = template.presets.map(preset => {
          const existing = segment.assets.find(a => a.name === preset.name && a.type === preset.type);
          return {
              ...preset,
              id: existing ? existing.id : crypto.randomUUID(), 
              description: existing ? existing.description : (preset.description || ''), 
              status: existing ? existing.status : 'PENDING',
              enabled: existing ? (existing.enabled ?? true) : true,
          };
      });

      updateSegment(segment.id, { assets: newAssets, templateName: template.name });
  };

  // --- Load Course Preset Logic ---
  const loadCoursePreset = (presetId: string) => {
      const preset = project.coursePresets.find(p => p.id === presetId);
      if(!preset) return;

      if(project.segments.length > 0) {
          if(!confirm("当前脚本中已有内容。确定要追加此课型的所有环节吗？")) return;
      }

      const newSegments: Segment[] = [];
      preset.steps.forEach(step => {
          const seg = generateSegment(step.templateId, step.title);
          if(seg) newSegments.push({ ...seg, note: (step as any).note || '' });
      });

      updateProject({ segments: [...project.segments, ...newSegments] });
  };


  // --- Export Excel ---
  const handleExport = () => {
    const renderText = (input: string): string => {
      const s = String(input || '');
      const lines = s.split(/\r?\n/);
      const out: string[] = [];
      let i = 0;
      while (i < lines.length) {
        if (/^\s*---\s*$/.test(lines[i])) { out.push('<hr/>'); i++; continue; }
        if (/^\s*>\s*/.test(lines[i])) {
          const q: string[] = [];
          while (i < lines.length && /^\s*>\s*/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s*/, '')); i++; }
          out.push(`<blockquote>${q.join('<br/>')}</blockquote>`);
          continue;
        }
        if (/^\s*-\s+/.test(lines[i])) {
          const ul: string[] = [];
          while (i < lines.length && /^\s*-\s+/.test(lines[i])) { ul.push(lines[i].replace(/^\s*-\s+/, '')); i++; }
          const items = ul.map(t => `<li>${t}</li>`).join('');
          out.push(`<ul>${items}</ul>`);
          continue;
        }
        if (/^\s*\d+\.\s+/.test(lines[i])) {
          const ol: string[] = [];
          while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { ol.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
          const items = ol.map(t => `<li>${t}</li>`).join('');
          out.push(`<ol>${items}</ol>`);
          continue;
        }
        let t = lines[i];
        t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
             .replace(/\*([^*]+)\*/g, '<em>$1</em>')
             .replace(/~~([^~]+)~~/g, '<del>$1</del>')
             .replace(/`([^`]+)`/g, '<code>$1</code>')
             .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        out.push(t);
        i++;
      }
      return out.join('<br/>');
    };

    let htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Microsoft YaHei', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
          th, td { border: 1px solid #000; padding: 10px; vertical-align: top; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .segment-header { background-color: #e0e7ff; padding: 10px; font-weight: bold; border: 1px solid #000; text-align: left; }
          h2 { color: #333; }
          .extra-row td { background-color: #f9fafb; }
          .extra-table { width: 100%; border-collapse: collapse; }
          .extra-table th, .extra-table td { border: 1px dashed #999; padding: 8px; }
          .label { font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; }
          .segment-note { margin: 8px 0 12px; font-size: 12px; color: #444; }
          .group-cell { background: #f6f8ff; border-left: 2px solid #000; font-weight: 700; text-align: center; }
          .seg-head { width: 100%; border-collapse: collapse; margin: 6px 0 8px; }
          .seg-head td { vertical-align: middle; }
          .seg-title { font-weight: 700; font-size: 14px; }
          .seg-thumb { width: 160px; }
          .seg-thumb img { display: block; max-width: 140px; max-height: 90px; object-fit: contain; border: 1px solid #000; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h2>${project.title} - 课程脚本单</h2>
        <hr/>
    `;

    if (project.segments.length === 0) {
        alert("没有可导出的环节内容。");
        return;
    }

    project.segments.forEach((segment, sIndex) => {
        if (!segment.templateId || segment.assets.length === 0) return; // Skip empty segments

        const tmpl = project.templates.find(t => t.id === segment.templateId);
        const segThumbHtml = tmpl?.thumbnail ? `<img src="${tmpl.thumbnail}" alt="模板示意图" width="140" height="90" style="border:1px solid #000; border-radius:4px;" />` : '';
        htmlContent += `
          <table class="seg-head">
            <tr>
              <td class="seg-title">环节 ${sIndex + 1}: ${segment.title} <span style="font-size:0.8em; color:#666; font-weight:normal;">(模版: ${segment.templateName})</span></td>
              <td class="seg-thumb" width="170" align="right" valign="middle">${segThumbHtml}</td>
            </tr>
          </table>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th style="width: 150px;">组件名称</th>
                <th style="width: 160px;">分项/分项内容</th>
                <th style="width: 120px;">类型</th>
                <th style="width: 160px;">格式</th>
                <th style="width: 140px;">尺寸/规格</th>
                <th style="width: 120px;">文件大小</th>
                <th>内容描述 / 制作说明</th>
              </tr>
            </thead>
            <tbody>
              ${segment.note ? `<tr>
                <td style="background:#f9fafb; font-size:12px; font-weight:700; text-align:center; width:40px;">TG</td>
                <td colspan="7" style="background:#f9fafb; font-size:12px; white-space:normal; line-height:1.4;">${renderText(segment.note || '')}</td>
              </tr>` : ''}
        `;

        
        segment.assets.forEach((asset, aIndex) => {
          if ((asset as any).enabled === false) return;
          const extras = ((asset as any).extras && (asset as any).extras.length) ? ((asset as any).extras as any[]) : [];
          const rowSpan = 1 + extras.length;
          const assetCF = (() => {
            const cf = (asset as any).customFields || {};
            const entries = Object.entries(cf).filter(([k, v]) => String(v || '').length > 0 && !String(k).startsWith('note') && k !== 'selected_types');
            return entries.length ? entries.map(([k, v]) => `${k}：${v}`).join('；') : '';
          })();
          const assetNote = (() => {
            const cf = (asset as any).customFields || {};
            const note = cf.note || '';
            return String(note || '').length ? renderText(note) : '';
          })();
          const typeMulti = (() => {
            const sel = (asset as any).customFields?.selected_types || '';
            const arr = sel.split('|').filter(Boolean);
            return arr.length ? arr.join(', ') : String(asset.type || '');
          })();
          const assetDescLines: string[] = [];
          if (assetNote) assetDescLines.push(assetNote);
          if (assetCF) assetDescLines.push(String(assetCF).replace(/\r?\n/g, '<br/>'));
            const assetDescHtml = assetDescLines.length ? assetDescLines.join('<br/>') : '-';
            htmlContent += `
              <tr>
                <td class="group-cell" rowspan="${rowSpan}">${aIndex + 1}</td>
                <td rowspan="${rowSpan}">${asset.name}</td>
                <td>${asset.description || '-'}</td>
                <td>${typeMulti || '-'}</td>
                <td>${(Array.isArray((asset as any).formats) && (asset as any).formats.length) ? (asset as any).formats.join(', ') : (asset.format || '-')}</td>
                <td>${asset.dimensions || '-'}</td>
                <td>${asset.fileSize || '-'}</td>
                <td>${assetDescHtml}</td>
              </tr>
            `;
          if (extras.length) {
            extras.forEach((ex) => {
              const type = (() => { const sel = ex.customFields?.selected_types || ''; const arr = sel.split('|').filter(Boolean); return arr.length ? arr.join(', ') : (ex.type || asset.type || '-'); })();
              const fmts = (Array.isArray(ex.formats) && ex.formats.length) ? ex.formats.join(', ') : '未选择';
              const note = (ex.customFields && ex.customFields.note) ? renderText(ex.customFields.note) : '';
              const cfString = (() => {
                const cf = ex.customFields || {};
                const entries = Object.entries(cf).filter(([k, v]) => String(v || '').length > 0 && k !== 'note' && k !== 'selected_types');
                return entries.length ? entries.map(([k, v]) => `${k}：${String(v).replace(/\r?\n/g, '<br/>')}`).join('；') : '';
              })();
              const exDescLines: string[] = [];
              if (note) exDescLines.push(note);
              if (cfString) exDescLines.push(cfString);
              const exDescHtml = exDescLines.length ? exDescLines.join('<br/>') : '-';
                htmlContent += `
                  <tr>
                    <td>${ex.content || '-'}</td>
                    <td>${type}</td>
                    <td>${fmts}</td>
                    <td>${ex.dimensions || '-'}</td>
                    <td>${ex.fileSize || '-'}</td>
                    <td>${exDescHtml}</td>
                  </tr>
                `;
              });
            }
        });
        htmlContent += `</tbody></table>`;
      });

    htmlContent += `</body></html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}_完整脚本.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Print / PDF ---
  const handlePrint = () => {
      window.print();
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-zA-Z0-9\-_]/g,'_')}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed || !parsed.id || !parsed.title || !parsed.templates || !parsed.coursePresets || !parsed.segments) {
          alert('导入的JSON不符合项目数据结构');
          return;
        }
        setProject(parsed);
        alert('导入成功');
        setSettingsOpen(false);
      } catch (e) {
        alert('JSON解析失败');
      }
    };
    reader.readAsText(file);
  };

  const saveToLocal = () => {
    try {
      localStorage.setItem('scriptmaster_project', JSON.stringify(project));
      alert('已保存到本地');
    } catch {}
  };

  const loadFromLocal = () => {
    try {
      const data = localStorage.getItem('scriptmaster_project');
      if (!data) { alert('本地无保存数据'); return; }
      const parsed = JSON.parse(data);
      if (!parsed || !parsed.id || !parsed.title || !parsed.templates || !parsed.coursePresets || !parsed.segments) {
        alert('本地数据格式不正确');
        return;
      }
      setProject(parsed);
      alert('已从本地加载');
    } catch { alert('加载失败'); }
  };

  const clearLocal = () => {
    localStorage.removeItem('scriptmaster_project');
    alert('已清除本地保存');
  };

  const loadCourseList = () => {
    try {
      const data = localStorage.getItem('scriptmaster_courses');
      setCourseList(data ? (JSON.parse(data) || []) : []);
    } catch { setCourseList([]); }
  };

  const saveCourseToList = (proj: any = project) => {
    try {
      const data = localStorage.getItem('scriptmaster_courses');
      const list = data ? (JSON.parse(data) || []) : [];
      const idx = list.findIndex((c: any) => c.id === proj.id);
      const entry = { ...proj, updatedAt: Date.now() };
      if (idx >= 0) list[idx] = entry; else list.unshift(entry);
      localStorage.setItem('scriptmaster_courses', JSON.stringify(list));
      setCourseList(list);
      alert('课程已保存到本地列表');
    } catch {}
  };

  const openCourse = (id: string) => {
    try {
      const data = localStorage.getItem('scriptmaster_courses');
      const list = data ? (JSON.parse(data) || []) : [];
      const found = list.find((c: any) => c.id === id);
      if (!found) { alert('课程不存在'); return; }
      setProject(found);
      setActiveTab('SCRIPT');
      setCurrentView('WORKSPACE');
    } catch { alert('打开失败'); }
  };

  const deleteCourse = (id: string) => {
    try {
      if (!confirm('确定删除此课程吗？此操作不可恢复')) return;
      const data = localStorage.getItem('scriptmaster_courses');
      const list = data ? (JSON.parse(data) || []) : [];
      const next = list.filter((c: any) => c.id !== id);
      localStorage.setItem('scriptmaster_courses', JSON.stringify(next));
      setCourseList(next);
      alert('课程已删除');
    } catch { alert('删除失败'); }
  };

  const createNextLesson = () => {
    const id = crypto.randomUUID();
    const title = (() => {
      const m = /Lesson\s*(\d+)/i.exec(project.title);
      if (m) {
        const n = parseInt(m[1], 10) + 1;
        return project.title.replace(/Lesson\s*\d+/i, `Lesson ${n}`);
      }
      return project.title + ' - Next Lesson';
    })();
    const next = { ...project, id, title, segments: project.segments.map(s => ({ ...s, id: crypto.randomUUID() })) };
    setProject(next);
    saveCourseToList(next);
    alert('已创建下一节课');
  };

  useEffect(() => { loadCourseList(); }, []);


  // --- VIEW: HOME SCREEN ---
  if (currentView === 'HOME') {
      return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col items-center justify-center p-6 relative">
              
              {/* API Key Selector */}
              <div className="absolute top-6 right-6">
                <button 
                    onClick={async () => {
                        if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
                            await (window as any).aistudio.openSelectKey();
                            window.location.reload(); // Refresh to ensure env pick up
                        } else {
                            console.warn("AI Studio environment not detected.");
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-slate-600 text-sm font-bold rounded-full border border-slate-200 hover:border-indigo-300 shadow-sm transition-all"
                >
                    <i className="fas fa-key text-indigo-500"></i>
                    <span>设置 API Key</span>
                </button>
              </div>

              <div className="text-center mb-12">
                  <div className="inline-block p-4 rounded-2xl bg-indigo-600 text-white shadow-xl mb-6">
                      <i className="fas fa-layer-group text-4xl"></i>
                  </div>
                  <h1 className="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">英语课程脚本自动化生成平台</h1>
                  <p className="text-slate-500 text-lg">高效协作 · 模版驱动 · 智能生成</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                  
                  {/* Card 1: New Script */}
                  <button 
                    onClick={() => handleEnterWorkspace('SCRIPT')}
                    className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-50 hover:border-indigo-500 hover:shadow-xl transition-all group text-left relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <i className="fas fa-file-signature text-8xl text-indigo-600"></i>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                          <i className="fas fa-plus"></i>
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">开始新课程脚本</h2>
                      <p className="text-slate-500 text-sm">创建新的课程项目，调取预设模版，快速生成脚本表单。</p>
                  </button>

                  {/* Card 2: Config */}
                  <button 
                    onClick={() => handleEnterWorkspace('CONFIG')}
                    className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all group text-left relative overflow-hidden"
                  >
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <i className="fas fa-cogs text-8xl text-slate-600"></i>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                          <i className="fas fa-sliders-h"></i>
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">模版库管理</h2>
                      <p className="text-slate-500 text-sm">配置通用的组件模版、定义课型流程结构。</p>
                  </button>
              </div>

              <div className="mt-12 w-full max-w-4xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700">已建课程</h3>
                    <button onClick={loadCourseList} className="text-xs text-slate-500 hover:text-indigo-600">刷新</button>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">标题</th>
                          <th className="px-3 py-2 text-left">更新时间</th>
                          <th className="px-3 py-2 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(courseList || []).length === 0 ? (
                          <tr><td className="px-3 py-3 text-slate-400" colSpan={3}>暂无课程</td></tr>
                        ) : (
                          courseList.map((c: any) => (
                            <tr key={c.id} className="border-t border-slate-100">
                              <td className="px-3 py-2">{c.title}</td>
                              <td className="px-3 py-2 text-slate-500">{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '-'}</td>
                              <td className="px-3 py-2 text-right">
                                <button onClick={() => openCourse(c.id)} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 mr-2">打开</button>
                                <button onClick={() => deleteCourse(c.id)} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-red-50 text-red-600">删除</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
              </div>
          </div>
      );
  }

  // --- VIEW: WORKSPACE (SCRIPT / CONFIG) ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Workspace Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('HOME')}>
             <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-sm hover:bg-indigo-700 transition-colors">
                <i className="fas fa-home text-xs"></i>
             </div>
             <h1 className="font-bold text-lg text-slate-800 hidden md:block">英语课程脚本自动化生成平台</h1>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={handlePrint} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all">
                <i className="fas fa-print"></i> 打印 / PDF
             </button>
             <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all">
                <i className="fas fa-file-excel"></i> 导出 Excel
             </button>
             <button onClick={() => saveCourseToList()} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all">
                <i className="fas fa-save"></i> 保存
             </button>
             <button onClick={createNextLesson} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all">
                <i className="fas fa-forward"></i> 新建下一节课
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[100rem] mx-auto w-full p-6 flex flex-col gap-6">
        
        {/* Top Bar: Title & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 no-print">
            {activeTab === 'SCRIPT' && (
              <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-slate-400 uppercase">课程名称</label>
                  <input 
                      type="text" 
                      value={project.title}
                      onChange={(e) => updateProject({ title: e.target.value })}
                      className="w-full text-2xl font-bold bg-transparent border-b border-slate-300 focus:border-indigo-600 outline-none pb-1"
                  />
              </div>
            )}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200 tab-nav">
                 <button 
                    onClick={() => setActiveTab('SCRIPT')}
                    className={`px-6 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'SCRIPT' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fas fa-pen-nib"></i> 脚本编写 (Script)
                </button>
                <button 
                    onClick={() => setActiveTab('CONFIG')}
                    className={`px-6 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'CONFIG' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fas fa-sliders-h"></i> 模版配置 (Config)
                </button>
                <button 
                    onClick={() => setSettingsOpen(true)}
                    className="ml-2 px-3 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                >
                    <i className="fas fa-cog"></i> 设置
                </button>
            </div>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block mb-8">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="text-sm text-slate-500">生成时间: {new Date().toLocaleDateString()}</p>
        </div>

        {/* --- CONFIG TAB --- */}
        {activeTab === 'CONFIG' && (
            <div className="flex flex-col gap-4 h-[calc(100vh-64px)]">
                
                {/* Config Sub-Navigation */}
                <div className="flex gap-2 border-b border-slate-200 pb-2 no-print">
                    <button 
                        onClick={() => setConfigMode('TEMPLATE')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${configMode === 'TEMPLATE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                    >
                        <i className="fas fa-cubes mr-1"></i> 组件模版定义
                    </button>
                    <button 
                        onClick={() => setConfigMode('PRESET')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${configMode === 'PRESET' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                    >
                        <i className="fas fa-stream mr-1"></i> 课型流程编排
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 flex-grow overflow-hidden">
                    
                    {/* LEFT SIDEBAR (Shared for both modes, but switches content) */}
                    <div className="w-full md:w-1/6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden config-sidebar">
                        
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <span className="font-bold text-slate-600 text-sm">
                                {configMode === 'TEMPLATE' ? '组件模版库' : '课型列表'}
                            </span>
                            <button 
                                onClick={configMode === 'TEMPLATE' ? createTemplate : createPreset}
                                className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition-colors" 
                                title="新建"
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>

                        {/* Sidebar List */}
                        <div className="overflow-y-auto flex-grow p-2 space-y-1">
                            {configMode === 'TEMPLATE' ? (
                                // Template List
                                project.templates.map(t => (
                                    <div 
                                        key={t.id}
                                        onClick={() => setSelectedTemplateId(t.id)}
                                        className={`p-3 rounded-lg cursor-pointer text-sm font-medium flex justify-between items-center group transition-all ${selectedTemplateId === t.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <span className="truncate">{t.name}</span>
                                        {project.templates.length > 1 && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                                                className={`opacity-0 group-hover:opacity-100 p-1 rounded ${selectedTemplateId === t.id ? 'text-indigo-200 hover:text-white hover:bg-indigo-500' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                // Preset List
                                project.coursePresets.map(p => (
                                    <div 
                                        key={p.id}
                                        onClick={() => setSelectedPresetId(p.id)}
                                        className={`p-3 rounded-lg cursor-pointer text-sm font-medium flex justify-between items-center group transition-all ${selectedPresetId === p.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <span className="truncate">{p.name}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}
                                            className={`opacity-0 group-hover:opacity-100 p-1 rounded ${selectedPresetId === p.id ? 'text-indigo-200 hover:text-white hover:bg-indigo-500' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT EDITOR (Switches based on Mode) */}
                    <div className="w-full md:w-5/6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in">
                        
                        {/* MODE 1: TEMPLATE DEFINITION */}
                        {configMode === 'TEMPLATE' && (
                            <>
                                <div className="p-6 border-b border-slate-100 bg-slate-50">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">模版名称</label>
                                    <input 
                                        type="text" 
                                        value={activeTemplate.name}
                                        onChange={(e) => updateTemplateName(activeTemplate.id, e.target.value)}
                                        className="w-full text-lg font-bold bg-white border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <div className="mt-4">
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">模板示意图</label>
                                      {activeTemplate.thumbnail ? (
                                        <div className="flex items-start gap-4">
                                          <img src={activeTemplate.thumbnail} alt="模板示意图" className="w-48 h-32 object-cover rounded border border-slate-200" />
                                          <div className="flex flex-col gap-2">
                                            <label className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 cursor-pointer">
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  const reader = new FileReader();
                                                  reader.onload = () => updateTemplateThumbnail(activeTemplate.id, String(reader.result || ''));
                                                  reader.readAsDataURL(file);
                                                }}
                                              />
                                              更换图片
                                            </label>
                                            <button
                                              onClick={() => updateTemplateThumbnail(activeTemplate.id, '')}
                                              className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50"
                                            >
                                              移除
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <label className="flex items-center justify-center w-48 h-32 border border-dashed border-slate-300 rounded bg-white text-slate-400 text-xs cursor-pointer hover:border-indigo-400 hover:text-indigo-600">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const reader = new FileReader();
                                              reader.onload = () => updateTemplateThumbnail(activeTemplate.id, String(reader.result || ''));
                                              reader.readAsDataURL(file);
                                            }}
                                          />
                                          上传示意图
                                        </label>
                                      )}
                                    </div>
                                </div>
                                <div className="p-8 flex-grow overflow-y-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-slate-600">组件结构定义</h3>
                                        <button 
                                            onClick={() => {
                                                updateTemplatePresets(
                                                  activeTemplate.id,
                                                  [
                                                    ...activeTemplate.presets,
                                                    { id: crypto.randomUUID(), sectionId: crypto.randomUUID(), name: '新组件', type: AssetType.COMPONENT, description: '', dimensions: '', uploadInstructions: '', fileSize: '', status: 'PENDING', formats: [], extras: [] }
                                                  ]
                                                );
                                            }}
                                              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                             <i className="fas fa-plus mr-1"></i> 添加组件
                                        </button>
                                    </div>
                                    {(() => {
                                        const groupsMap = new Map<string, Asset[]>();
                                        for (const a of activeTemplate.presets) {
                                            const key = a.sectionId || 'default';
                                            const arr = groupsMap.get(key);
                                            if (arr) arr.push(a); else groupsMap.set(key, [a]);
                                        }
                                        const groups = Array.from(groupsMap.values());
                                        return groups.map((group, idx) => (
                                            <AssetList 
                                                key={`group-${idx}`}
                                                assets={group}
                                                onUpdate={(id, u) => updateTemplatePresets(activeTemplate.id, activeTemplate.presets.map(p => p.id === id ? { ...p, ...u } : p))}
                                                onRemove={(id) => updateTemplatePresets(activeTemplate.id, activeTemplate.presets.filter(p => p.id !== id))}
                                                viewMode="TABLE"
                                                columns={activeTemplate.customColumns || []}
                                                onColumnsChange={(cols) => updateTemplateColumns(activeTemplate.id, cols)}
                                                editableColumns={true}
                                            />
                                        ));
                                    })()}
                                </div>
                            </>
                        )}

                        {/* MODE 2: COURSE PRESET FLOW */}
                        {configMode === 'PRESET' && activePreset && (
                            <>
                                <div className="p-6 border-b border-slate-100 bg-slate-50">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">课型名称</label>
                                    <input 
                                        type="text" 
                                        value={activePreset.name}
                                        onChange={(e) => updatePresetName(activePreset.id, e.target.value)}
                                        className="w-full text-lg font-bold bg-white border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="p-6 flex-grow overflow-y-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-slate-600">教学环节编排</h3>
                                        <button 
                                            onClick={() => addStepToPreset(activePreset.id)}
                                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                            <i className="fas fa-plus mr-1"></i> 添加环节
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {activePreset.steps.length === 0 && (
                                            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                点击右上角添加此课型的教学环节
                                            </div>
                                        )}
                                        {activePreset.steps.map((step, idx) => (
                                            <div key={step.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 group">
                                                <div className="bg-slate-200 text-slate-500 font-bold w-8 h-8 flex items-center justify-center rounded-full text-xs">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-grow">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400">环节标题</label>
                                                    <input 
                                                        type="text" 
                                                        value={step.title}
                                                        onChange={(e) => updatePresetStep(activePreset.id, step.id, { title: e.target.value })}
                                                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div className="w-1/3">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400">调取模版</label>
                                                    <select 
                                                        value={step.templateId}
                                                        onChange={(e) => updatePresetStep(activePreset.id, step.id, { templateId: e.target.value })}
                                                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-500"
                                                    >
                                                        {project.templates.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-1/3">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400">TG</label>
                                                    <textarea 
                                                        value={(step as any).note || ''}
                                                        onChange={(e) => updatePresetStep(activePreset.id, step.id, { note: e.target.value } as any)}
                                                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-500 resize-y min-h-[80px]"
                                                        rows={3}
                                                        placeholder="此环节备注"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => removePresetStep(activePreset.id, step.id)}
                                                    className="mt-4 text-slate-300 hover:text-red-500 p-2"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        {configMode === 'PRESET' && !activePreset && (
                            <div className="p-10 text-center text-slate-400">请新建或选择一个课型</div>
                        )}

                    </div>
                </div>
            </div>
        )}

        {/* --- SCRIPT TAB --- */}
        {activeTab === 'SCRIPT' && (
            <div className="flex flex-col gap-8 pb-20">
                
                {/* Quick Action: Load Course Preset */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm quick-action-card no-print">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                            <i className="fas fa-magic"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900 text-sm">快速开始：调取课型</h3>
                            <p className="text-xs text-indigo-700/70">选择已配置好的课型流程，一键生成脚本骨架。</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select 
                            className="flex-grow md:w-64 bg-white border border-indigo-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) => {
                                if(e.target.value) {
                                    loadCoursePreset(e.target.value);
                                    e.target.value = ''; // reset
                                }
                            }}
                        >
                            <option value="">-- 选择课型并加载 --</option>
                            {project.coursePresets.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Segments List */}
                {project.segments.map((segment, index) => (
                    <div key={segment.id} className="bg白 rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in group segment-card">
                        {/* Segment Header */}
                        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <span className="bg-slate-200 text-slate-600 font-bold text-xs px-2 py-1 rounded">#{index + 1}</span>
                                <input 
                                    type="text"
                                    value={segment.title}
                                    onChange={(e) => updateSegment(segment.id, { title: e.target.value })}
                                    className="font-bold text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none transition-colors w-full md:w-auto"
                                    placeholder="输入环节标题"
                                />
                                {segment.templateName && (
                                    <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        <i className="fas fa-cubes mr-1"></i> {segment.templateName}
                                    </span>
                                )}
                                {(() => {
                                    const tmpl = project.templates.find(t => t.id === segment.templateId);
                                    if (!tmpl) return null;
                                    return (
                                      <div className="no-print flex items-center gap-2">
                                        {tmpl.thumbnail && (
                                          <img
                                            src={tmpl.thumbnail}
                                            alt="模板示意图"
                                            loading="lazy"
                                            className="w-24 h-16 md:w-32 md:h-20 object-cover rounded border border-slate-200"
                                          />
                                        )}
                                        <label className="text-[10px] bg-white text-slate-700 px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 cursor-pointer">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const reader = new FileReader();
                                              reader.onload = () => updateTemplateThumbnail(tmpl.id, String(reader.result || ''));
                                              reader.readAsDataURL(file);
                                            }}
                                          />
                                          更换示意图
                                        </label>
                                      </div>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2 no-print">
                                {segment.templateId && (
                                    <button 
                                        onClick={() => updateSegment(segment.id, { templateId: '', templateName: '', assets: [] })}
                                        className="text-xs text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                                        title="重新选择其他模版"
                                    >
                                        <i className="fas fa-exchange-alt mr-1"></i> 重选模版
                                    </button>
                                )}
                                {segment.templateId && (
                                    <button 
                                        onClick={() => syncSegmentToTemplate(segment)}
                                        className="text-xs text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                                        title="将当前组件列表重置为模版最新结构"
                                    >
                                        <i className="fas fa-sync-alt mr-1"></i> 同步配置
                                    </button>
                                )}
                                <button 
                                    onClick={() => removeSegment(segment.id)}
                                    className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                                >
                                    <i className="fas fa-trash-alt mr-1"></i> 删除
                                </button>
                            </div>
                        </div>

                        {/* Segment Body */}
                        <div className="p-4 md:p-6 transition-all">
                            {!segment.templateId ? (
                                // No Template Selected: Show Template Grid
                                <div className="text-center py-6 no-print">
                                    <div className="text-sm text-slate-400 mb-4 font-bold uppercase tracking-wider">请选择该环节的模版</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                                        {project.templates.map(t => (
                                            <button 
                                                key={t.id}
                                                onClick={() => applyTemplateToSegment(segment.id, t.id)}
                                                className="flex flex-col items-center justify-center gap-2 p-6 border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md hover:bg-indigo-50/20 transition-all group/btn"
                                            >
                                                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover/btn:bg-indigo-100 group-hover/btn:text-indigo-600 transition-colors">
                                                    <i className="fas fa-layer-group"></i>
                                                </div>
                                                <span className="font-bold text-slate-600 text-sm group-hover/btn:text-indigo-700">{t.name}</span>
                                                <span className="text-[10px] text-slate-400">{t.presets.length} 个组件</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // Template Selected: Show Form
                                <>
                                    <AssetList 
                                        assets={segment.assets}
                                        onUpdate={(id, u) => updateSegment(segment.id, { assets: segment.assets.map(a => a.id === id ? { ...a, ...u } : a) })}
                                        onRemove={(id) => updateSegment(segment.id, { assets: segment.assets.filter(a => a.id !== id) })}
                                        viewMode="FORM"
                                        columns={(project.templates.find(t => t.id === segment.templateId)?.customColumns) || []}
                                        editableColumns={false}
                                    />
                                     {/* Extra Add Button inside segment if they need ad-hoc assets */}
                                     <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center no-print">
                                        <button 
                                            onClick={() => updateSegment(segment.id, { assets: [...segment.assets, { id: crypto.randomUUID(), name: '临时组件', type: AssetType.COMPONENT, description: '', dimensions: '', format: '', uploadInstructions: '', fileSize: '', status: 'PENDING', formats: [], extras: [] }] })}
                                            className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                                        >
                                            <i className="fas fa-plus-circle mr-1"></i> 在此环节追加临时组件
                                        </button>
                                     </div>
                                     <div className="mt-4">
                                      <label className="text-[10px] uppercase font-bold text-slate-400">TG</label>
                                       <TextareaWithToolbar
                                         value={segment.note || ''}
                                         onChange={(v) => updateSegment(segment.id, { note: v })}
                                         placeholder="在此输入对此环节的整体说明（可调节大小）"
                                         rows={4}
                                       />
                                     </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add Segment Button (Bottom) */}
                <button 
                    onClick={addEmptySegment}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-white hover:border-indigo-400 hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all group add-segment-btn no-print"
                >
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 group-hover:border-indigo-200 group-hover:bg-indigo-50">
                        <i className="fas fa-plus text-lg"></i>
                    </div>
                    <span className="font-bold">添加新环节</span>
                </button>

            </div>
        )}

      </main>
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl border border-slate-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-700">数据设置</h3>
              <button onClick={() => setSettingsOpen(false)} className="text-slate-500 hover:text-slate-700"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={handleExportJSON} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700">导出 JSON</button>
                <label className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 cursor-pointer">
                  导入 JSON
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportJSON(f); }} />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={saveToLocal} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-700">保存到本地</button>
                <button onClick={loadFromLocal} className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">从本地加载</button>
                <button onClick={clearLocal} className="text-xs bg-white text-red-600 px-3 py-1.5 rounded border border-red-300 hover:bg-red-50">清除本地</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
