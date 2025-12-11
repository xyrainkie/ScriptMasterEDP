import React, { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

const TextareaWithToolbar: React.FC<Props> = ({ value, onChange, placeholder, className, rows = 3, disabled }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyWrap = (left: string, right: string) => {
    const el = ref.current;
    if (!el || disabled) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? s;
    const before = value.slice(0, s);
    const selected = value.slice(s, e);
    const after = value.slice(e);
    const next = `${before}${left}${selected}${right}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      const caretPos = s + left.length + selected.length;
      el.focus();
      el.setSelectionRange(caretPos, caretPos);
    });
  };

  const prefixLines = (prefix: string) => {
    const el = ref.current;
    if (!el || disabled) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? s;
    const before = value.slice(0, s);
    const selected = value.slice(s, e);
    const after = value.slice(e);
    const lines = selected.split(/\r?\n/);
    const prefixed = lines.map(l => (l.length ? `${prefix}${l}` : l)).join('\n');
    const next = `${before}${prefixed}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      const caretPos = s + prefixed.length;
      el.focus();
      el.setSelectionRange(caretPos, caretPos);
    });
  };

  const replaceSelection = (replacer: (text: string) => string) => {
    const el = ref.current;
    if (!el || disabled) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? s;
    const before = value.slice(0, s);
    const selected = value.slice(s, e);
    const after = value.slice(e);
    const nextSel = replacer(selected);
    const next = `${before}${nextSel}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      const caretPos = s + nextSel.length;
      el.focus();
      el.setSelectionRange(caretPos, caretPos);
    });
  };

  const insertAtCaret = (text: string) => {
    const el = ref.current;
    if (!el || disabled) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? s;
    const before = value.slice(0, s);
    const after = value.slice(e);
    const next = `${before}${text}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      const caretPos = s + text.length;
      el.focus();
      el.setSelectionRange(caretPos, caretPos);
    });
  };

  return (
    <div className={`border border-slate-300 rounded-lg overflow-hidden bg-white ${className || ''}`}>
      <div className="flex flex-wrap items-center gap-1 p-1 border-b border-slate-200 bg-white text-slate-600">
        <button type="button" onClick={() => applyWrap('**', '**')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="加粗">
          <i className="fas fa-bold"></i>
        </button>
        <button type="button" onClick={() => applyWrap('*', '*')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="斜体">
          <i className="fas fa-italic"></i>
        </button>
        <button type="button" onClick={() => applyWrap('<u>', '</u>')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="下划线">
          <i className="fas fa-underline"></i>
        </button>
        <button type="button" onClick={() => applyWrap('~~', '~~')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="删除线">
          <i className="fas fa-strikethrough"></i>
        </button>
        <button type="button" onClick={() => applyWrap('`', '`')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="代码">
          <i className="fas fa-code"></i>
        </button>
        <span className="mx-1 w-px h-4 bg-slate-200" />
        <button type="button" onClick={() => prefixLines('- ')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="项目符号">
          <i className="fas fa-list-ul"></i>
        </button>
        <button type="button" onClick={() => prefixLines('1. ')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="编号列表">
          <i className="fas fa-list-ol"></i>
        </button>
        <button type="button" onClick={() => prefixLines('> ')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="引用">
          <i className="fas fa-quote-right"></i>
        </button>
        <span className="mx-1 w-px h-4 bg-slate-200" />
        <button type="button" onClick={() => applyWrap('<mark>', '</mark>')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="高亮">
          <i className="fas fa-highlighter"></i>
        </button>
        <button type="button" onClick={() => insertAtCaret('\n---\n')} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="分隔线">
          <i className="fas fa-minus"></i>
        </button>
        <button type="button" onClick={() => insertAtCaret(new Date().toLocaleString())} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="插入时间">
          <i className="fas fa-clock"></i>
        </button>
        <button type="button" onClick={() => replaceSelection(t => t.toUpperCase())} className="px-2 py-1 text-[10px] rounded hover:bg-slate-100" title="大写">Aa↑</button>
        <button type="button" onClick={() => replaceSelection(t => t.toLowerCase())} className="px-2 py-1 text-[10px] rounded hover:bg-slate-100" title="小写">Aa↓</button>
        <button type="button" onClick={() => replaceSelection(t => t.replace(/\*\*|__|\*|~~|`|<u>|<\/u>|<mark>|<\/mark>/g, ''))} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="清除标记">
          <i className="fas fa-eraser"></i>
        </button>
        <button type="button" onClick={() => replaceSelection(t => t ? `[${t}](https://)` : `[链接文本](https://)`)} className="px-2 py-1 text-xs rounded hover:bg-slate-100" title="插入链接">
          <i className="fas fa-link"></i>
        </button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-2 text-sm outline-none min-h-[80px] resize-y bg-white"
        rows={rows}
        readOnly={!!disabled}
      />
    </div>
  );
};

export default TextareaWithToolbar;
