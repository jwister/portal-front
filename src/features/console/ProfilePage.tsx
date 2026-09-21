import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import i18n from '../../i18n'
import { ConsolePageHeader } from '../../components/ConsolePageHeader'
import { RemoteState } from '../../components/RemoteState'
import { ConsoleIcon } from '../../components/ConsoleIcon'
import { ChoiceField } from '../../components/ChoiceField'
import { getProfile, updateProfile, type Profile } from '../../api/portal'

/** 从显示名或用户名取首字符，供账户身份卡展示且不引入额外头像数据。 */
function profileInitial(profile: Profile): string {
  return (profile.displayName || profile.username).trim().charAt(0).toUpperCase()
}

export function ProfilePage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [language, setLanguage] = useState('en')
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null)

  const load = () => {
    setFailed(false)
    setProfile(null)
    void getProfile().then((next) => {
      setProfile(next)
      setDisplayName(next.displayName)
      setLanguage(next.language ?? 'en')
    }).catch(() => setFailed(true))
  }

  useEffect(() => {
    load()
  }, [])

  const save = () => {
    if (!profile || saving) return
    setSaving(true)
    setFeedback(null)
    void updateProfile({ displayName: displayName.trim(), language }).then((next) => {
      setProfile(next)
      setDisplayName(next.displayName)
      setLanguage(next.language ?? language)
      void i18n.changeLanguage(next.language ?? language)
      setFeedback('success')
    }).catch(() => {
      setFeedback('error')
    }).finally(() => setSaving(false))
  }

  if (failed) return <RemoteState kind="error" onRetry={load} />
  if (!profile) return <RemoteState kind="loading" />

  return (
    <main className="console-profile-page">
      <ConsolePageHeader title={t('profile.title')} />
      <section className="console-identity-card" aria-labelledby="profile-identity-title">
        <span className="console-identity-avatar" aria-hidden="true">{profileInitial(profile)}</span>
        <div className="console-identity-copy">
          <span id="profile-identity-title" className="console-eyebrow">{t('profile.identity')}</span>
          <h2>{profile.displayName || profile.username}</h2>
          <span className="console-identity-email">{profile.email}</span>
        </div>
      </section>
      <section className="profile-form" aria-labelledby="profile-preferences-title">
        <h2 id="profile-preferences-title"><ConsoleIcon name="profile" />{t('profile.preferences')}</h2>
        <form onSubmit={(event) => { event.preventDefault(); save() }}>
          <div className="console-profile-fields">
            <label className="console-field" htmlFor="profile-username"><span>{t('profile.username')}<small>{t('profile.readOnly')}</small></span><input id="profile-username" value={profile.username} disabled /></label>
            <label className="console-field" htmlFor="profile-email"><span>{t('profile.email')}<small>{t('profile.readOnly')}</small></span><input id="profile-email" value={profile.email} disabled /></label>
            <label className="console-field" htmlFor="profile-display-name"><span>{t('profile.displayName')}</span><input id="profile-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
            <ChoiceField label={t('profile.language')} value={language} onChange={setLanguage} options={[{value:'en',label:t('profile.english')},{value:'zh-CN',label:t('profile.chinese')}]} />
          </div>
          <footer className="console-form-footer"><button className="console-button console-button-primary" type="submit" disabled={saving}>{saving && <span className="console-loading-ring" aria-hidden="true" />}{t('profile.save')}</button>{feedback && <p className={`console-form-feedback is-${feedback}`} role={feedback === 'error' ? 'alert' : 'status'}>{t(feedback === 'success' ? 'profile.saveSuccess' : 'profile.saveError')}</p>}</footer>
        </form>
      </section>
    </main>
  )
}
