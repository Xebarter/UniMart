'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react'
import { articleBodyHtml } from '@/lib/article'

type Command =
  | { kind: 'exec'; cmd: string; arg?: string }
  | { kind: 'block'; tag: string }
  | { kind: 'link' }
  | { kind: 'unlink' }

const TOOLS: { label: string; icon: typeof Bold; command: Command; group?: string }[] = [
  { label: 'Undo', icon: Undo2, command: { kind: 'exec', cmd: 'undo' }, group: 'history' },
  { label: 'Redo', icon: Redo2, command: { kind: 'exec', cmd: 'redo' }, group: 'history' },
  { label: 'Paragraph', icon: Pilcrow, command: { kind: 'block', tag: 'p' }, group: 'block' },
  { label: 'Heading', icon: Heading2, command: { kind: 'block', tag: 'h2' }, group: 'block' },
  { label: 'Subheading', icon: Heading3, command: { kind: 'block', tag: 'h3' }, group: 'block' },
  { label: 'Bold', icon: Bold, command: { kind: 'exec', cmd: 'bold' }, group: 'inline' },
  { label: 'Italic', icon: Italic, command: { kind: 'exec', cmd: 'italic' }, group: 'inline' },
  { label: 'Underline', icon: Underline, command: { kind: 'exec', cmd: 'underline' }, group: 'inline' },
  { label: 'Strikethrough', icon: Strikethrough, command: { kind: 'exec', cmd: 'strikeThrough' }, group: 'inline' },
  { label: 'Bullets', icon: List, command: { kind: 'exec', cmd: 'insertUnorderedList' }, group: 'list' },
  { label: 'Numbers', icon: ListOrdered, command: { kind: 'exec', cmd: 'insertOrderedList' }, group: 'list' },
  { label: 'Quote', icon: Quote, command: { kind: 'block', tag: 'blockquote' }, group: 'list' },
  { label: 'Divider', icon: Minus, command: { kind: 'exec', cmd: 'insertHorizontalRule' }, group: 'insert' },
  { label: 'Link', icon: Link2, command: { kind: 'link' }, group: 'insert' },
  { label: 'Remove link', icon: Unlink, command: { kind: 'unlink' }, group: 'insert' },
  { label: 'Clear formatting', icon: RemoveFormatting, command: { kind: 'exec', cmd: 'removeFormat' }, group: 'insert' },
]

function isActive(command: Command) {
  if (typeof document === 'undefined') return false
  if (command.kind === 'exec') {
    try {
      return document.queryCommandState(command.cmd)
    } catch {
      return false
    }
  }
  if (command.kind === 'block') {
    try {
      return document.queryCommandValue('formatBlock').replace(/[<>]/g, '').toLowerCase() === command.tag
    } catch {
      return false
    }
  }
  return false
}

export function ArticleBodyEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValue = useRef(value)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const node = editorRef.current
    if (!node) return
    if (value === lastValue.current && node.innerHTML.trim()) return
    node.innerHTML = articleBodyHtml(value) || '<p></p>'
    lastValue.current = value
  }, [value])

  function emit() {
    const html = editorRef.current?.innerHTML ?? ''
    lastValue.current = html
    onChange(html)
    setTick((current) => current + 1)
  }

  function run(command: Command) {
    const node = editorRef.current
    if (!node) return
    node.focus()
    if (command.kind === 'exec') {
      document.execCommand(command.cmd, false, command.arg)
    } else if (command.kind === 'block') {
      document.execCommand('formatBlock', false, command.tag)
    } else if (command.kind === 'unlink') {
      document.execCommand('unlink')
    } else {
      const current = typeof document !== 'undefined' ? document.getSelection()?.toString() ?? '' : ''
      const next = window.prompt('Link URL', current.startsWith('http') ? current : 'https://')
      if (!next) return
      document.execCommand('createLink', false, next.trim())
    }
    emit()
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e2e9e5] bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#eef3f0] bg-[#f7faf8] px-2 py-1.5">
        {TOOLS.map((tool, index) => {
          const prev = TOOLS[index - 1]
          const Icon = tool.icon
          const active = isActive(tool.command)
          return (
            <span key={tool.label} className="contents">
              {prev && prev.group !== tool.group ? <span className="mx-1 h-5 w-px bg-[#e2e9e5]" /> : null}
              <button
                type="button"
                title={tool.label}
                aria-label={tool.label}
                aria-pressed={active}
                onMouseDown={(event) => {
                  event.preventDefault()
                  run(tool.command)
                }}
                className={`flex size-8 items-center justify-center rounded-lg transition ${
                  active ? 'bg-[#315e55] text-white' : 'text-[#526861] hover:bg-white hover:text-[#243e39]'
                }`}
              >
                <Icon size={15} strokeWidth={2.1} />
              </button>
            </span>
          )
        })}
        <span className="sr-only">{tick}</span>
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-label="Article body"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write the story. Use the toolbar for headings, lists, quotes, and links."
        onInput={emit}
        onBlur={emit}
        onKeyUp={() => setTick((current) => current + 1)}
        onMouseUp={() => setTick((current) => current + 1)}
        className="article-body article-editor min-h-80 px-4 py-4 outline-none sm:px-5 sm:py-5"
      />
    </div>
  )
}
