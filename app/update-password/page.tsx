'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Loader2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const updatePasswordSchema = zod.object({
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type UpdatePasswordFormValues = zod.infer<typeof updatePasswordSchema>

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    setError(null)
    setLoading(true)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        // Optionally redirect after a few seconds or let them click a button
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Soochika logo" className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/90 p-2 shadow-sm" />
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            <span className="text-accent text-4xl">സൂചിക</span> / Soochika
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Panchayat Beneficiary Management System
          </p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Update Password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-6 flex flex-col items-center gap-3 rounded-md border border-accent/50 bg-accent/10 p-6 text-center text-sm text-accent">
                <CheckCircle2 className="h-8 w-8" />
                <p className="text-base font-medium">Password updated successfully!</p>
                <Link href="/" className="mt-4 w-full">
                  <Button className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      disabled={loading}
                      placeholder="••••••••"
                      {...register('password')}
                      className="pl-9"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      disabled={loading}
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className="pl-9"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
