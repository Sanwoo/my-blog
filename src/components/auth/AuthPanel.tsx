'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Github, Loader2, Mail, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { writePendingAuthNotice, type PendingAuthNotice } from '@/lib/auth-notice'
import { safeAppPath, type AuthDialogMode } from '@/lib/navigation'
import { signInInputSchema, signUpInputSchema } from '@/lib/schemas/auth'
import { firstIssueMessage } from '@/lib/schemas/runtime'
import { absoluteUrl } from '@/lib/site'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

export type AuthPanelMode = AuthDialogMode

function friendlyAuthError(message: string) {
  const normalized = message.trim().toLowerCase()

  if (!normalized) {
    return '操作没有完成，请稍后重试。'
  }

  if (normalized.includes('invalid login credentials')) {
    return '邮箱或密码不正确。'
  }

  if (normalized.includes('user already registered')) {
    return '这个邮箱已经注册过了；如果它是 GitHub 账号，请先用 GitHub 登录后再设置密码。'
  }

  if (normalized.includes('identity_already_exists')) {
    return '这个邮箱已经和另一个登录方式关联，请先用原来的方式登录。'
  }

  if (normalized.includes('password should be at least')) {
    return '密码至少需要 6 位。'
  }

  if (normalized.includes('email not confirmed')) {
    return '这个账号还没有完成邮箱确认。'
  }

  return '操作没有完成，请稍后重试。'
}

const EMAIL_CONFIRMATION_REQUIRED_MESSAGE = '注册成功，但当前 Supabase 项目仍开启了邮箱验证，所以还不能自动登录。请先在 Supabase Dashboard 关闭 Confirm email / Email Confirmations。'

function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function DividerLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/76">
      <span className="h-px flex-1 bg-editorial-rule" />
      {label}
      <span className="h-px flex-1 bg-editorial-rule" />
    </div>
  )
}

const passwordRecoveryMessage = '暂时无法找回密码，如需找回密码请联系作者。'

function DesktopPasswordRecoveryTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger
        className="hidden h-auto cursor-help items-center rounded-full text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline sm:inline-flex"
        aria-label="无法找回密码说明"
      >
        无法找回密码？
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className="max-w-[18rem] px-3 py-2 text-left text-[12px] leading-5">
        {passwordRecoveryMessage}
      </TooltipContent>
    </Tooltip>
  )
}

