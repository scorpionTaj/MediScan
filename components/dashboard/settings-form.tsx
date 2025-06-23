"use client"

import { useState, useEffect } from "react"
import { Check, Copy, Eye, EyeOff, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

export function SettingsForm() {
  const { theme, setTheme } = useTheme()
  const [accentColor, setAccentColor] = useState<string>("teal")
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Load saved accent color from localStorage
    const savedAccentColor = localStorage.getItem("accentColor")
    if (savedAccentColor) {
      setAccentColor(savedAccentColor)
    }
  }, [])

  useEffect(() => {
    // Apply the accent color to CSS variables
    const applyAccentColor = (color: string) => {
      let hue, saturation, lightness

      switch (color) {
        case "teal":
          hue = 173
          saturation = 80
          lightness = 40
          break
        case "blue":
          hue = 221
          saturation = 83
          lightness = 53
          break
        case "violet":
          hue = 262
          saturation = 83
          lightness = 58
          break
        case "pink":
          hue = 330
          saturation = 81
          lightness = 60
          break
        case "orange":
          hue = 25
          saturation = 95
          lightness = 53
          break
        case "green":
          hue = 142
          saturation = 76
          lightness = 36
          break
        default:
          hue = 173
          saturation = 80
          lightness = 40
      }

      document.documentElement.style.setProperty("--primary", `${hue} ${saturation}% ${lightness}%`)
    }

    applyAccentColor(accentColor)
  }, [accentColor])

  const handleSaveSettings = () => {
    // Save accent color to localStorage
    localStorage.setItem("accentColor", accentColor)

    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    })
  }

  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0

    let strength = 0
    // Length check
    if (password.length >= 8) strength += 20
    if (password.length >= 12) strength += 10

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 20 // Has uppercase
    if (/[a-z]/.test(password)) strength += 15 // Has lowercase
    if (/[0-9]/.test(password)) strength += 15 // Has number
    if (/[^A-Za-z0-9]/.test(password)) strength += 20 // Has special char

    return Math.min(100, strength)
  }

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword))
  }, [newPassword])

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return "Very Weak"
    if (passwordStrength < 50) return "Weak"
    if (passwordStrength < 70) return "Moderate"
    if (passwordStrength < 90) return "Strong"
    return "Very Strong"
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return "bg-destructive"
    if (passwordStrength < 50) return "bg-destructive/80"
    if (passwordStrength < 70) return "bg-warning"
    if (passwordStrength < 90) return "bg-success/80"
    return "bg-success"
  }

  const generatePassword = () => {
    const length = 16
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?"
    let password = ""

    // Ensure at least one of each character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
    password += "0123456789"[Math.floor(Math.random() * 10)]
    password += "!@#$%^&*()_-+=<>?"[Math.floor(Math.random() * 16)]

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")

    setGeneratedPassword(password)
    setCopied(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const useGeneratedPassword = () => {
    setNewPassword(generatedPassword)
    setConfirmPassword(generatedPassword)
  }

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordStrength < 50) {
      toast({
        title: "Warning",
        description: "Your password is weak. Consider using a stronger password.",
        variant: "warning",
      })
      return
    }

    // Simulate password change
    toast({
      title: "Success",
      description: "Your password has been updated successfully",
    })

    // Clear the form
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setGeneratedPassword("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => setTheme(value)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                <Label
                  htmlFor="theme-light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="mb-2 rounded-md bg-background p-2 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-2 w-[80px] rounded-lg bg-primary/70" />
                      <div className="h-2 w-[100px] rounded-lg bg-muted" />
                    </div>
                  </div>
                  <span className="text-center text-sm font-medium">Light</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                <Label
                  htmlFor="theme-dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="mb-2 rounded-md bg-slate-950 p-2 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-2 w-[80px] rounded-lg bg-primary/70" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                    </div>
                  </div>
                  <span className="text-center text-sm font-medium">Dark</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                <Label
                  htmlFor="theme-system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="mb-2 rounded-md bg-background p-2 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-1/2 space-y-2">
                        <div className="h-2 rounded-lg bg-primary/70" />
                        <div className="h-2 rounded-lg bg-muted" />
                      </div>
                      <div className="w-1/2 space-y-2">
                        <div className="h-2 rounded-lg bg-slate-950" />
                        <div className="h-2 rounded-lg bg-slate-800" />
                      </div>
                    </div>
                  </div>
                  <span className="text-center text-sm font-medium">System</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Accent Color</Label>
            <RadioGroup defaultValue={accentColor} onValueChange={setAccentColor} className="grid grid-cols-6 gap-2">
              <ColorOption color="teal" value="teal" currentValue={accentColor} />
              <ColorOption color="blue" value="blue" currentValue={accentColor} />
              <ColorOption color="violet" value="violet" currentValue={accentColor} />
              <ColorOption color="pink" value="pink" currentValue={accentColor} />
              <ColorOption color="orange" value="orange" currentValue={accentColor} />
              <ColorOption color="green" value="green" currentValue={accentColor} />
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-2">
              Select an accent color for buttons and interactive elements
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save preferences
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="new-password">New Password</Label>
              {newPassword && <span className="text-xs text-muted-foreground">{getPasswordStrengthText()}</span>}
            </div>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {newPassword && (
              <Progress value={passwordStrength} className={`h-1 w-full ${getPasswordStrengthColor()}`} />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label>Password Generator</Label>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={generatePassword} className="flex-shrink-0">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </Button>
              {generatedPassword && (
                <>
                  <Input value={generatedPassword} readOnly className="font-mono" />
                  <Button type="button" variant="outline" onClick={copyToClipboard} className="flex-shrink-0">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" onClick={useGeneratedPassword} className="flex-shrink-0">
                    Use
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Generate a strong, random password</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleChangePassword}>
            <Save className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage your email notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <RadioGroup defaultValue="all" id="email-notifications">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="important" id="important" />
                <Label htmlFor="important">Important notifications only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">No notifications</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

interface ColorOptionProps {
  color: string
  value: string
  currentValue: string
}

function ColorOption({ color, value, currentValue }: ColorOptionProps) {
  const isSelected = value === currentValue

  const getColorClass = (color: string) => {
    switch (color) {
      case "teal":
        return "bg-teal-500"
      case "blue":
        return "bg-blue-500"
      case "violet":
        return "bg-violet-500"
      case "pink":
        return "bg-pink-500"
      case "orange":
        return "bg-orange-500"
      case "green":
        return "bg-green-500"
      default:
        return "bg-teal-500"
    }
  }

  return (
    <div className="relative">
      <RadioGroupItem value={value} id={`color-${value}`} className="peer sr-only" />
      <Label
        htmlFor={`color-${value}`}
        className={`flex h-10 w-10 items-center justify-center rounded-full ${getColorClass(color)} cursor-pointer ring-offset-background transition-all hover:scale-110 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-ring peer-data-[state=checked]:ring-offset-2`}
      >
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </Label>
    </div>
  )
}
