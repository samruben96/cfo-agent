'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { Plus } from 'lucide-react'
import { toast } from 'sonner'

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SoftwareCostItem } from './SoftwareCostItem'
import { saveOverheadCosts } from '@/actions/overhead-costs'
import { cn } from '@/lib/utils'

import type { OverheadCosts, OverheadCostsFormData, SoftwareCost } from '@/types/overhead-costs'
import type { WindowWithNavHandler } from '@/types/navigation'

interface OverheadCostFormProps {
  initialData: OverheadCosts | null
  className?: string
}

function createEmptySoftwareCost(): SoftwareCost {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    monthlyCost: 0,
  }
}

function isFormDataEqual(
  form: OverheadCostsFormData,
  initial: OverheadCosts | null
): boolean {
  const initialRent = initial?.monthlyRent ?? 0
  const initialUtilities = initial?.monthlyUtilities ?? 0
  const initialInsurance = initial?.monthlyInsurance ?? 0
  const initialOther = initial?.otherMonthlyCosts ?? 0
  const initialSoftware = initial?.softwareCosts ?? []

  const formRent = form.monthlyRent ?? 0
  const formUtilities = form.monthlyUtilities ?? 0
  const formInsurance = form.monthlyInsurance ?? 0
  const formOther = form.otherMonthlyCosts ?? 0
  // Filter out empty software items for comparison
  const formSoftware = form.softwareCosts.filter((s) => s.name.trim() !== '')

  if (
    formRent !== initialRent ||
    formUtilities !== initialUtilities ||
    formInsurance !== initialInsurance ||
    formOther !== initialOther
  ) {
    return false
  }

  if (formSoftware.length !== initialSoftware.length) {
    return false
  }

  for (let i = 0; i < formSoftware.length; i++) {
    const formItem = formSoftware[i]
    const initialItem = initialSoftware.find(
      (s) => s.name === formItem.name && s.monthlyCost === formItem.monthlyCost
    )
    if (!initialItem) {
      return false
    }
  }

  return true
}

