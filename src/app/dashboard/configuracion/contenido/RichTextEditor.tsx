// src/app/dashboard/configuracion/contenido/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered, Palette } from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap items-center gap-1">
      <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={cn("p-2 rounded hover:bg-accent", editor.isActive('bold') ? 'bg-muted' : '')} type="button" title="Negrita"><Bold className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={cn("p-2 rounded hover:bg-accent", editor.isActive('italic') ? 'bg-muted' : '')} type="button" title="Cursiva"><Italic className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={cn("p-2 rounded hover:bg-accent", editor.isActive('strike') ? 'bg-muted' : '')} type="button" title="Tachado"><Strikethrough className="h-4 w-4" /></button>
      <button onClick={setLink} className={cn("p-2 rounded hover:bg-accent", editor.isActive('link') ? 'bg-muted' : '')} type="button" title="Enlace"><LinkIcon className="h-4 w-4" /></button>
      <div className="relative inline-block" title="Color de Texto">
        <input type="color" onChange={event => editor.chain().focus().setColor(event.target.value).run()} value={editor.getAttributes('textStyle').color || '#000000'} className="absolute opacity-0 w-8 h-8 cursor-pointer" />
        <div className="p-2 rounded hover:bg-accent"><Palette className="h-4 w-4" /></div>
      </div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("p-2 rounded hover:bg-accent", editor.isActive('bulletList') ? 'bg-muted' : '')} type="button" title="Lista"><List className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("p-2 rounded hover:bg-accent", editor.isActive('orderedList') ? 'bg-muted' : '')} type="button" title="Lista numerada"><ListOrdered className="h-4 w-4" /></button>
    </div>
  );
};

interface RichTextEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ initialContent, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        }
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextStyle,
      Color,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[120px] max-w-full rounded-b-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
  });

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
