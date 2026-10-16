import { useState } from 'react'
import { ChevronDown, Eye, EyeOff, Merge, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../data'
import type { TaxonomyTree, TechSpecialization } from '../../data/types'
import { CategoryIcon, Modal } from '../../components/ui/misc'
import { Badge, Button, Card, Field, Input, Select, Skeleton, cx } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync, useDocumentTitle } from '../../lib/hooks'
import { formatNumber } from '../../lib/text'

type Editing =
  | { kind: 'category'; id?: string; nameAr: string; nameEn: string }
  | { kind: 'spec'; id?: string; nameAr: string; nameEn: string; categoryId: string }
  | { kind: 'interest'; id?: string; nameAr: string; nameEn: string }

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={cx('rounded-lg p-2 text-muted transition hover:bg-surface-2', danger ? 'hover:text-danger' : 'hover:text-ink')}>
      {children}
    </button>
  )
}

export default function AdminTaxonomy() {
  useDocumentTitle('التخصصات والاهتمامات | إدارة مساحة الأعضاء')
  const { notify, notifyError } = useToast()
  const tree = useAsync(() => api.adminGetTaxonomy(), [])
  const [tab, setTab] = useState<'cats' | 'interests'>('cats')
  const [open, setOpen] = useState<string | null>('ai')
  const [editing, setEditing] = useState<Editing | null>(null)
  const [merging, setMerging] = useState<(TechSpecialization & { memberCount: number }) | null>(null)
  const [mergeTarget, setMergeTarget] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true)
    try {
      await fn()
      notify('success', msg)
      tree.reload()
      return true
    } catch (e) {
      notifyError(e)
      return false
    } finally {
      setBusy(false)
    }
  }

  if (!tree.data) return <Skeleton className="h-96 rounded-[18px]" />
  const t: TaxonomyTree = tree.data
  const allSpecs = t.categories.flatMap((c) => c.specializations.filter((s) => !s.mergedIntoId).map((s) => ({ ...s, catName: c.nameAr })))

  const saveEditing = async () => {
    if (!editing) return
    const ok = await run(async () => {
      if (editing.kind === 'category') await api.adminUpsertCategory({ id: editing.id, nameAr: editing.nameAr, nameEn: editing.nameEn })
      else if (editing.kind === 'spec') await api.adminUpsertSpecialization({ id: editing.id, nameAr: editing.nameAr, nameEn: editing.nameEn, categoryId: editing.categoryId })
      else await api.adminUpsertInterest({ id: editing.id, nameAr: editing.nameAr, nameEn: editing.nameEn })
    }, 'تم الحفظ.')
    if (ok) setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="نوع التصنيف" className="inline-flex rounded-xl bg-surface-2 p-1">
          {(
            [
              ['cats', 'المجالات والتخصصات'],
              ['interests', 'الاهتمامات التقنية'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-lg px-4 py-2 text-sm font-bold transition', tab === k ? 'bg-surface text-ink shadow-card' : 'text-muted')}>
              {l}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          icon={<Plus className="size-4" aria-hidden />}
          onClick={() => setEditing(tab === 'cats' ? { kind: 'category', nameAr: '', nameEn: '' } : { kind: 'interest', nameAr: '', nameEn: '' })}
        >
          {tab === 'cats' ? 'مجال جديد' : 'اهتمام جديد'}
        </Button>
      </div>
      <p className="text-[13px] text-muted">
        المعرّفات ثابتة: تعديل الاسم أو نقل التخصص لمجال آخر لا يفقد ارتباطات الأعضاء. الحذف متاح فقط للعناصر غير المستخدمة؛ وغير ذلك يتحول إلى إخفاء. استخدم «الدمج» لتوحيد التخصصات المكررة.
      </p>

      {tab === 'cats' ? (
        <div className="space-y-2.5">
          {t.categories.map((c) => {
            const expanded = open === c.id
            return (
              <Card key={c.id} className={cx('overflow-hidden', !c.isActive && 'opacity-70')}>
                <div className="flex items-center gap-2 p-3 ps-4">
                  <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : c.id)} className="flex flex-1 items-center gap-3 text-start">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-teal-light text-teal-strong">
                      <CategoryIcon icon={c.icon} className="size-[18px]" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-extrabold text-ink">{c.nameAr}</span>
                      <span className="text-xs text-muted" dir="ltr">{c.nameEn}</span>
                    </span>
                    <Badge>{formatNumber(c.memberCount)} عضو</Badge>
                    <Badge tone="neutral">{formatNumber(c.specializations.filter((s) => !s.mergedIntoId).length)} تخصص</Badge>
                    {!c.isActive && <Badge tone="warn">مخفي</Badge>}
                    <ChevronDown className={cx('size-5 text-muted transition-transform', expanded && 'rotate-180')} aria-hidden />
                  </button>
                  <IconBtn label="تعديل المجال" onClick={() => setEditing({ kind: 'category', id: c.id, nameAr: c.nameAr, nameEn: c.nameEn })}>
                    <Pencil className="size-4" />
                  </IconBtn>
                  <IconBtn label={c.isActive ? 'إخفاء المجال' : 'إظهار المجال'} onClick={() => run(() => api.adminUpsertCategory({ ...c, isActive: !c.isActive }), c.isActive ? 'تم إخفاء المجال.' : 'تم إظهار المجال.')}>
                    {c.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </IconBtn>
                </div>
                {expanded && (
                  <div className="border-t border-line bg-bg-soft p-3">
                    <ul className="divide-y divide-line">
                      {c.specializations.map((s) => (
                        <li key={s.id} className={cx('flex flex-wrap items-center gap-2 py-2 ps-2', (!s.isActive || s.mergedIntoId) && 'opacity-60')}>
                          <span className="min-w-0 flex-1">
                            <span className="text-sm font-bold text-ink">{s.nameAr}</span>
                            <span className="ms-2 text-xs text-muted" dir="ltr">{s.nameEn}</span>
                          </span>
                          {s.mergedIntoId ? (
                            <Badge tone="info">مدموج في: {allSpecs.find((x) => x.id === s.mergedIntoId)?.nameAr}</Badge>
                          ) : (
                            <>
                              <span className="text-xs font-bold tabular-nums text-muted">{formatNumber(s.memberCount)} عضو</span>
                              {!s.isActive && <Badge tone="warn">مخفي</Badge>}
                              <IconBtn label="تعديل" onClick={() => setEditing({ kind: 'spec', id: s.id, nameAr: s.nameAr, nameEn: s.nameEn, categoryId: s.categoryId })}>
                                <Pencil className="size-4" />
                              </IconBtn>
                              <IconBtn label={s.isActive ? 'إخفاء' : 'إظهار'} onClick={() => run(() => api.adminUpsertSpecialization({ ...s, isActive: !s.isActive }), 'تم التحديث.')}>
                                {s.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </IconBtn>
                              <IconBtn label="دمج في تخصص آخر" onClick={() => { setMerging(s); setMergeTarget('') }}>
                                <Merge className="size-4" />
                              </IconBtn>
                              <IconBtn
                                label="حذف"
                                danger
                                onClick={() =>
                                  confirm(s.memberCount ? 'هذا التخصص مستخدم، وسيتم إخفاؤه بدلًا من حذفه. متابعة؟' : 'حذف هذا التخصص نهائيًا؟') &&
                                  run(async () => {
                                    const r = await api.adminDeleteSpecialization(s.id)
                                    if (r.hidden) notify('info', 'التخصص مرتبط بأعضاء، فتم إخفاؤه بدلًا من حذفه.')
                                  }, 'تم.')
                                }
                              >
                                <Trash2 className="size-4" />
                              </IconBtn>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" variant="ghost" className="mt-2" icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing({ kind: 'spec', nameAr: '', nameEn: '', categoryId: c.id })}>
                      إضافة تخصص فرعي
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {t.interests.map((i) => (
              <li key={i.id} className={cx('flex items-center gap-2 px-4 py-2.5', !i.isActive && 'opacity-60')}>
                <span className="flex-1">
                  <span className="text-sm font-bold text-ink">{i.nameAr}</span>
                  <span className="ms-2 text-xs text-muted" dir="ltr">{i.nameEn}</span>
                </span>
                <span className="text-xs font-bold tabular-nums text-muted">{formatNumber(i.memberCount)} عضو</span>
                {!i.isActive && <Badge tone="warn">مخفي</Badge>}
                <IconBtn label="تعديل" onClick={() => setEditing({ kind: 'interest', id: i.id, nameAr: i.nameAr, nameEn: i.nameEn })}>
                  <Pencil className="size-4" />
                </IconBtn>
                <IconBtn label={i.isActive ? 'إخفاء' : 'إظهار'} onClick={() => run(() => api.adminUpsertInterest({ ...i, isActive: !i.isActive }), 'تم التحديث.')}>
                  {i.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </IconBtn>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'تعديل' : editing?.kind === 'spec' ? 'تخصص فرعي جديد' : editing?.kind === 'category' ? 'مجال جديد' : 'اهتمام جديد'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button loading={busy} disabled={!editing?.nameAr.trim()} onClick={saveEditing}>حفظ</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="الاسم بالعربية" required>
              {(a) => <Input {...a} value={editing.nameAr} onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })} />}
            </Field>
            <Field label="الاسم بالإنجليزية">
              {(a) => <Input {...a} dir="ltr" value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} />}
            </Field>
            {editing.kind === 'spec' && (
              <Field label="المجال الرئيسي" hint="نقل التخصص لمجال آخر يحافظ على ارتباطات الأعضاء.">
                {(a) => (
                  <Select {...a} value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                    {t.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={merging !== null}
        onClose={() => setMerging(null)}
        title="دمج تخصص مكرر"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMerging(null)}>إلغاء</Button>
            <Button
              loading={busy}
              disabled={!mergeTarget}
              onClick={async () => {
                if (!merging) return
                let moved = 0
                const ok = await run(async () => {
                  moved = (await api.adminMergeSpecialization(merging.id, mergeTarget)).movedMembers
                }, 'تم الدمج.')
                if (ok) {
                  notify('info', `نُقل ${formatNumber(moved)} عضو إلى التخصص البديل.`)
                  setMerging(null)
                }
              }}
            >
              تأكيد الدمج
            </Button>
          </>
        }
      >
        {merging && (
          <div className="space-y-4 text-sm">
            <p className="text-ink-2">
              سيُنقل <strong>{formatNumber(merging.memberCount)}</strong> عضو من «{merging.nameAr}» إلى التخصص المختار، ثم يُخفى التخصص الأصلي ويُحتفظ به كمرجع.
            </p>
            <Field label="الدمج في">
              {(a) => (
                <Select {...a} value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}>
                  <option value="">اختر التخصص البديل…</option>
                  {allSpecs
                    .filter((s) => s.id !== merging.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr} — {s.catName}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