export function OverheadCostForm({
  initialData,
  className,
}: OverheadCostFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [formData, setFormData] = useState<OverheadCostsFormData>({
    monthlyRent: initialData?.monthlyRent ?? null,
    monthlyUtilities: initialData?.monthlyUtilities ?? null,
    monthlyInsurance: initialData?.monthlyInsurance ?? null,
    otherMonthlyCosts: initialData?.otherMonthlyCosts ?? null,
    softwareCosts: initialData?.softwareCosts ?? [],
  })

  // Track saved state for dirty detection
  const [savedData, setSavedData] = useState<OverheadCosts | null>(initialData)

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Navigation guard state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  )

  const isDirty = !isFormDataEqual(formData, savedData)

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

  const handleNavigationAttempt = useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingNavigation(href)
        setShowLeaveDialog(true)
      } else {
        router.push(href)
      }
    },
    [isDirty, router]
  )

  // Expose navigation handler for external use
  useEffect(() => {
    const windowWithHandler = window as WindowWithNavHandler
    windowWithHandler.__handleSettingsNavigation = handleNavigationAttempt
    return () => {
      delete windowWithHandler.__handleSettingsNavigation
    }
  }, [handleNavigationAttempt])

  function handleAddSoftware() {
    setFormData({
      ...formData,
      softwareCosts: [...formData.softwareCosts, createEmptySoftwareCost()],
    })
  }

  function handleRemoveSoftware(id: string) {
    setFormData({
      ...formData,
      softwareCosts: formData.softwareCosts.filter((sc) => sc.id !== id),
    })
  }

  function handleUpdateSoftware(id: string, updates: Partial<SoftwareCost>) {
    setFormData({
      ...formData,
      softwareCosts: formData.softwareCosts.map((sc) =>
        sc.id === id ? { ...sc, ...updates } : sc
      ),
    })
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    // Validate numeric fields are non-negative
    const numericFields = [
      { key: 'monthlyRent', value: formData.monthlyRent, label: 'Monthly Rent' },
      {
        key: 'monthlyUtilities',
        value: formData.monthlyUtilities,
        label: 'Utilities',
      },
      {
        key: 'monthlyInsurance',
        value: formData.monthlyInsurance,
        label: 'Insurance',
      },
      {
        key: 'otherMonthlyCosts',
        value: formData.otherMonthlyCosts,
        label: 'Other Costs',
      },
    ]

    numericFields.forEach(({ key, value, label }) => {
      if (value !== null && value < 0) {
        newErrors[key] = `${label} must be a positive number`
      }
    })

    // Validate software costs
    formData.softwareCosts.forEach((sc, idx) => {
      if (sc.name.trim() !== '' && sc.monthlyCost < 0) {
        newErrors[`software-${idx}`] = 'Cost must be positive'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    startTransition(async () => {
      const { data, error } = await saveOverheadCosts(formData)

      if (error) {
        toast.error(error)
        return
      }

      if (data) {
        setSavedData(data)
        // Update form state with saved data (includes cleaned up software items)
        setFormData({
          monthlyRent: data.monthlyRent,
          monthlyUtilities: data.monthlyUtilities,
          monthlyInsurance: data.monthlyInsurance,
          otherMonthlyCosts: data.otherMonthlyCosts,
          softwareCosts: data.softwareCosts,
        })
      }

      toast.success('Overhead costs saved successfully')
    })
  }

  const handleSaveAndLeave = async () => {
    if (!validateForm()) {
      setShowLeaveDialog(false)
      return
    }

    startTransition(async () => {
      const { data, error } = await saveOverheadCosts(formData)

      if (error) {
        toast.error(error)
        setShowLeaveDialog(false)
        return
      }

      if (data) {
        setSavedData(data)
      }

      toast.success('Overhead costs saved successfully')
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

  return (
    <>
      <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overhead Costs</CardTitle>
            <CardDescription>
              Enter your regular monthly operating expenses. These will be used
              to calculate true employee costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rent Field */}
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="monthlyRent"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthlyRent ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyRent: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="pl-7"
                  disabled={isPending}
                />
              </div>
              {errors.monthlyRent && (
                <p className="text-sm text-destructive">{errors.monthlyRent}</p>
              )}
            </div>

            {/* Utilities Field */}
            <div className="space-y-2">
              <Label htmlFor="monthlyUtilities">Monthly Utilities</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="monthlyUtilities"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthlyUtilities ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyUtilities: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="pl-7"
                  disabled={isPending}
                />
              </div>
              {errors.monthlyUtilities && (
                <p className="text-sm text-destructive">
                  {errors.monthlyUtilities}
                </p>
              )}
            </div>

            {/* Insurance Field */}
            <div className="space-y-2">
              <Label htmlFor="monthlyInsurance">Monthly Insurance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="monthlyInsurance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthlyInsurance ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyInsurance: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="pl-7"
                  disabled={isPending}
                />
              </div>
              {errors.monthlyInsurance && (
                <p className="text-sm text-destructive">
                  {errors.monthlyInsurance}
                </p>
              )}
            </div>

            {/* Other Monthly Costs Field */}
            <div className="space-y-2">
              <Label htmlFor="otherMonthlyCosts">Other Monthly Costs</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="otherMonthlyCosts"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.otherMonthlyCosts ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      otherMonthlyCosts: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="pl-7"
                  disabled={isPending}
                />
              </div>
              {errors.otherMonthlyCosts && (
                <p className="text-sm text-destructive">
                  {errors.otherMonthlyCosts}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Software Costs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Software & SaaS Costs</CardTitle>
            <CardDescription>
              Add your monthly software subscriptions (e.g., QuickBooks, Slack,
              AgencyZoom)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.softwareCosts.map((sc, idx) => (
              <SoftwareCostItem
                key={sc.id}
                software={sc}
                onUpdate={(updates) => handleUpdateSoftware(sc.id, updates)}
                onRemove={() => handleRemoveSoftware(sc.id)}
                disabled={isPending}
                error={errors[`software-${idx}`]}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddSoftware}
              disabled={isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Software
            </Button>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? 'Saving...' : 'Save Overhead Costs'}
          </Button>
        </div>
      </form>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before
              leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleDiscardAndLeave}>
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