function MobilePasswordRecoveryPopover() {
  return (
    <div className="sm:hidden">
      <Popover>
        <PopoverTrigger
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border/70 bg-background/78 px-4 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
          aria-label="无法找回密码说明"
        >
          无法找回密码？
        </PopoverTrigger>
        <PopoverContent align="center" side="bottom" sideOffset={10} className="w-[min(20rem,calc(100vw-2rem))] space-y-2 px-4 py-3">
          <p className="text-sm font-medium text-foreground">无法找回密码</p>
          <p className="text-sm leading-6 text-muted-foreground">{passwordRecoveryMessage}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function EmailAuthSection({ mode, onModeChange, children }: { mode: AuthDialogMode; onModeChange: (mode: AuthDialogMode) => void; children: ReactNode }) {
  return (
    <Tabs value={mode} onValueChange={(value) => onModeChange(value as AuthDialogMode)} className="gap-0">
      <div className="w-full overflow-hidden rounded-[1rem] border border-editorial-rule/80 bg-background/52">
        <div className="w-full border-b border-editorial-rule/90 px-4 pt-4 sm:px-5">
          <TabsList variant="line" className="w-full justify-stretch gap-0 p-0">
            <TabsTrigger value="sign-in" className="h-10 cursor-pointer rounded-none px-0 pb-2 pt-0 text-[13px]">
              邮箱登录
            </TabsTrigger>
            <TabsTrigger value="sign-up" className="h-10 cursor-pointer rounded-none px-0 pb-2 pt-0 text-[13px]">
              邮箱注册
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex min-w-0 flex-col gap-4 p-4 pt-4 sm:px-5 sm:pb-5">{children}</div>
      </div>
    </Tabs>
  )
}

function PanelHeader({ onRequestClose }: { onRequestClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-editorial-rule/90 px-5 py-4 sm:px-6">
      <div className="space-y-1.5">
        <DialogTitle className="font-serif text-[1.5rem] leading-tight tracking-[-0.04em] text-foreground">登录或注册</DialogTitle>
        <DialogDescription className="text-sm leading-6 text-muted-foreground">登录后可评论、互动与接收回复提醒。</DialogDescription>
      </div>
      <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full border border-border/70 bg-background/84" onClick={onRequestClose} aria-label="关闭登录窗口">
        <X className="size-4" aria-hidden />
      </Button>
    </div>
  )
}

function OAuthButton({ pending, disabled, onClick }: { pending: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" className="h-12 w-full rounded-[1rem] border-editorial-rule bg-background/80" onClick={onClick} disabled={disabled}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Github className="size-4" aria-hidden />}
      使用 GitHub 登录
    </Button>
  )
}

function SignInForm({
  email,
  password,
  pending,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  email: string
  password: string
  pending: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 pb-1">
      <AuthField label="邮箱">
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          className="h-12 rounded-[0.95rem] border-editorial-rule bg-background/74 px-4"
        />
      </AuthField>

      <AuthField label="密码">
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="输入你的密码"
          className="h-12 rounded-[0.95rem] border-editorial-rule bg-background/74 px-4"
        />
      </AuthField>

      <div className="flex min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <DesktopPasswordRecoveryTooltip />
        <Button type="button" className="h-11 w-full rounded-full px-5 sm:w-auto" onClick={onSubmit} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
          邮箱登录
        </Button>
        <MobilePasswordRecoveryPopover />
      </div>
    </div>
  )
}

function SignUpForm({
  nickname,
  email,
  password,
  passwordConfirm,
  pending,
  onNicknameChange,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmChange,
  onSubmit,
}: {
  nickname: string
  email: string
  password: string
  passwordConfirm: string
  pending: boolean
  onNicknameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onPasswordConfirmChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 pb-1">
      <AuthField label="昵称">
        <Input
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          placeholder="你的昵称"
          maxLength={40}
          className="h-12 rounded-[0.95rem] border-editorial-rule bg-background/74 px-4"
        />
      </AuthField>

      <AuthField label="邮箱">
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          className="h-12 rounded-[0.95rem] border-editorial-rule bg-background/74 px-4"
        />
      </AuthField>

      <AuthField label="密码">
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="至少 6 位"
          className="h-12 rounded-[0.95rem] border-editorial-rule bg-background/74 px-4"
        />
      </AuthField>

      <AuthField label="确认密码">
        <Input
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(event) => onPasswordConfirmChange(event.target.value)}
          placeholder="再输入一次"
          className="h-12 rounded-[0.95rem] border-editorial-rule bg-background/74 px-4"
        />
      </AuthField>

      <Button type="button" className="mt-1 h-11 w-full shrink-0 rounded-full" onClick={onSubmit} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
        邮箱注册
      </Button>
    </div>
  )
}

export function AuthPanel({
  next = '/',
  initialMode = 'sign-in',
  onAuthenticated,
  onRequestClose,
  className,
}: {
  next?: string
  initialMode?: AuthDialogMode
  onAuthenticated?: () => void
  onRequestClose?: () => void
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mode, setMode] = useState<AuthDialogMode>(initialMode)
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState('')
  const [isFormPending, setIsFormPending] = useState(false)
  const [isGithubPending, setIsGithubPending] = useState(false)
  const nextPath = safeAppPath(next)

  const showAuthError = (message: string) => {
    toast.error(message)
  }

  const switchMode = (nextMode: AuthDialogMode) => {
    setMode(nextMode)
  }

  const finishAuthenticated = (notice: PendingAuthNotice) => {
    writePendingAuthNotice(notice)
    onAuthenticated?.()

    if (nextPath !== pathname) {
      router.replace(nextPath)
      return
    }

    router.refresh()
  }

  const handleGitHubSignIn = async () => {
    if (isGithubPending || isFormPending) {
      return
    }

    setIsGithubPending(true)

    try {
      writePendingAuthNotice({ kind: 'oauth-sign-in' })

      const supabase = getSupabaseBrowser()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(nextPath)}`),
        },
      })

      if (authError) {
        throw authError
      }
    } catch (authError) {
      const nextMessage = friendlyAuthError(authError instanceof Error ? authError.message : '')
      showAuthError(nextMessage)
      setIsGithubPending(false)
    }
  }

  const handleSignIn = async () => {
    if (isFormPending || isGithubPending) {
      return
    }

    const parsedInput = signInInputSchema.safeParse({
      email: signInEmail,
      password: signInPassword,
    })
    if (!parsedInput.success) {
      showAuthError(firstIssueMessage(parsedInput.error, '请输入邮箱和密码。'))
      return
    }

    setIsFormPending(true)

    try {
      const supabase = getSupabaseBrowser()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: parsedInput.data.email,
        password: parsedInput.data.password,
      })

      if (authError) {
        throw authError
      }

      finishAuthenticated({ kind: 'password-sign-in' })
    } catch (authError) {
      const nextMessage = friendlyAuthError(authError instanceof Error ? authError.message : '')
      showAuthError(nextMessage)
    } finally {
      setIsFormPending(false)
    }
  }

  const handleSignUp = async () => {
    if (isFormPending || isGithubPending) {
      return
    }

    const parsedInput = signUpInputSchema.safeParse({
      nickname,
      email: signUpEmail,
      password: signUpPassword,
      passwordConfirm: signUpPasswordConfirm,
    })
    if (!parsedInput.success) {
      showAuthError(firstIssueMessage(parsedInput.error, '注册时必须填写昵称。'))
      return
    }

    setIsFormPending(true)

    try {
      const supabase = getSupabaseBrowser()
      const { data, error: authError } = await supabase.auth.signUp({
        email: parsedInput.data.email,
        password: parsedInput.data.password,
        options: {
          data: {
            nickname: parsedInput.data.nickname,
            display_name: parsedInput.data.nickname,
          },
        },
      })

      if (authError) {
        throw authError
      }

      if (!data.session) {
        setSignInEmail(parsedInput.data.email)
        setSignInPassword('')
        switchMode('sign-in')
        showAuthError(EMAIL_CONFIRMATION_REQUIRED_MESSAGE)
        return
      }

      finishAuthenticated({
        kind: 'password-sign-up',
        displayName: parsedInput.data.nickname,
      })
    } catch (authError) {
      const nextMessage = friendlyAuthError(authError instanceof Error ? authError.message : '')
      showAuthError(nextMessage)
    } finally {
      setIsFormPending(false)
    }
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-background', className)}>
      <PanelHeader onRequestClose={onRequestClose} />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-6">
        <div className="mx-auto flex min-w-0 w-full max-w-100 flex-col gap-5">
          <OAuthButton pending={isGithubPending} disabled={isGithubPending || isFormPending} onClick={() => void handleGitHubSignIn()} />

          <DividerLabel label="或使用邮箱登录" />

          <EmailAuthSection mode={mode} onModeChange={switchMode}>
            {mode === 'sign-in' ? (
              <SignInForm
                email={signInEmail}
                password={signInPassword}
                pending={isFormPending}
                onEmailChange={setSignInEmail}
                onPasswordChange={setSignInPassword}
                onSubmit={() => void handleSignIn()}
              />
            ) : (
              <SignUpForm
                nickname={nickname}
                email={signUpEmail}
                password={signUpPassword}
                passwordConfirm={signUpPasswordConfirm}
                pending={isFormPending}
                onNicknameChange={setNickname}
                onEmailChange={setSignUpEmail}
                onPasswordChange={setSignUpPassword}
                onPasswordConfirmChange={setSignUpPasswordConfirm}
                onSubmit={() => void handleSignUp()}
              />
            )}
          </EmailAuthSection>
        </div>
      </div>
    </div>
  )
}
