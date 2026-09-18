'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  Alert,
  AlertDescription
} from '@/components/ui/alert';

import {
  Mail,
  Lock,
  Building2,
  ArrowRight,
  Loader2,
  LogIn
} from 'lucide-react';

export default function LoginPage() {

  const router = useRouter();

  const {
    login,
    isAuthenticated,
    loading: authLoading
  } = useAuth();

  // ============================================================
  // FORM
  // ============================================================

  const [societyCode, setSocietyCode] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  // ============================================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // ============================================================

  useEffect(() => {

    if (
      !authLoading &&
      isAuthenticated
    ) {
      router.push('/');
    }

  }, [
    isAuthenticated,
    authLoading,
    router
  ]);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setError('');

    const cleanSocietyCode =
      societyCode
        .trim()
        .toUpperCase();

    const cleanEmail =
      email.trim();

    const cleanPassword =
      password;

    // ----------------------------------------------------------
    // REQUIRED
    // ----------------------------------------------------------

    if (
      !cleanEmail ||
      !cleanPassword
    ) {
      setError(
        'Please enter email and password.'
      );
      return;
    }

    // ----------------------------------------------------------
    // EMAIL
    // ----------------------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (
      !emailRegex.test(cleanEmail)
    ) {
      setError(
        'Please enter a valid email address.'
      );
      return;
    }

    // ----------------------------------------------------------
    // PASSWORD
    // ----------------------------------------------------------

    if (
      !cleanPassword.trim()
    ) {
      setError(
        'Password cannot be empty or contain only spaces.'
      );
      return;
    }

    // ----------------------------------------------------------
    // SOCIETY CODE
    //
    // Required for normal users.
    // Backend will identify Super Admin
    // without society code.
    //
    // We keep it optional here so Super Admin
    // can login directly.
    // ----------------------------------------------------------

    setLoading(true);

    try {

      const loginData: {
        email: string;
        password: string;
        society_code?: string;
      } = {
        email:
          cleanEmail.toLowerCase(),
        password:
          cleanPassword
      };

      if (cleanSocietyCode) {
        loginData.society_code =
          cleanSocietyCode;
      }

      const result =
        await login(loginData);

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (result.success) {

        if (
          result.user?.role ===
          'watchman'
        ) {

          router.push(
            '/watchman'
          );

        } else {

          router.push('/');
        }

      } else {

        setError(
          result.message ||
          'Invalid login details.'
        );
      }

    } catch (_err) {

      setError(
        'An unexpected error occurred. Please try again.'
      );

    } finally {

      setLoading(false);
    }
  };

  // ============================================================
  // AUTH CHECK LOADING
  // ============================================================

  if (authLoading) {

    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">

        <CardContent className="py-12">

          <div className="flex flex-col items-center justify-center gap-3">

            <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>

            <p className="text-sm text-slate-500">
              Checking authentication...
            </p>

          </div>

        </CardContent>

      </Card>
    );
  }

  // ============================================================
  // LOGIN UI
  // ============================================================

  return (

    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">

      <CardHeader className="space-y-1 pb-6">

        <div className="flex items-center justify-center mb-2">

          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">

            <LogIn className="w-6 h-6 text-blue-600" />

          </div>

        </div>

        <CardTitle className="text-2xl font-bold text-center text-slate-900">

          Welcome back

        </CardTitle>

        <CardDescription className="text-center text-slate-500">

          Sign in to your society account

        </CardDescription>

      </CardHeader>

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
      >

        <CardContent className="space-y-5">

          {error && (

            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-red-700"
            >

              <AlertDescription>
                {error}
              </AlertDescription>

            </Alert>

          )}

          {/* ==================================================
              SOCIETY CODE
          ================================================== */}

          <div className="space-y-2">

            <Label
              htmlFor="society-code"
              className="text-slate-700 font-medium"
            >
              Society Code
            </Label>

            <div className="relative">

              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <Input
                id="society-code"
                name="society-code"
                type="text"
                placeholder="Enter society code"
                value={societyCode}
                onChange={(e) => {
                  setSocietyCode(
                    e.target.value.toUpperCase()
                  );
                  setError('');
                }}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 uppercase"
              />

            </div>

            <p className="text-xs text-slate-400">
              Required for Manager, Admin and Resident login
            </p>

          </div>

          {/* ==================================================
              EMAIL
          ================================================== */}

          <div className="space-y-2">

            <Label
              htmlFor="login-email"
              className="text-slate-700 font-medium"
            >
              Email
            </Label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <Input
                id="login-email"
                name="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(
                    e.target.value
                  );
                  setError('');
                }}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />

            </div>

          </div>

          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div className="space-y-2">

            <div className="flex items-center justify-between">

              <Label
                htmlFor="login-password"
                className="text-slate-700 font-medium"
              >
                Password
              </Label>

              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>

            </div>

            <div className="relative">

              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <Input
                id="login-password"
                name="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(
                    e.target.value
                  );
                  setError('');
                }}
                disabled={loading}
                autoComplete="new-password"
                className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />

            </div>

          </div>

        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/20"
            disabled={loading}
          >

            {loading ? (

              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>

            ) : (

              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </>

            )}

          </Button>

          <div className="relative w-full">

            <div className="absolute inset-0 flex items-center">

              <div className="w-full border-t border-slate-200"></div>

            </div>

            <div className="relative flex justify-center text-sm">

              <span className="px-2 bg-white text-slate-500">
                or
              </span>

            </div>

          </div>

          <p className="text-sm text-center text-slate-600">

            Don&apos;t have an account?{' '}

            <Link
              href="/register"
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              Create account
            </Link>

          </p>

        </CardFooter>

      </form>

    </Card>
  );
}