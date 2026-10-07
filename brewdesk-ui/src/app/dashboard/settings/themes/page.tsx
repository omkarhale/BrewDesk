'use client'

import * as React from 'react'
import { useTheme, COLOR_PRESETS } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Check,
  CheckCircle2,
  Coffee,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  TrendingUp,
} from 'lucide-react'

export default function CustomThemesPage() {
  const {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    customHex,
    setCustomHex,
    resetToDefault,
    presets,
    userEmail,
  } = useTheme()

  const [hexInput, setHexInput] = React.useState(customHex || '#009B77')
  const [demoSwitch, setDemoSwitch] = React.useState(true)

  // Sync internal hex input when customHex changes
  React.useEffect(() => {
    if (customHex) setHexInput(customHex)
  }, [customHex])

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let validHex = hexInput.trim()
    if (!validHex.startsWith('#')) {
      validHex = `#${validHex}`
    }
    const regex = /^#([0-9A-F]{3}){1,2}$/i
    if (!regex.test(validHex)) {
      toast.error('Please enter a valid 3 or 6 digit hex color (e.g. #009B77)')
      return
    }
    setCustomHex(validHex)
    toast.success(`Custom color applied globally across app for ${userEmail || 'your account'}: ${validHex}`)
  }

  const handlePresetSelect = (id: string, name: string) => {
    setColorTheme(id)
    toast.success(`Switched theme to ${name}. Applied globally for ${userEmail || 'your account'}!`)
  }

  const handleReset = () => {
    resetToDefault()
    setHexInput('#009B77')
    toast.info(`Theme reset to default Rippling Teal for ${userEmail || 'your account'}`)
  }

  const activePreset = presets.find((p) => p.id === colorTheme)

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Custom Themes & Color Palette</h1>
                {userEmail && (
                  <Badge variant="outline" className="text-[11px] font-mono border-primary/40 text-primary bg-primary/5">
                    User: {userEmail}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Personalize your BrewDesk experience. When chosen, your theme applies across the entire app (sidebar, header, buttons, badges & charts) and saves to your account.
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="self-start sm:self-auto gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to Default
        </Button>
      </div>

      {/* ── Section 1: Appearance Mode ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Appearance Mode</CardTitle>
          <CardDescription className="text-xs">
            Choose light mode, dark mode, or follow your system preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light */}
            <div
              onClick={() => setTheme('light')}
              className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                theme === 'light'
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                  : 'border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                <Sun className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Light</p>
                <p className="text-xs text-muted-foreground font-normal">Clean, bright workspace</p>
              </div>
              {theme === 'light' && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>

            {/* Dark */}
            <div
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                  : 'border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                <Moon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Dark</p>
                <p className="text-xs text-muted-foreground font-normal">Reduced eye strain</p>
              </div>
              {theme === 'dark' && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>

            {/* System */}
            <div
              onClick={() => setTheme('system')}
              className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                theme === 'system'
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                  : 'border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">System</p>
                <p className="text-xs text-muted-foreground font-normal">Sync with device OS</p>
              </div>
              {theme === 'system' && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Curated Theme Presets ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Theme Color Presets</CardTitle>
              <CardDescription className="text-xs">
                Select from handcrafted palettes designed for optimal contrast, readability, and modern aesthetics.
              </CardDescription>
            </div>
            {colorTheme !== 'custom' && activePreset && (
              <Badge variant="outline" className="hidden sm:inline-flex text-xs border-primary text-primary">
                Active: {activePreset.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {presets.map((preset) => {
              const isActive = colorTheme === preset.id

              return (
                <div
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id, preset.name)}
                  className={`group relative flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-6 w-6 rounded-full shadow-inner border border-black/10 shrink-0"
                          style={{ backgroundColor: preset.primaryHex }}
                        />
                        <span className="font-semibold text-sm text-foreground">{preset.name}</span>
                      </div>
                      {isActive && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">{preset.primaryHex}</span>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePresetSelect(preset.id, preset.name)
                      }}
                    >
                      {isActive ? 'Active' : 'Try Theme'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Custom Color Palette Studio ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Custom Color Palette Studio</CardTitle>
              <CardDescription className="text-xs">
                Pick or enter any custom hex color. BrewDesk dynamically calculates matching accent, ring, and chart tokens.
              </CardDescription>
            </div>
            {colorTheme === 'custom' && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                Custom Color Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Color Swatch & Native Picker */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  id="color-picker-input"
                  value={customHex.startsWith('#') ? customHex : `#${customHex}`}
                  onChange={(e) => {
                    setHexInput(e.target.value)
                    setCustomHex(e.target.value)
                  }}
                  className="h-16 w-16 rounded-2xl cursor-pointer border border-border p-1 bg-background shadow-xs"
                />
              </div>
              <div>
                <Label htmlFor="color-picker-input" className="text-sm font-semibold">
                  Click to open color wheel
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select any primary tint from the spectrum
                </p>
              </div>
            </div>

            {/* Hex Input Form */}
            <form onSubmit={handleHexSubmit} className="flex-1 flex items-center gap-3 max-w-sm">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                  #
                </span>
                <Input
                  value={hexInput.replace('#', '')}
                  onChange={(e) => setHexInput(`#${e.target.value}`)}
                  placeholder="009B77"
                  className="pl-7 font-mono text-sm uppercase"
                  maxLength={6}
                />
              </div>
              <Button type="submit" size="sm">
                Apply Color
              </Button>
            </form>
          </div>

          {/* Quick Swatch Picks */}
          <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2 font-medium">Quick samples:</span>
            {[
              { hex: '#009B77', name: 'Teal' },
              { hex: '#0284C7', name: 'Blue' },
              { hex: '#6366F1', name: 'Indigo' },
              { hex: '#8B5CF6', name: 'Violet' },
              { hex: '#EC4899', name: 'Pink' },
              { hex: '#F43F5E', name: 'Rose' },
              { hex: '#F59E0B', name: 'Amber' },
              { hex: '#10B981', name: 'Emerald' },
            ].map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => {
                  setHexInput(swatch.hex)
                  setCustomHex(swatch.hex)
                  toast.success(`Applied ${swatch.name} (${swatch.hex})`)
                }}
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-muted/50 text-xs transition-colors"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: swatch.hex }}
                />
                <span className="text-muted-foreground group-hover:text-foreground">{swatch.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Live Interactive UI Sandbox ("Try different themes") ── */}
      <Card className="border-primary/30 shadow-md">
        <CardHeader className="bg-primary/5 border-b border-primary/10 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Live Component Sandbox</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              Previewing active theme
            </Badge>
          </div>
          <CardDescription className="text-xs">
            See how buttons, badges, status indicators, and navigation adapt instantly to your selected theme.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Row 1: Buttons & Interactive Triggers */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buttons & Actions</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => toast.success('Theme test notification working perfectly!')}
              >
                Test Toast Notification
              </Button>
            </div>
          </div>

          {/* Row 2: Badges & Tags */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Badges & Indicators</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="bg-primary text-primary-foreground">Primary Badge</Badge>
              <Badge variant="outline" className="border-primary text-primary">Border Primary</Badge>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Accent Pill Component
              </span>
            </div>
          </div>

          {/* Row 3: Live Stat & Card Component */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase">Active Round Orders</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Coffee className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2 text-foreground">42 Cups</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+14% vs yesterday</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="demo-toggle" className="text-xs font-semibold text-foreground">
                  Interactive Toggle Switch
                </Label>
                <Switch
                  id="demo-toggle"
                  checked={demoSwitch}
                  onCheckedChange={setDemoSwitch}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shift Attendance Completion</span>
                  <span className="font-semibold text-foreground">88%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300 w-[88%]" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
