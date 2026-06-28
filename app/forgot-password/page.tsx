'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const forgotPasswordSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormValues = zod.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setError(null)
    setLoading(true)
    setSuccess(false)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        }
      )

      if (resetError) {
        setError(resetError.message)
      } else {
        setSuccess(true)
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
            <CardTitle className="text-xl font-semibold">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we will send you a password reset link.
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
              <div className="mb-6 flex items-start gap-3 rounded-md border border-accent/50 bg-accent/10 p-4 text-sm text-accent">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p>Check your email for the password reset link.</p>
              </div>
            )}

            {!success ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      disabled={loading}
                      placeholder="name@panchayat.gov.in"
                      {...register('email')}
                      className="pl-9"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
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
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </Button>
                
                <div className="text-center text-sm">
                  <Link href="/login" className="font-medium text-accent hover:underline">
                    Back to login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center mt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
