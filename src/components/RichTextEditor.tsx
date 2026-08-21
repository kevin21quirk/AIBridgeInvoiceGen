import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  rows = 5,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '<br>';
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-300">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <select
          onChange={(e) => { exec('fontName', e.target.value); e.target.value = ''; }}
          className="text-sm px-2 py-1 rounded border border-gray-300 bg-white text-gray-700"
          title="Font family"
          defaultValue=""
        >
          <option value="" disabled>Font</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
          <option value="Helvetica">Helvetica</option>
        </select>
        <select
          onChange={(e) => { exec('fontSize', e.target.value); e.target.value = ''; }}
          className="text-sm px-2 py-1 rounded border border-gray-300 bg-white text-gray-700"
          title="Font size"
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          <option value="1">Small</option>
          <option value="2">Normal</option>
          <option value="3">Medium</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        data-placeholder={placeholder}
        className="w-full px-3 py-2 text-sm text-gray-900 min-h-[120px] outline-none rich-text-editor"
        style={{ minHeight: `${rows * 24}px` }}
      />
      <style>{`
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
