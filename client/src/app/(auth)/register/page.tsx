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
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FLAT_NUMBERS } from '@/lib/constants';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    flat_no: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingManager, setCheckingManager] =
    useState(true);

  // Check if manager exists
  useEffect(() => {
    const checkManager = async () => {
      try {
        const response = await api.get(
          '/auth/manager-exists'
        );

        if (!response.data.data?.exists) {
          router.push('/manager-setup');
        }
      } catch (err) {
        console.error(
          'Error checking manager:',
          err
        );
      } finally {
        setCheckingManager(false);
      }
    };

    checkManager();
  }, [router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError('');
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword =
      formData.confirmPassword;
    const flat_no = formData.flat_no;
    const phone = formData.phone;

    // 1. Required fields
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !flat_no ||
      !phone
    ) {
      setError(
        'Please fill in all required fields.'
      );
      return;
    }

    // 2. Name validation
    if (name.length < 2) {
      setError(
        'Full name must be at least 2 characters.'
      );
      return;
    }

    if (name.length > 50) {
      setError(
        'Full name must not exceed 50 characters.'
      );
      return;
    }

    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(name)) {
      setError(
        'Full name can contain only letters, spaces, dot, apostrophe and hyphen.'
      );
      return;
    }

    // 3. Email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(email)) {
      setError(
        'Please enter a valid email address.'
      );
      return;
    }

    // 4. Phone validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.'
      );
      return;
    }

    // 5. Password validation
    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters long.'
      );
      return;
    }

    if (password.length > 64) {
      setError(
        'Password must not exceed 64 characters.'
      );
      return;
    }

    if (/\s/.test(password)) {
      setError(
        'Password must not contain spaces.'
      );
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(
        'Password must contain at least one uppercase letter.'
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError(
        'Password must contain at least one lowercase letter.'
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(
        'Password must contain at least one number.'
      );
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]\/+=;'`~]/.test(password)) {
      setError(
        'Password must contain at least one special character.'
      );
      return;
    }

    // 6. Confirm password
    if (password !== confirmPassword) {
      setError(
        'Passwords do not match.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        '/auth/register',
        {
          name,
          email,
          password,
          flat_no,
          phone,
        }
      );

      if (response.data.success) {
        setSuccess(
          'Registration successful! Redirecting to login...'
        );

        // Clear form after successful registration
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          flat_no: '',
          phone: '',
        });

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(
          response.data.message ||
            'Registration failed.'
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (
    authLoading ||
    checkingManager
  ) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>

        <CardDescription className="text-center">
          Register as a resident of Asim Wadhwa
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-700">
              <AlertDescription>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* NAME */}
          <div className="space-y-2">
            <Label htmlFor="register-name">
              Full Name
            </Label>

            <Input
              id="register-name"
              name="register-name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) =>
                handleChange(
                  'name',
                  e.target.value
                )
              }
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              maxLength={50}
            />
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="register-email">
              Email
            </Label>

            <Input
              id="register-email"
              name="register-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                handleChange(
                  'email',
                  e.target.value
                )
              }
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* FLAT + PHONE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* FLAT */}
            <div className="space-y-2">
              <Label htmlFor="flat_no">
                Flat Number
              </Label>

              <Select
                value={formData.flat_no}
                onValueChange={(value) =>
                  handleChange(
                    'flat_no',
                    value
                  )
                }
                disabled={loading}
              >
                <SelectTrigger id="flat_no">
                  <SelectValue placeholder="Select flat" />
                </SelectTrigger>

                <SelectContent>
                  {FLAT_NUMBERS.map(
                    (flat) => (
                      <SelectItem
                        key={flat}
                        value={flat}
                      >
                        {flat}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* PHONE */}
            <div className="space-y-2">
              <Label htmlFor="register-phone">
                Phone Number
              </Label>

              <Input
                id="register-phone"
                name="register-phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) =>
                  handleChange(
                    'phone',
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10)
                  )
                }
                disabled={loading}
                autoComplete="off"
                maxLength={10}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-2">
            <Label htmlFor="register-password">
              Password
            </Label>

            <Input
              id="register-password"
              name="register-password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) =>
                handleChange(
                  'password',
                  e.target.value
                )
              }
              disabled={loading}
              autoComplete="new-password"
              maxLength={64}
            />

            <p className="text-xs text-gray-500">
              Min 8 characters with uppercase,
              lowercase, number and special character.
            </p>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">
              Confirm Password
            </Label>

            <Input
              id="register-confirm-password"
              name="register-confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleChange(
                  'confirmPassword',
                  e.target.value
                )
              }
              disabled={loading}
              autoComplete="new-password"
              maxLength={64}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? 'Creating Account...'
              : 'Create Account'}
          </Button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}