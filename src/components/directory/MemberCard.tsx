import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BadgeCheck, MapPin } from 'lucide-react'
import type { PublicMemberCard } from '../../data/types'
import { Avatar, LinkedInButton } from '../ui/misc'
import { Badge, Card, Skeleton, cx } from '../ui/primitives'

interface Props {
  member: PublicMemberCard
  /** وضع المعاينة: يُعطّل الروابط (يُستخدم في صفحة ملفي المهني ولوحة الإدارة) */
  preview?: boolean
}

export const MemberCard = forwardRef<HTMLElement, Props>(function MemberCard({ member, preview }, ref) {
  const titleId = `card-${member.slug}`
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-labelledby={titleId}
      className={cx(
        'group relative isolate flex h-full flex-col rounded-[20px] border border-line bg-surface p-5 shadow-card transition-[box-shadow,transform,border-color] duration-300',
        !preview && 'hover:-translate-y-1 hover:border-teal/40 hover:shadow-card-lg focus-within:border-teal/40',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-20 rounded-t-[20px] bg-gradient-to-b from-teal-light/70 to-transparent" aria-hidden />
      <div className="flex flex-col items-center text-center">
        <Avatar name={member.fullName} src={member.photoUrl} size={88} />
        <h3 id={titleId} className="mt-3 text-[17px] font-extrabold leading-snug text-ink">
          {preview ? (
            member.fullName
          ) : (
            <Link to={`/${member.slug}`} className="after:absolute after:inset-0 after:rounded-[20px] after:content-[''] focus-visible:outline-none">
              {member.fullName}
            </Link>
          )}
        </h3>
        <p className="mt-0.5 text-sm font-semibold text-ink-2">{member.professionalTitle || 'المسمى الوظيفي'}</p>
        {member.primaryCategory && (
          <Badge tone="teal" className="mt-2.5">
            {member.primaryCategory.label}
          </Badge>
        )}
      </div>

      <p className="line-clamp-3 mt-3.5 text-[13.5px] leading-6 text-muted">{member.shortBio || 'ستظهر النبذة المختصرة هنا.'}</p>

      {member.tags.length > 0 && (
        <ul className="mt-3.5 flex flex-wrap gap-1.5" aria-label="المهارات والاهتمامات">
          {member.tags.map((t) => (
            <li key={`${t.kind}-${t.id}`}>
              <span className={cx('inline-block rounded-lg px-2 py-0.5 text-xs font-bold', t.kind === 'skill' ? 'bg-surface-2 text-ink-2' : 'bg-info-bg text-sky-strong')}>
                {t.label}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        {(member.membershipType || member.city) && (
          <div className="mb-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
            {member.membershipType && (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="size-3.5" aria-hidden />
                {member.membershipType}
              </span>
            )}
            {member.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {member.city}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {member.linkedinUrl && (
            <div className="relative z-10 flex">
              {preview ? (
                <span className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border-[1.5px] border-[#0a66c2]/25 text-[13px] font-extrabold text-[#0a66c2] dark:text-[#70b5f9]">
                  الملف المهني على LinkedIn
                </span>
              ) : (
                <div className="w-full [&>a]:w-full">
                  <LinkedInButton href={member.linkedinUrl} compact name={member.fullName} />
                </div>
              )}
            </div>
          )}
          <span
            aria-hidden
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-ink text-[13px] font-extrabold text-bg transition group-hover:bg-navy-mid dark:bg-teal-strong dark:text-[#061826]"
          >
            عرض الملف الشخصي
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  )
})

export function MemberCardSkeleton() {
  return (
    <Card className="flex flex-col items-center p-5">
      <Skeleton className="size-[88px] rounded-full" />
      <Skeleton className="mt-4 h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-40" />
      <Skeleton className="mt-3 h-5 w-24 rounded-full" />
      <div className="mt-4 w-full space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="mt-4 flex w-full gap-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="mt-5 h-10 w-full rounded-xl" />
      <Skeleton className="mt-2 h-10 w-full rounded-xl" />
    </Card>
  )
}
