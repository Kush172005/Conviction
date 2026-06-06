import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Building2, Check, Loader2 } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import { useTourStore } from '@/store/tourStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn from '@/components/motion/FadeIn'
import { useAuthStore } from '@/store'
import { authApi } from '@/services/api/auth'
import type { BackendInvestorProfile } from '@/services/api/auth'
import { MOCK_INVESTOR_PROFILE } from '@/mocks/data'
import { getInitials } from '@/lib/utils'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SECTORS = [
  'B2B SaaS', 'AI Infrastructure', 'Developer Tools', 'FinTech', 'HealthTech',
  'Climate Tech', 'Consumer', 'Deep Tech', 'Future of Work', 'Cybersecurity',
  'EdTech', 'Web3', 'MarTech', 'Supply Chain',
]

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const isDemo = useAuthStore((s) => s.isDemo)
  const logout = useAuthStore((s) => s.logout)
  const restartTour = useTourStore((s) => s.restartTour)
  const navigate = useNavigate()

  const [profile, setProfile] = useState<BackendInvestorProfile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  // Form refs for controlled inputs without re-render on every keystroke
  const fundNameRef = useRef<HTMLInputElement>(null)
  const investorNameRef = useRef<HTMLInputElement>(null)
  const thesisRef = useRef<HTMLTextAreaElement>(null)
  const [sectors, setSectors] = useState<string[]>([])

  useEffect(() => {
    if (isDemo) {
      // Demo: use mock profile
      setProfile({
        id: 'mock',
        user_id: 'mock',
        fund_name: MOCK_INVESTOR_PROFILE.fundName,
        investor_name: MOCK_INVESTOR_PROFILE.investorName,
        investment_thesis: MOCK_INVESTOR_PROFILE.investmentThesis,
        preferred_sectors: MOCK_INVESTOR_PROFILE.preferredSectors,
        preferred_stages: MOCK_INVESTOR_PROFILE.preferredStages,
        typical_check_size: MOCK_INVESTOR_PROFILE.typicalCheckSize,
        geographies: MOCK_INVESTOR_PROFILE.geographies,
        investment_style: MOCK_INVESTOR_PROFILE.investmentStyle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setSectors(MOCK_INVESTOR_PROFILE.preferredSectors)
      return
    }

    authApi.getInvestorProfile()
      .then((p) => {
        setProfile(p)
        setSectors(p.preferred_sectors)
      })
      .catch(() => setLoadError('Could not load your investor profile.'))
  }, [isDemo])

  function toggleSector(s: string) {
    setSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  async function handleSave() {
    if (isDemo || !profile) return
    setSaveState('saving')
    try {
      const updated = await authApi.updateInvestorProfile({
        fund_name: fundNameRef.current?.value || profile.fund_name,
        investor_name: investorNameRef.current?.value || profile.investor_name,
        investment_thesis: thesisRef.current?.value || profile.investment_thesis,
        preferred_sectors: sectors,
        preferred_stages: profile.preferred_stages,
        typical_check_size: profile.typical_check_size,
        geographies: profile.geographies,
        investment_style: profile.investment_style,
      })
      setProfile(updated)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <FadeIn>
        <div data-tour="tour-settings-page">
          <PageHeader title="Settings" description="Manage your account and workspace preferences." />
        </div>
      </FadeIn>

      <div className="space-y-8">
        {/* Profile section */}
        <FadeIn delay={0.05}>
          <div className="rounded-lg border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-base bg-conviction-500/20 text-conviction-300">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {isDemo ? (
                      <Badge className="text-2xs bg-amber-500/15 text-amber-400 border-amber-500/30">Demo account</Badge>
                    ) : (
                      <Badge variant="muted" className="text-2xs">Google account</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input defaultValue={user?.name} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} readOnly className="bg-secondary/50" />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Fund & Thesis */}
        <FadeIn delay={0.1}>
          <div className="rounded-lg border border-border bg-card" data-tour="tour-settings-thesis">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Fund & Investment Thesis
              </h2>
              {isDemo && (
                <Badge className="text-2xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Read-only in demo
                </Badge>
              )}
            </div>

            {loadError && (
              <div className="px-5 py-3 text-sm text-red-400 bg-red-500/5 border-b border-border">
                {loadError}
              </div>
            )}

            {!profile && !loadError && (
              <div className="p-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading profile…
              </div>
            )}

            {profile && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Fund name</Label>
                    <Input
                      ref={fundNameRef}
                      defaultValue={profile.fund_name}
                      readOnly={isDemo}
                      className={isDemo ? 'bg-secondary/50' : ''}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Your name</Label>
                    <Input
                      ref={investorNameRef}
                      defaultValue={profile.investor_name}
                      readOnly={isDemo}
                      className={isDemo ? 'bg-secondary/50' : ''}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Investment thesis</Label>
                  <Textarea
                    ref={thesisRef}
                    defaultValue={profile.investment_thesis}
                    readOnly={isDemo}
                    className={`min-h-[120px] resize-none text-sm ${isDemo ? 'bg-secondary/50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred sectors</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {SECTORS.map((s) => {
                      const active = sectors.includes(s)
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isDemo}
                          onClick={() => !isDemo && toggleSector(s)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            active
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                          } disabled:cursor-default disabled:opacity-70`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Check size</Label>
                    <Input defaultValue={profile.typical_check_size} readOnly className="bg-secondary/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Style</Label>
                    <Input defaultValue={profile.investment_style} readOnly className="bg-secondary/50 capitalize" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stages</Label>
                    <Input defaultValue={profile.preferred_stages.join(', ')} readOnly className="bg-secondary/50" />
                  </div>
                </div>
                {!isDemo && (
                  <Button size="sm" onClick={handleSave} disabled={saveState === 'saving'}>
                    {saveState === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {saveState === 'saved' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    {saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Failed — try again' : 'Save changes'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Product tour */}
        <FadeIn delay={0.12}>
          <div className="rounded-lg border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-conviction">
                  <LogoMark className="h-3 w-3" />
                </div>
                Product tour
              </h2>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Replay the walkthrough</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    A full walkthrough of every feature — what it does and what to click first.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={restartTour} className="w-full sm:w-auto">
                  Start tour
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Account */}
        <FadeIn delay={0.15}>
          <div className="rounded-lg border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Account</h2>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isDemo ? 'Exit demo' : 'Sign out'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isDemo
                      ? 'Sign in with Google to create your own workspace.'
                      : "You'll need to sign in again to access your workspace."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 w-full sm:w-auto"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {isDemo ? 'Exit demo' : 'Sign out'}
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
