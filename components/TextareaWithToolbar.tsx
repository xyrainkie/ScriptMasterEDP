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

  return (
    <div className={`border border-slate-300 rounded-lg overflow-hidden bg-white ${className || ''}`}>
      <div className="flex items-center gap-1 p-1 border-b border-slate-200 bg-white text-slate-600">
        <button type="button" onClick={() => applyWrap('**', '**')} className="px-2 py-1 text-xs rounded hover:bg-slate-100">
          <i className="fas fa-bold"></i>
        </button>
        <button type="button" onClick={() => applyWrap('*', '*')} className="px-2 py-1 text-xs rounded hover:bg-slate-100">
          <i className="fas fa-italic"></i>
        </button>
        <button type="button" onClick={() => applyWrap('<u>', '</u>')} className="px-2 py-1 text-xs rounded hover:bg-slate-100">
          <i className="fas fa-underline"></i>
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

