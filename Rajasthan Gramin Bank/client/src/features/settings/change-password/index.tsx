import ContentSection from '../components/content-section.tsx'
import { ChangePasswordForm } from './change-password-form.tsx'

export default function ChangePassword() {
  return (
    <ContentSection title='Change Password' desc='Change current Password'>
      <ChangePasswordForm />
    </ContentSection>
  )
}
