import { SignInPage } from './features/auth/SignInPage'
import { SignUpPage } from './features/auth/SignUpPage'
import { OAuthCallbackPage } from './features/auth/OAuthCallbackPage'

export function AuthRoutes({ path }: { path: string }) {
  if (path === '/sign-up') return <SignUpPage />
  if (path === '/oauth/github') return <OAuthCallbackPage provider="github" />
  if (path === '/oauth/oidc') return <OAuthCallbackPage provider="oidc" />
  return <SignInPage />
}
