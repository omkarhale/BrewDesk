'use client'

import { useRef, useState } from 'react'
import { X, Upload, FileText, ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useDeleteAttachment,
  useUploadAttachment,
} from '@/hooks/useRegularization'
import { RegularizationAttachmentResponse } from '@/types/attendance'
import { getAttachmentDownloadUrl } from '@/api/attendance'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png']

const prettyBytes = (b: number) => {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

/**
 * Drag-drop / click-to-upload widget for regularization attachments.
 *
 * Requires a requestId (PENDING request) because the backend ties
 * attachments to an existing request identity. Employees use this in the
 * detail panel after submitting a new request; managers/admins may view
 * attachments in read-only mode.
 *
 * Props:
 *  - requestId:   request to attach to
 *  - attachments: current list of attachments (from request detail)
 *  - readOnly:    if true, hide upload / delete controls
 */
export function AttachmentDropzone({
  requestId,
  attachments,
  readOnly = false,
}: {
  requestId: number
  attachments: RegularizationAttachmentResponse[]
  readOnly?: boolean
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const upload = useUploadAttachment(requestId)
  const remove = useDeleteAttachment(requestId)

  const pickFiles = () => inputRef.current?.click()

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} exceeds the 5 MB limit`)
        continue
      }
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name} is not supported. Use PDF, JPEG, or PNG.`)
        continue
      }
      await upload.mutateAsync(f)
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (readOnly) return
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2.5">
      {!readOnly && (
        <>
          <div
            onDragOver={(e) => {
              if (readOnly) return
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={pickFiles}
            className={cn(
              'relative border border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors',
              dragOver
                ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/20'
                : 'border-border bg-muted/20 hover:bg-muted/40',
              upload.isPending && 'pointer-events-none opacity-70',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-1.5 pointer-events-none">
              {upload.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-[13px] font-medium text-foreground">
                {upload.isPending
                  ? 'Uploading…'
                  : 'Drop files here, or click to browse'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                PDF, JPEG, PNG — max 5 MB each
              </div>
            </div>
          </div>
        </>
      )}

      {attachments.length > 0 && (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] transition-colors"
            >
              <span className="text-muted-foreground shrink-0">
                {fileIcon(a.contentType)}
              </span>
              <a
                href={getAttachmentDownloadUrl(a.id)}
                target="_blank"
                rel="noreferrer"
                className="truncate flex-1 hover:underline"
              >
                {a.originalFilename}
              </a>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {prettyBytes(a.fileSizeBytes)}
              </span>
              {!readOnly && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => remove.mutate(a.id)}
                  disabled={remove.isPending}
                  title="Remove attachment"
                >
                  {remove.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {readOnly && attachments.length === 0 && (
        <p className="text-[12px] text-muted-foreground italic">
          No supporting attachments were provided.
        </p>
      )}
    </div>
  )
}

export default AttachmentDropzone
