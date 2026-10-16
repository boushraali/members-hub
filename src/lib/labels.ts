import type { ProfileContent } from '../data/types'

export const FIELD_LABELS: Record<keyof ProfileContent, string> = {
  professionalTitle: 'المسمى الوظيفي',
  profileImageUrl: 'الصورة الشخصية',
  shortBio: 'النبذة المختصرة',
  fullBio: 'النبذة الموسعة',
  linkedinUrl: 'رابط LinkedIn',
  city: 'المدينة',
  categoryIds: 'المجالات الرئيسية',
  specializationIds: 'التخصصات الفرعية',
  interestIds: 'الاهتمامات التقنية',
  skillIds: 'المهارات',
  collaborationAreaIds: 'مجالات التعاون',
}
