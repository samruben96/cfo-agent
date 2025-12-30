'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/profile'
import { cn } from '@/lib/utils'

import type { ProfileData } from '@/actions/profile'
import type { WindowWithNavHandler } from '@/types/navigation'

interface AgencyProfileFormProps {
  initialData: ProfileData
  className?: string
}

const REVENUE_OPTIONS = [
  'Under $500K',
  '$500K-$1M',
  '$1M-$2M',
  '$2M-$5M',
  'Over $5M'
]

const ROLE_OPTIONS = ['Owner', 'Office Manager', 'Other']

function isDataEqual(a: ProfileData, b: ProfileData): boolean {
  return (
    a.agencyName === b.agencyName &&
    a.annualRevenueRange === b.annualRevenueRange &&
    a.employeeCount === b.employeeCount &&
    a.userRole === b.userRole &&
    a.topFinancialQuestion === b.topFinancialQuestion &&
    a.monthlyOverheadEstimate === b.monthlyOverheadEstimate
  )
}

export function AgencyProfileForm({ initialData, className }: AgencyProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<ProfileData>(initialData)
  const [savedData, setSavedData] = useState<ProfileData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({})
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const isDirty = !isDataEqual(formData, savedData)

  // Handle browser close/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {}

    if (!formData.agencyName?.trim()) {
      newErrors.agencyName = 'Agency name is required'
    }
    if (!formData.annualRevenueRange) {
      newErrors.annualRevenueRange = 'Annual revenue is required'
    }
    if (!formData.employeeCount || formData.employeeCount < 1) {
      newErrors.employeeCount = 'Employee count is required'
    }
    if (!formData.userRole) {
      newErrors.userRole = 'Role is required'
    }
    if (!formData.topFinancialQuestion?.trim()) {
      newErrors.topFinancialQuestion = 'Top financial question is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    startTransition(async () => {
      const { error } = await updateProfile(formData)

      if (error) {
        toast.error(error)
        return
      }

      setSavedData(formData)
      toast.success('Profile updated successfully')
    })
  }

  const handleNavigationAttempt = useCallback((href: string) => {
    if (isDirty) {
      setPendingNavigation(href)
      setShowLeaveDialog(true)
    } else {
      router.push(href)
    }
  }, [isDirty, router])

  const handleSaveAndLeave = async () => {
    if (!validate()) {
      setShowLeaveDialog(false)
      return
    }

    startTransition(async () => {
      const { error } = await updateProfile(formData)

      if (error) {
        toast.error(error)
        setShowLeaveDialog(false)
        return
      }

      setSavedData(formData)
      toast.success('Profile updated successfully')
      setShowLeaveDialog(false)
      if (pendingNavigation) {
        router.push(pendingNavigation)
      }
    })
  }

  const handleDiscardAndLeave = () => {
    setShowLeaveDialog(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  // Expose navigation handler for external use (e.g., Back to Chat link)
  useEffect(() => {
    // Store the handler on window for the page to access
    const windowWithHandler = window as WindowWithNavHandler
    windowWithHandler.__handleSettingsNavigation = handleNavigationAttempt
    return () => {
      delete windowWithHandler.__handleSettingsNavigation
    }
  }, [handleNavigationAttempt])

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Agency Profile</CardTitle>
          <CardDescription>
            Update your agency information. Changes will be reflected in your CFO insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agency Name */}
            <div className="space-y-2">
              <Label htmlFor="agencyName">Agency Name</Label>
              <Input
                id="agencyName"
                value={formData.agencyName || ''}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                placeholder="Enter your agency name"
              />
              {errors.agencyName && (
                <p className="text-sm text-destructive">{errors.agencyName}</p>
              )}
            </div>

            {/* Annual Revenue */}
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Annual Revenue Range</Label>
              <Select
                value={formData.annualRevenueRange || ''}
                onValueChange={(value) => setFormData({ ...formData, annualRevenueRange: value })}
              >
                <SelectTrigger id="annualRevenue">
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.annualRevenueRange && (
                <p className="text-sm text-destructive">{errors.annualRevenueRange}</p>
              )}
            </div>

            {/* Employee Count */}
            <div className="space-y-2">
              <Label htmlFor="employeeCount">Number of Employees</Label>
              <Input
                id="employeeCount"
                type="number"
                min="1"
                value={formData.employeeCount || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  employeeCount: parseInt(e.target.value) || null
                })}
                placeholder="0"
              />
              {errors.employeeCount && (
                <p className="text-sm text-destructive">{errors.employeeCount}</p>
              )}
            </div>

            {/* User Role */}
            <div className="space-y-2">
              <Label htmlFor="userRole">Your Role</Label>
              <Select
                value={formData.userRole || ''}
                onValueChange={(value) => setFormData({ ...formData, userRole: value })}
              >
                <SelectTrigger id="userRole">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userRole && (
                <p className="text-sm text-destructive">{errors.userRole}</p>
              )}
            </div>

            {/* Top Financial Question */}
            <div className="space-y-2">
              <Label htmlFor="topQuestion">Biggest Financial Question</Label>
              <Textarea
                id="topQuestion"
                value={formData.topFinancialQuestion || ''}
                onChange={(e) => setFormData({ ...formData, topFinancialQuestion: e.target.value })}
                placeholder="What's your biggest financial question?"
                className="min-h-[100px]"
              />
              {errors.topFinancialQuestion && (
                <p className="text-sm text-destructive">{errors.topFinancialQuestion}</p>
              )}
            </div>

            {/* Monthly Overhead (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="monthlyOverhead">
                Monthly Overhead Estimate{' '}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="monthlyOverhead"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyOverheadEstimate || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    monthlyOverheadEstimate: parseFloat(e.target.value) || null
                  })}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleDiscardAndLeave}
            >
              Discard Changes
            </Button>
            <AlertDialogAction onClick={handleSaveAndLeave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save & Leave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
