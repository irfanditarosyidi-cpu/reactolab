"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type FormEvent,
} from "react";
import { scientificTextSegments } from "@/lib/discussion";
import { cn } from "@/lib/utils";

export type ScientificTextareaHandle = {
  focus: () => void;
  formatSelection: (script: "subscript" | "superscript") => void;
};

type ScientificTextareaProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
};

function serializeEditor(editor: HTMLElement): string {
  const serializeChildren = (parent: Node): string => {
    let value = "";

    Array.from(parent.childNodes).forEach((node, index, nodes) => {
      if (node.nodeType === Node.TEXT_NODE) {
        value += node.textContent ?? "";
        return;
      }
      if (!(node instanceof HTMLElement)) return;

      const tag = node.tagName.toLowerCase();
      if (tag === "br") {
        value += "\n";
      } else if (tag === "sub" || tag === "sup") {
        const marker = tag === "sub" ? "_" : "^";
        value += `${marker}{${node.textContent ?? ""}}`;
      } else if (tag === "div" || tag === "p") {
        if (value && !value.endsWith("\n")) value += "\n";
        value += serializeChildren(node);
        if (index < nodes.length - 1 && !value.endsWith("\n")) value += "\n";
      } else {
        value += serializeChildren(node);
      }
    });

    return value;
  };

  return serializeChildren(editor).replace(/\u00a0/g, " ");
}

function renderValue(editor: HTMLElement, value: string) {
  const fragment = document.createDocumentFragment();

  scientificTextSegments(value).forEach((segment) => {
    if (segment.script === "normal") {
      fragment.append(document.createTextNode(segment.text));
      return;
    }

    const element = document.createElement(
      segment.script === "subscript" ? "sub" : "sup"
    );
    element.textContent = segment.text;
    fragment.append(element);
  });

  editor.replaceChildren(fragment);
}

function selectionInside(editor: HTMLElement, range: Range): boolean {
  return editor.contains(range.commonAncestorContainer);
}

const ScientificTextarea = forwardRef<
  ScientificTextareaHandle,
  ScientificTextareaProps
>(function ScientificTextarea(
  {
    id,
    value,
    onValueChange,
    rows = 6,
    placeholder,
    className,
  },
  forwardedRef
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelectionRef = useRef<Range | null>(null);

  const emitValue = useCallback(() => {
    const editor = editorRef.current;
    if (editor) onValueChange(serializeEditor(editor));
  }, [onValueChange]);

  const rememberSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (selectionInside(editor, range)) lastSelectionRef.current = range.cloneRange();
  };

  const insertPlainText = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    const activeRange =
      selection?.rangeCount && selectionInside(editor, selection.getRangeAt(0))
        ? selection.getRangeAt(0)
        : lastSelectionRef.current;
    const range = activeRange?.cloneRange() ?? document.createRange();

    if (!activeRange) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    lastSelectionRef.current = range.cloneRange();
    emitValue();
  };

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (editor && serializeEditor(editor) !== value) renderValue(editor, value);
  }, [value]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus: () => editorRef.current?.focus(),
      formatSelection: (script) => {
        const editor = editorRef.current;
        if (!editor) return;

        const selection = window.getSelection();
        const currentRange =
          selection?.rangeCount && selectionInside(editor, selection.getRangeAt(0))
            ? selection.getRangeAt(0)
            : lastSelectionRef.current;
        const range = currentRange?.cloneRange() ?? document.createRange();

        if (!currentRange) {
          range.selectNodeContents(editor);
          range.collapse(false);
        }

        const selectedText = range.toString() || "teks";
        const element = document.createElement(script === "subscript" ? "sub" : "sup");
        element.textContent = selectedText;
        range.deleteContents();
        range.insertNode(element);

        const selectedRange = document.createRange();
        selectedRange.selectNodeContents(element);
        selection?.removeAllRanges();
        selection?.addRange(selectedRange);
        lastSelectionRef.current = selectedRange.cloneRange();
        editor.focus();
        emitValue();
      },
    }),
    [emitValue]
  );

  const handleInput = (_event: FormEvent<HTMLDivElement>) => {
    rememberSelection();
    emitValue();
  };

  const handleBeforeInput = (event: FormEvent<HTMLDivElement>) => {
    const inputType = (event.nativeEvent as InputEvent).inputType;
    if (inputType !== "insertParagraph" && inputType !== "insertLineBreak") return;
    event.preventDefault();
    insertPlainText("\n");
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    insertPlainText(event.clipboardData.getData("text/plain"));
  };

  return (
    <div
      ref={editorRef}
      id={id}
      role="textbox"
      aria-multiline="true"
      aria-placeholder={placeholder}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onInput={handleInput}
      onBeforeInput={handleBeforeInput}
      onPaste={handlePaste}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
      onBlur={rememberSelection}
      data-placeholder={placeholder}
      className={cn(
        "w-full overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900",
        "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500",
        "empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]",
        "[&_sub]:text-[0.75em] [&_sup]:text-[0.75em]",
        className
      )}
      style={{ minHeight: `${Math.max(rows, 2) * 1.625 + 1.25}rem` }}
    />
  );
});

export default ScientificTextarea;
