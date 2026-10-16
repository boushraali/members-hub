import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Check, Copy, Handshake, Lightbulb, MapPin, Sparkles, UserX, Wrench } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { api } from '../data'
import type { PublicMemberProfile } from '../data/types'
import { PageShell } from '../components/layout/Layout'
import { Avatar, CategoryIcon, EmptyState, LinkedInButton } from '../components/ui/misc'
import { Badge, Button, Card, Skeleton } from '../components/ui/primitives'
import { useAsync, useDocumentTitle } from '../lib/hooks'

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card as="section" className="p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-ink">
        <span className="flex size-8 items-center justify-center rounded-lg bg-teal-light text-teal-strong">{icon}</span>
        {title}
      </h2>
      {children}
    </Card>
  )
}

function ShareButton() {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      icon={copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      onClick={async () => {
        const url = location.href
        try {
          if (navigator.share) await navigator.share({ title: document.title, url })
          else {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        } catch {
          /* أُلغيت المشاركة */
        }
      }}
    >
      {copied ? 'تم نسخ الرابط' : 'مشاركة الملف'}
    </Button>
  )
}

function ProfileView({ p }: { p: PublicMemberProfile }) {
  useDocumentTitle(`${p.fullName} — ${p.professionalTitle} | مساحة أعضاء الجمعية`)
  return (
    <>
      <div className="hero-bg h-40 sm:h-48" aria-hidden />
      <div className="mx-auto -mt-24 max-w-[1040px] px-4 sm:px-6">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-start">
            <Avatar name={p.fullName} src={p.photoUrl} size={128} className="-mt-20 sm:-mt-24" />
            <div className="flex-1">
              <h1 className="text-2xl font-black text-ink sm:text-3xl">{p.fullName}</h1>
              <p className="text-sm font-semibold text-muted">
                <bdi lang="en">{p.fullNameEn}</bdi>
              </p>
              <p className="mt-1 text-base font-bold text-ink-2">{p.professionalTitle}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {p.primaryCategory && <Badge tone="teal">{p.primaryCategory.label}</Badge>}
                {p.membershipType && (
                  <Badge icon={<BadgeCheck className="size-3.5" aria-hidden />}>{p.membershipType}</Badge>
                )}
                {p.city && <Badge icon={<MapPin className="size-3.5" aria-hidden />}>{p.city}</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {p.linkedinUrl && <LinkedInButton href={p.linkedinUrl} name={p.fullName} />}
              <ShareButton />
            </div>
          </div>
        </Card>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            <Section icon={<Sparkles className="size-4" aria-hidden />} title="النبذة المهنية">
              <div className="space-y-3 text-[15px] leading-8 text-ink-2">
                {(p.fullBio || p.shortBio).split(/\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </Section>
            <Section icon={<CategoryIcon icon="layers" className="size-4" />} title="التخصصات">
              <div className="space-y-4">
                {p.categories.map((c) => (
                  <div key={c.id}>
                    <Link to={`/?cat=${c.id}`} className="text-sm font-extrabold text-teal-strong hover:underline">
                      {c.label}
                    </Link>
                    {c.specializations.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {c.specializations.map((s) => (
                          <li key={s.id}>
                            <Link to={`/?cat=${c.id}&spec=${encodeURIComponent(s.id)}`} className="inline-block rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-[13px] font-bold text-ink-2 hover:border-teal-strong">
                              {s.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </div>
          <div className="space-y-5">
            {p.interests.length > 0 && (
              <Section icon={<Lightbulb className="size-4" aria-hidden />} title="الاهتمامات التقنية">
                <ul className="flex flex-wrap gap-1.5">
                  {p.interests.map((i) => (
                    <li key={i.id}>
                      <Link to={`/?int=${i.id}`} className="inline-block rounded-lg bg-info-bg px-2.5 py-1 text-[13px] font-bold text-sky-strong hover:brightness-95">
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {p.skills.length > 0 && (
              <Section icon={<Wrench className="size-4" aria-hidden />} title="المهارات">
                <ul className="flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <li key={s} className="rounded-lg bg-surface-2 px-2.5 py-1 text-[13px] font-bold text-ink-2" dir="auto">
                      {s}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {p.collaborationAreas.length > 0 && (
              <Section icon={<Handshake className="size-4" aria-hidden />} title="مهتم بالتعاون في">
                <ul className="space-y-2">
                  {p.collaborationAreas.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm font-semibold text-ink-2">
                      <Check className="size-4 text-teal-strong" aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ProfilePage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(() => api.getPublicProfile(slug), [slug])
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))

  return (
    <PageShell>
      <div className="mx-auto max-w-[1040px] px-4 pt-5 sm:px-6">
        <button type="button" onClick={back} className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-extrabold text-muted hover:text-teal-strong">
          <ArrowRight className="size-4" aria-hidden />
          العودة إلى مساحة الأعضاء
        </button>
      </div>
      {loading ? (
        <div className="mx-auto mt-4 max-w-[1040px] px-4 sm:px-6" aria-busy>
          <Card className="flex flex-col items-center gap-4 p-8 sm:flex-row">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-64" />
            </div>
          </Card>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Skeleton className="h-64 rounded-[18px]" />
            <Skeleton className="h-64 rounded-[18px]" />
          </div>
        </div>
      ) : data ? (
        <ProfileView p={data} />
      ) : (
        <div className="mx-auto mt-6 max-w-[720px] px-4">
          <EmptyState
            icon={<UserX className="size-7" />}
            title={error ? 'تعذّر تحميل الملف' : 'الملف غير متاح'}
            description="قد يكون الرابط غير صحيح، أو أن العضو أوقف ظهور ملفه في الدليل."
            action={
              <Link to="/" className="font-extrabold text-teal-strong hover:underline">
                تصفح أعضاء الجمعية
              </Link>
            }
          />
        </div>
      )}
    </PageShell>
  )
}
