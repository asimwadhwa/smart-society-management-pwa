'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // Step state
  const [step, setStep] = useState<Step>('email');
  
  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'OTP sent to your email');
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setMessage('OTP verified successfully');
        setStep('password');
      } else {
        setError(data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('New OTP sent to your email');
        setOtp('');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const ProgressSteps = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
        step === 'email' ? 'bg-primary text-white' : 
        step !== 'email' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {step !== 'email' ? '✓' : '1'}
      </div>
      <div className={`w-12 h-1 rounded ${step !== 'email' ? 'bg-green-500' : 'bg-gray-200'}`} />
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
        step === 'otp' ? 'bg-primary text-white' : 
        step === 'password' || step === 'success' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {step === 'password' || step === 'success' ? '✓' : '2'}
      </div>
      <div className={`w-12 h-1 rounded ${step === 'password' || step === 'success' ? 'bg-green-500' : 'bg-gray-200'}`} />
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
        step === 'password' ? 'bg-primary text-white' : 
        step === 'success' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {step === 'success' ? '✓' : '3'}
      </div>
    </div>
  );

  // Step 1: Email Input
  if (step === 'email') {
    return (
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we&apos;ll send you an OTP to reset your password
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRequestOTP}>
          <CardContent className="space-y-4">
            <ProgressSteps />
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-primary font-medium hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Step 2: OTP Verification
  if (step === 'otp') {
    return (
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verify OTP</CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerifyOTP}>
          <CardContent className="space-y-4">
            <ProgressSteps />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center">
          <button
            onClick={() => { setStep('email'); setOtp(''); setError(''); setMessage(''); }}
            className="text-primary font-medium hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Change Email
          </button>
        </CardFooter>
      </Card>
    );
  }

  // Step 3: New Password
  if (step === 'password') {
    return (
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            <ProgressSteps />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    );
  }

  // Step 4: Success
  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-center text-green-600">Password Reset Successful!</CardTitle>
        <CardDescription className="text-center">
          Your password has been changed successfully. You can now login with your new password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => router.push('/login')} className="w-full">
          Go to Login
        </Button>
      </CardContent>
    </Card>
  );
}
