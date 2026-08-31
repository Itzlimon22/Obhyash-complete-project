import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Image as ImageIcon,
  Calculator,
  SquareSigma,
  Code2,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Plus,
  Minus,
  Loader2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
  editorClassName?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  showToolbar = true,
  editorClassName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'এখানে লিখুন (Markdown & LaTeX supported)...',
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        className: `prose dark:prose-invert max-w-none w-full outline-none px-4 py-3 ${
          editorClassName || 'min-h-[150px]'
        }`,
      },
    },
    onUpdate: ({ editor }) => {
      try {
        let markdown = (
          editor.storage as unknown as {
            markdown: { getMarkdown: () => string };
          }
        ).markdown.getMarkdown();
        // tiptap-markdown escapes backslashes inside math blocks (\text → \\text).
        // Restore single backslashes so LaTeX commands are saved and rendered correctly.
        markdown = markdown.replace(
          /(\$\$[\s\S]*?\$\$|\$(?!\$)[^\n]*?\$)/g,
          (match) => match.replace(/\\\\([a-zA-Z{])/g, '\\$1'),
        );
        onChange(markdown);
      } catch (e) {
        console.warn('Markdown serialization failed, falling back to text', e);
        onChange(editor.getText());
      }
    },
  });

  useEffect(() => {
    if (
      editor &&
      value !==
        (
          editor.storage as unknown as {
            markdown: { getMarkdown: () => string };
          }
        ).markdown.getMarkdown()
    ) {
      if (value === '' && editor.getText() !== '') {
        editor.commands.setContent('');
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const insertMath = (block: boolean) => {
    if (block) {
      editor.chain().focus().insertContent('\n\n$$\n\n$$\n\n').run();
    } else {
      editor.chain().focus().insertContent('$ $').run();
    }
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'questions');

      const res = await fetch('/api/r2-upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Image upload failed');
      }

      const resData = await res.json();
      const uploadedUrl = resData.publicUrl || resData.url;

      if (uploadedUrl && editor) {
        // Insert image at cursor
        editor.chain().focus().setImage({ src: uploadedUrl, alt: file.name }).run();
      }
    } catch (err) {
      console.error('R2 Image Upload Error:', err);
      alert('ইমেজ আপলোড ব্যর্থ হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-950 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all relative">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Sticky Top Floating Toolbar - always visible on top */}
      {showToolbar && editor && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 bg-neutral-50/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800">
          {/* Text Formatting */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              icon={<Bold size={14} />}
              label="Bold (Ctrl+B)"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              icon={<Italic size={14} />}
              label="Italic (Ctrl+I)"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              icon={<UnderlineIcon size={14} />}
              label="Underline (Ctrl+U)"
            />
          </div>

          {/* Headings */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <MenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive('heading', { level: 1 })}
              icon={<Heading1 size={14} />}
              label="Heading 1"
            />
            <MenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive('heading', { level: 2 })}
              icon={<Heading2 size={14} />}
              label="Heading 2"
            />
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              icon={<List size={14} />}
              label="Bullet List"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              icon={<ListOrdered size={14} />}
              label="Numbered List"
            />
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              icon={<AlignLeft size={14} />}
              label="Align Left"
            />
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              icon={<AlignCenter size={14} />}
              label="Align Center"
            />
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              icon={<AlignRight size={14} />}
              label="Align Right"
            />
          </div>

          {/* Math & Media & Table Tools */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <MenuButton
              onClick={() => insertMath(false)}
              isActive={false}
              icon={<Calculator size={14} className="text-blue-500" />}
              label="Inline Math ($...$)"
            />
            <MenuButton
              onClick={() => insertMath(true)}
              isActive={false}
              icon={<SquareSigma size={14} className="text-indigo-500" />}
              label="Math Block ($$...$$)"
            />
            <MenuButton
              onClick={insertTable}
              isActive={editor.isActive('table')}
              icon={<TableIcon size={14} className="text-emerald-500" />}
              label="Insert Table"
            />
            <MenuButton
              onClick={() => fileInputRef.current?.click()}
              isActive={false}
              icon={
                isUploadingImage ? (
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                ) : (
                  <ImageIcon size={14} className="text-amber-500" />
                )
              }
              label="Upload & Insert Inline Image (R2)"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              icon={<Code2 size={14} />}
              label="Code Block"
            />
          </div>

          {isUploadingImage && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 animate-pulse ml-1">
              <Loader2 size={12} className="animate-spin" />
              ছবি আপলোড হচ্ছে...
            </span>
          )}
        </div>
      )}
      {/* Bubble Menu - Formatting & Table Controls */}
      {editor && (
        <BubbleMenu
          className="flex flex-wrap gap-1 p-1 bg-white dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 rounded-lg shadow-lg max-w-[90vw]"
          editor={editor}
          shouldShow={({ editor, view, state, from, to }) => {
            // Show if selection is not empty OR if active in abstract node (like Table)
            // But BubbleMenu default is !selection.empty
            // We want it to show for Table even if selection is empty (cursor inside)
            if (editor.isActive('table')) {
              return true;
            }
            return !state.selection.empty;
          }}
        >
          {/* Text Formatting */}
          <div className="flex gap-1 items-center">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              icon={<Bold size={14} />}
              label="Bold"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              icon={<Italic size={14} />}
              label="Italic"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              icon={<UnderlineIcon size={14} />}
              label="Underline"
            />
            <div className="w-px h-4 bg-paper-200 dark:bg-obsidian-700 mx-1" />
            <MenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive('heading', { level: 1 })}
              icon={<Heading1 size={14} />}
              label="H1"
            />
            <MenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive('heading', { level: 2 })}
              icon={<Heading2 size={14} />}
              label="H2"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              icon={<Code2 size={14} />}
              label="Code"
            />
          </div>

          <div className="w-px h-5 bg-paper-200 dark:bg-obsidian-700 mx-1 self-center" />

          {/* Alignment */}
          <div className="flex gap-1 items-center">
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              icon={<AlignLeft size={14} />}
              label="Align Left"
            />
            <MenuButton
              onClick={() =>
                editor.chain().focus().setTextAlign('center').run()
              }
              isActive={editor.isActive({ textAlign: 'center' })}
              icon={<AlignCenter size={14} />}
              label="Align Center"
            />
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              icon={<AlignRight size={14} />}
              label="Align Right"
            />
          </div>

          <div className="w-px h-5 bg-paper-200 dark:bg-obsidian-700 mx-1 self-center" />

          <MenuButton
            onClick={() => insertMath(false)}
            isActive={false}
            icon={<Calculator size={14} />}
            label="Inline Math"
          />

          {/* Table Controls - Only visible when in table */}
          {editor.isActive('table') && (
            <>
              <div className="w-px h-5 bg-paper-200 dark:bg-obsidian-700 mx-1 self-center" />
              <div className="flex gap-1 items-center bg-brand-50/50 dark:bg-brand-900/10 p-0.5 rounded-md">
                <MenuButton
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  isActive={false}
                  icon={<Trash2 size={14} className="text-red-500" />}
                  label="Delete Table"
                  className="hover:bg-red-100 dark:hover:bg-red-900/30"
                />
                <div className="text-[10px] font-mono text-gray-400 mx-1 h-full flex items-center">
                  ROW
                </div>
                <MenuButton
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  isActive={false}
                  icon={<Plus size={14} />}
                  label="Add Row"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  isActive={false}
                  icon={<Minus size={14} />}
                  label="Delete Row"
                />
                <div className="text-[10px] font-mono text-gray-400 mx-1 h-full flex items-center">
                  COL
                </div>
                <MenuButton
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  isActive={false}
                  icon={<Plus size={14} />}
                  label="Add Col"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  isActive={false}
                  icon={<Minus size={14} />}
                  label="Delete Col"
                />
              </div>
            </>
          )}
        </BubbleMenu>
      )}

      {/* Floating Menu - New Line */}
      {editor && (
        <FloatingMenu
          className="flex gap-1 p-1 bg-white dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 rounded-lg shadow-lg"
          editor={editor}
        >
          {/* Basics */}
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive('heading', { level: 1 })}
            icon={<Heading1 size={14} />}
            label="H1"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={<List size={14} />}
            label="Bullet List"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={<ListOrdered size={14} />}
            label="Ordered List"
          />
          <div className="w-px h-5 bg-paper-200 dark:bg-obsidian-700 mx-1 self-center" />
          {/* Insertables */}
          <MenuButton
            onClick={() => insertMath(true)}
            isActive={false}
            icon={<SquareSigma size={14} className="text-indigo-500" />}
            label="Math Block"
          />
          <MenuButton
            onClick={insertTable}
            isActive={false}
            icon={<TableIcon size={14} className="text-emerald-500" />}
            label="Insert Table"
          />
          <MenuButton
            onClick={() => fileInputRef.current?.click()}
            isActive={false}
            icon={<ImageIcon size={14} className="text-amber-500" />}
            label="Upload & Insert Inline Image (R2)"
          />
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />

      {/* Basic Table Styles (Since Tailwind Typography might not cover everything efficiently for editing) */}
      <style jsx global>{`
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .ProseMirror td,
        .ProseMirror th {
          min-width: 1em;
          border: 1px solid #ced4da; /* gray-300 */
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: #f8f9fa; /* gray-50 */
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: '';
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .dark .ProseMirror td,
        .dark .ProseMirror th {
          border-color: #27272a; /* obsidian-700 */
        }
        .dark .ProseMirror th {
          background-color: #18181b; /* obsidian-800 */
        }
      `}</style>
    </div>
  );
};

const MenuButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  className?: string; // Allow custom classes
}> = ({ onClick, isActive, icon, label, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
        isActive
          ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-paper-100 dark:hover:bg-obsidian-700 hover:text-gray-900 dark:hover:text-gray-200'
      } ${className || ''}`}
    >
      {icon}
    </button>
  );
};
