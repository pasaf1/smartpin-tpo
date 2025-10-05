'use client'

import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { usePinWithChildren, useCreatePinChild, useUpdatePinChildStatus, useChildPhotos, useAttachChildPhotoDynamic } from '@/lib/hooks/usePinChildren'
import type { PinChild } from '@/lib/database.types'

interface Props {
  pinId: string | null
  isOpen: boolean
  onClose: () => void
}

const statusSteps: Array<PinChild['status_child']> = ['Open', 'ReadyForInspection', 'Closed']

export function PinDetailsModalV2({ pinId, isOpen, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoTarget, setPhotoTarget] = useState<{ childId: string; kind: 'OpenPIC' | 'ClosurePIC' } | null>(null)
  const { data: pinWithChildren } = usePinWithChildren(pinId || '')
  const createChild = useCreatePinChild(pinId || '')
  const updateStatus = useUpdatePinChildStatus(pinId || '')
  // ✅ FIXED: Hook now called unconditionally before early return
  const attachDyn = useAttachChildPhotoDynamic(pinId || '')

  const summary = useMemo(() => {
    if (!pinWithChildren) return { total: 0, closed: 0 }
    const total = pinWithChildren.children.length
    const closed = pinWithChildren.children.filter(c => c.status_child === 'Closed').length
    return { total, closed }
  }, [pinWithChildren])

  if (!isOpen || !pinId) return null

  const onAddChild = () => {
    createChild.mutate({})
  }

  const onPickPhoto = (childId: string, kind: 'OpenPIC' | 'ClosurePIC') => {
    setPhotoTarget({ childId, kind })
    fileInputRef.current?.click()
  }
  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !photoTarget || !pinId) return
    // The repo has a generic uploader; here we assume an external upload flow is used
    // For now, create a temporary object URL to simulate public URL until integrated with storage UI
    const tempUrl = URL.createObjectURL(file)
    attachDyn.mutate({ childId: photoTarget.childId, publicUrl: tempUrl, type: photoTarget.kind })
    setPhotoTarget(null)
    e.currentTarget.value = ''
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-luxury-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-luxury-50 to-luxury-100 p-6 border-b border-luxury-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-luxury-900">Pin Details</h2>
              <div className="text-sm text-luxury-600 mt-1">
                Closed {summary.closed}/{summary.total}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/80 hover:bg-white rounded-xl flex items-center justify-center text-luxury-500 hover:text-luxury-700 transition-colors shadow-luxury"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Add child defect */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-luxury-700 font-semibold">ליקויים</div>
            <button
              onClick={onAddChild}
              className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold hover:from-gold-600 hover:to-gold-700 transition-colors shadow-luxury"
            >
              הוספת ליקוי נוסף
            </button>
          </div>

          {/* Children list */}
          <div className="space-y-4">
            {pinWithChildren?.children.map((child) => (
              <ChildRow
                key={child.child_id}
                parentSeq={pinWithChildren.seq_number}
                child={child}
                onPickPhoto={onPickPhoto}
                onAdvance={(next) => updateStatus.mutate({ childId: child.child_id, status: next })}
              />
            ))}
            {pinWithChildren && pinWithChildren.children.length === 0 && (
              <div className="text-sm text-luxury-500">אין ליקויים עדיין. הוסיפו ליקוי נוסף.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-luxury-50 px-6 py-4 border-t border-luxury-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-2 text-luxury-700 hover:text-luxury-900 font-semibold transition-colors">
            סגור
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
      </div>
    </div>
  )
}

function ChildRow({ parentSeq, child, onPickPhoto, onAdvance }: {
  parentSeq: number
  child: PinChild
  onPickPhoto: (childId: string, kind: 'OpenPIC' | 'ClosurePIC') => void
  onAdvance: (next: PinChild['status_child']) => void
}) {
  const displayId = `${parentSeq}.${child.child_code.split('.').pop()}`
  const { data: photos = [] } = useChildPhotos(child.child_id)
  const openPic = photos.find(p => p.type === 'OpenPIC')
  const closurePic = photos.find(p => p.type === 'ClosurePIC')

  const currentIndex = statusSteps.indexOf(child.status_child)
  const next = currentIndex < statusSteps.length - 1 ? statusSteps[currentIndex + 1] : null

  return (
    <div className="rounded-xl border border-luxury-200 p-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-600 text-white flex items-center justify-center font-bold">{displayId}</div>
          <div className="text-luxury-800 font-semibold">סטטוס: {child.status_child}</div>
        </div>
        <div className="flex items-center gap-2">
          {next && (
            <button
              onClick={() => onAdvance(next)}
              className={cn(
                'px-3 py-1 text-sm rounded-md font-semibold',
                next === 'Closed' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              )}
            >
              עדכן ל-{next}
            </button>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="flex items-center gap-4 mt-3">
        {statusSteps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              i <= currentIndex ? 'bg-gold-600 text-white' : 'bg-luxury-200 text-luxury-500'
            )}>{i + 1}</div>
            <div className={cn('text-xs font-medium', i <= currentIndex ? 'text-luxury-800' : 'text-luxury-500')}>{s}</div>
            {i < statusSteps.length - 1 && <div className="w-8 h-0.5 bg-luxury-200" />}
          </div>
        ))}
      </div>

      {/* Image pair */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <ImageBox title="פתיחה" url={openPic?.file_url_public} onPick={() => onPickPhoto(child.child_id, 'OpenPIC')} />
        <ImageBox title="סגירה" url={closurePic?.file_url_public} onPick={() => onPickPhoto(child.child_id, 'ClosurePIC')} />
      </div>
    </div>
  )
}

function ImageBox({ title, url, onPick }: { title: string; url?: string; onPick: () => void }) {
  return (
    <div className="border border-luxury-200 rounded-lg p-3">
      <div className="text-sm text-luxury-700 font-semibold mb-2">{title}</div>
      {url ? (
        <div className="aspect-video bg-luxury-50 rounded-md overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <button
          onClick={onPick}
          className="w-full aspect-video rounded-md bg-luxury-50 hover:bg-luxury-100 border border-dashed border-luxury-300 text-luxury-500 flex items-center justify-center"
        >
          הוספת תמונה
        </button>
      )}
    </div>
  )
}
