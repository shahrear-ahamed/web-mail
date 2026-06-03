"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ onChange, placeholder = "Write your message…", className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[200px] px-3 py-2 outline-none prose prose-sm max-w-none dark:prose-invert",
      },
    },
  });

  const marks = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { bold: false, italic: false, underline: false, code: false, h2: false, h3: false, bulletList: false, orderedList: false };
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        code: e.isActive("code"),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
      };
    },
  });

  function tb(icon: React.ReactNode, label: string, onClick: () => void, active?: boolean) {
    return (
      <Button
        key={label}
        type="button"
        variant={active ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={onClick}
        aria-label={label}
        title={label}
      >
        {icon}
      </Button>
    );
  }

  return (
    <div className={cn("rounded-lg border border-input bg-background overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b flex-wrap">
        {tb(<Bold className="size-3.5" />, "Bold", () => editor?.chain().focus().toggleBold().run(), marks?.bold)}
        {tb(<Italic className="size-3.5" />, "Italic", () => editor?.chain().focus().toggleItalic().run(), marks?.italic)}
        {tb(<Underline className="size-3.5" />, "Underline", () => editor?.chain().focus().toggleUnderline().run(), marks?.underline)}
        {tb(<Code className="size-3.5" />, "Code", () => editor?.chain().focus().toggleCode().run(), marks?.code)}
        <Separator orientation="vertical" className="h-5 mx-1" />
        {tb(<Heading2 className="size-3.5" />, "Heading 2", () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), marks?.h2)}
        {tb(<Heading3 className="size-3.5" />, "Heading 3", () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), marks?.h3)}
        <Separator orientation="vertical" className="h-5 mx-1" />
        {tb(<List className="size-3.5" />, "Bullet List", () => editor?.chain().focus().toggleBulletList().run(), marks?.bulletList)}
        {tb(<ListOrdered className="size-3.5" />, "Ordered List", () => editor?.chain().focus().toggleOrderedList().run(), marks?.orderedList)}
      </div>
      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
