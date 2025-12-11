
import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  className,
  height = "min-h-[200px]"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
       if (value === '' || editorRef.current.innerHTML === '<br>') {
         editorRef.current.innerHTML = value;
       }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const createLink = () => {
    const url = window.prompt('输入链接地址', 'https://');
    if (!url) return;
    execCommand('createLink', url);
  };

  const setFontSize = (size: string) => {
    execCommand('fontSize', size);
  };

  const insertTable = () => {
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px;">
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">内容 1</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">内容 2</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    document.execCommand('insertHTML', false, tableHTML);
    handleInput();
  };

  const applyPreset = (preset: 'title' | 'body' | 'highlight' | 'note') => {
    editorRef.current?.focus();
    switch(preset) {
        case 'title':
            execCommand('formatBlock', 'H4');
            break;
        case 'body':
            execCommand('formatBlock', 'P');
            execCommand('removeFormat');
            break;
        case 'highlight':
            execCommand('backColor', '#fef08a'); 
            break;
        case 'note':
            const noteHtml = `<div style="background-color: #f1f5f9; padding: 8px; border-left: 3px solid #6366f1; color: #475569; font-size: 0.9em; margin: 8px 0;">批注: ...</div><p><br/></p>`;
            document.execCommand('insertHTML', false, noteHtml);
            break;
    }
    handleInput();
  };

  const ToolbarButton = ({ icon, cmd, arg, title, active = false }: any) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        execCommand(cmd, arg);
      }}
      className={`p-1 rounded transition-colors ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}`}
      title={title}
    >
      <i className={`fas ${icon} text-xs`}></i>
    </button>
  );

  return (
    <div className={`flex flex-col border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all ${className}`}>
      {label && <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 border-b border-slate-200">
        {label}
      </div>}
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-slate-200 bg-white">
        
        {/* Presets (remove 批注) */}
        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-200">
            <button onClick={() => applyPreset('title')} className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 rounded">标题</button>
            <button onClick={() => applyPreset('highlight')} className="px-1.5 py-0.5 text-[10px] bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded">高亮</button>
        </div>

        {/* Basic */}
        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-200">
            <ToolbarButton icon="fa-bold" cmd="bold" title="加粗" />
            <ToolbarButton icon="fa-italic" cmd="italic" title="斜体" />
            <ToolbarButton icon="fa-underline" cmd="underline" title="下划线" />
            <ToolbarButton icon="fa-strikethrough" cmd="strikeThrough" title="删除线" />
            <ToolbarButton icon="fa-remove-format" cmd="removeFormat" title="清除格式" />
        </div>
        
        {/* Lists (remove 列表/编号) */}
        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-200">
            <ToolbarButton icon="fa-indent" cmd="indent" title="增加缩进" />
            <ToolbarButton icon="fa-outdent" cmd="outdent" title="减少缩进" />
        </div>

        {/* Inserts */}
        <div className="flex items-center gap-0.5">
            <button type="button" onClick={insertTable} className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded" title="插入表格">
                <i className="fas fa-table text-xs"></i>
            </button>
            <button type="button" onClick={() => execCommand('insertHorizontalRule')} className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded" title="分隔线">
                <i className="fas fa-minus text-xs"></i>
            </button>
            <button type="button" onClick={createLink} className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded" title="链接">
                <i className="fas fa-link text-xs"></i>
            </button>
            <div className="flex items-center ml-2" title="文字颜色">
                <input type="color" className="w-3.5 h-3.5 p-0 border-0 rounded cursor-pointer" onChange={(e) => execCommand('foreColor', e.target.value)} />
            </div>
            <div className="flex items-center ml-2" title="背景颜色">
                <input type="color" className="w-3.5 h-3.5 p-0 border-0 rounded cursor-pointer" onChange={(e) => execCommand('backColor', e.target.value)} />
            </div>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-200">
            <ToolbarButton icon="fa-align-left" cmd="justifyLeft" title="左对齐" />
            <ToolbarButton icon="fa-align-center" cmd="justifyCenter" title="居中" />
            <ToolbarButton icon="fa-align-right" cmd="justifyRight" title="右对齐" />
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-slate-200">
            <select onChange={(e) => setFontSize(e.target.value)} className="text-xs bg-white border border-slate-300 rounded px-2 py-1">
              <option value="">字号</option>
              <option value="2">小</option>
              <option value="3">标准</option>
              <option value="4">中</option>
              <option value="5">大</option>
            </select>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
            <ToolbarButton icon="fa-undo" cmd="undo" title="撤销" />
            <ToolbarButton icon="fa-redo" cmd="redo" title="重做" />
            <ToolbarButton icon="fa-superscript" cmd="superscript" title="上标" />
            <ToolbarButton icon="fa-subscript" cmd="subscript" title="下标" />
        </div>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        className={`flex-grow p-4 outline-none prose prose-sm prose-slate max-w-none text-slate-700 leading-normal overflow-y-auto ${height}`}
        contentEditable
        onInput={handleInput}
        placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }} 
      />
    </div>
  );
};

export default RichTextEditor;
