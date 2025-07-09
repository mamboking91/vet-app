// src/app/dashboard/configuracion/contenido/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3, Pilcrow } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onUpdate: (newContent: string) => void;
}

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setColor(event.target.value).run();
  };

  return (
    <div className="border-b border-input bg-transparent rounded-t-md p-1 flex flex-wrap items-center gap-1">
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('paragraph')} onPressedChange={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="h-4 w-4"/></Toggle>

      <div className="relative inline-flex items-center justify-center">
        <button 
            type="button" 
            onClick={() => colorInputRef.current?.click()} 
            className="p-2 h-8 w-8 hover:bg-muted rounded-sm font-bold ring-1 ring-inset ring-stone-300 dark:ring-stone-700" 
            style={{ color: editor.getAttributes('textStyle').color || 'inherit' }}
        >
            A
        </button>
        <input
            type="color"
            ref={colorInputRef}
            onChange={handleColorChange}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default function RichTextEditor({ content, onUpdate }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3], },
        paragraph: {
            HTMLAttributes: {
                class: 'text-lg', // Estilo base para párrafos
            },
        }
      }),
      TextStyle.configure(),
      Color.configure(),
    ],
    content: content,
    editorProps: {
      attributes: {
        // --- CORRECCIÓN AQUÍ ---
        // Aplicamos un fondo ligeramente distinto para el área de edición.
        class: 'prose dark:prose-invert max-w-none p-4 focus:outline-none min-h-[120px] rounded-b-md bg-stone-50 dark:bg-stone-800/50',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  return (
    <div className="rounded-md border border-input">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}