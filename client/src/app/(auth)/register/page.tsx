
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Loader2,
  UserPlus,
  ArrowLeft,
  Building2,
  CheckCircle2
} from 'lucide-react';

import { FLAT_NUMBERS } from '@/lib/constants';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const {
    user,
    isAuthenticated,
    loading: authLoading
  } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    flat_no: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [availableFlats, setAvailableFlats] = useState<string[]>([]);
  const [flatsLoading, setFlatsLoading] = useState(false);
  const [flatError, setFlatError] = useState('');

  const societyCode = user?.society?.society_code;

  // ALL VALID FLATS
  // 010 jaise numbers automatically remove honge.
  const allFlats = Array.from(
    new Set(
      FLAT_NUMBERS
        .map(flat => String(flat).trim())
        .filter(flat => /^[1-9]\d{2}$/.test(flat))
    )
  ).sort();

  const availableSet = new Set(availableFlats);

  const bookedFlats = allFlats.filter(
    flat => !availableSet.has(flat)
  );

  // AUTHENTICATION CHECK
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user?.role !== 'manager') {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // FETCH AVAILABLE FLATS
  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      user?.role !== 'manager'
    ) {
      return;
    }

    if (!societyCode) {
      setFlatError('Society code is missing from your account.');
      setAvailableFlats([]);
      return;
    }

    let cancelled = false;

    const fetchAvailableFlats = async () => {
      setFlatsLoading(true);
      setFlatError('');

      try {
        const response = await api.get('/users/flats/available', {
          params: {
            society_code: societyCode
          }
        });

        if (cancelled) return;

        if (response.data?.success) {
          const data = response.data.data;

          const flats = Array.isArray(data)
            ? data
            : data?.flats || data?.availableFlats || [];

          const normalizedFlats = Array.from(
            new Set(
              flats
                .map((flat: any) =>
                  typeof flat === 'string'
                    ? flat.trim()
                    : String(flat?.flat_no || '').trim()
                )
                .filter((flat: string) =>
                  /^[1-9]\d{2}$/.test(flat)
                )
            )
          );

          setAvailableFlats(normalizedFlats);

          if (normalizedFlats.length === 0) {
            setFlatError('No available flats found.');
          }
        } else {
          setAvailableFlats([]);
          setFlatError(
            response.data?.message ||
            'Unable to load available flats.'
          );
        }
      } catch (err: any) {
        if (cancelled) return;

        setAvailableFlats([]);
        setFlatError(
          err.response?.data?.message ||
          'Unable to load available flats.'
        );
      } finally {
        if (!cancelled) {
          setFlatsLoading(false);
        }
      }
    };

    fetchAvailableFlats();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user?.role, societyCode]);

  // INPUT CHANGE
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setError('');
    setSuccess('');
  };

  // REFRESH FLATS
  const refreshAvailableFlats = async () => {
    const response = await api.get('/users/flats/available', {
      params: {
        society_code: societyCode
      }
    });

    if (response.data?.success) {
      const data = response.data.data;

      const flats = Array.isArray(data)
        ? data
        : data?.flats || data?.availableFlats || [];

      const normalizedFlats = Array.from(
        new Set(
          flats
            .map((flat: any) =>
              typeof flat === 'string'
                ? flat.trim()
                : String(flat?.flat_no || '').trim()
            )
            .filter((flat: string) =>
              /^[1-9]\d{2}$/.test(flat)
            )
        )
      );

      setAvailableFlats(normalizedFlats);
    }
  };

  // FORM SUBMISSION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const flat_no = formData.flat_no;
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (
      !name ||
      !email ||
      !phone ||
      !flat_no ||
      !password ||
      !confirmPassword
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    if (name.length < 2 || name.length > 50) {
      setError('Name must be between 2 and 50 characters.');
      return;
    }

    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(name)) {
      setError('Please enter a valid name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!availableSet.has(flat_no)) {
      setError('Please select an available flat.');
      return;
    }

    if (password.length < 8 || password.length > 64) {
      setError('Password must be between 8 and 64 characters.');
      return;
    }

    if (/\s/.test(password)) {
      setError('Password must not contain spaces.');
      return;
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9\s]/.test(password)
    ) {
      setError(
        'Password must contain uppercase, lowercase, number and special character.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/users/resident', {
        name,
        email,
        phone,
        flat_no,
        password
      });

      if (response.data?.success) {
        setSuccess('Resident registered successfully!');

        setFormData({
          name: '',
          email: '',
          phone: '',
          flat_no: '',
          password: '',
          confirmPassword: ''
        });

        await refreshAvailableFlats();
      } else {
        setError(
          response.data?.message ||
          'Resident registration failed.'
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Resident registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'manager') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 px-4 py-8 sm:px-6">

      <div className="mx-auto max-w-3xl">

        {/* TOP BAR */}
        <div className="mb-6 flex items-center justify-between gap-3">

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/users')}
            className="gap-2 rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Manage Users
          </Button>

          <div className="hidden items-center gap-2 text-sm font-semibold text-slate-600 sm:flex">
            <Building2 className="h-5 w-5 text-blue-600" />
            Society Management
          </div>

        </div>

        {/* MAIN CARD */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-900/5">

          {/* HEADER */}
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-7 text-white sm:px-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
                <UserPlus className="h-7 w-7 text-white" />
              </div>

              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  Create User
                </CardTitle>

                <CardDescription className="mt-1 text-blue-100">
                  Create a new resident account for your society
                </CardDescription>
              </div>

            </div>

          </CardHeader>

          <form onSubmit={handleSubmit} autoComplete="off">

            <CardContent className="space-y-5 px-6 py-7 sm:px-8">

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-700">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* NAME */}
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>

                <Input
                  id="register-name"
                  placeholder="Enter resident's full name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  disabled={loading}
                  maxLength={50}
                  className="h-11 rounded-lg"
                />
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <Label htmlFor="register-email">Email Address</Label>

                <Input
                  id="register-email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-lg"
                />
              </div>

              {/* FLAT SELECTION */}
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="flat_no" className="font-semibold text-slate-800">
                    Select Flat Number
                  </Label>

                  <span className="text-xs font-medium text-slate-500">
                    {availableFlats.length} Available
                  </span>
                </div>

                <Select
                  value={formData.flat_no}
                  onValueChange={value => handleChange('flat_no', value)}
                  disabled={
                    loading ||
                    flatsLoading ||
                    availableFlats.length === 0
                  }
                >
                  <SelectTrigger
                    id="flat_no"
                    className="h-12 rounded-lg border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <SelectValue
                      placeholder={
                        flatsLoading
                          ? 'Loading flats...'
                          : 'Choose an available flat'
                      }
                    />
                  </SelectTrigger>

                  <SelectContent className="max-h-64">

                    {allFlats.map(flat => {
                      const isAvailable = availableSet.has(flat);

                      return (
                        <SelectItem
                          key={flat}
                          value={flat}
                          disabled={!isAvailable}
                          className={
                            isAvailable
                              ? 'cursor-pointer font-bold text-slate-900 focus:bg-green-50 focus:text-green-800'
                              : 'cursor-not-allowed font-normal text-slate-400 opacity-50'
                          }
                        >
                          <div className="flex w-full items-center justify-between gap-8">

                            <span>{flat}</span>

                            <span
                              className={
                                isAvailable
                                  ? 'text-xs font-bold text-green-700'
                                  : 'text-xs font-medium text-slate-400'
                              }
                            >
                              {isAvailable ? 'Available' : 'Booked'}
                            </span>

                          </div>
                        </SelectItem>
                      );
                    })}

                  </SelectContent>
                </Select>

                {/* STATUS LEGEND */}
                <div className="flex flex-wrap items-center gap-5 pt-1">

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Available
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="text-xs font-medium text-slate-400">
                      Booked
                    </span>
                  </div>

                </div>

                {flatsLoading && (
                  <p className="text-xs text-blue-600">
                    Loading available flats...
                  </p>
                )}

                {flatError && (
                  <p className="text-xs text-red-500">
                    {flatError}
                  </p>
                )}

              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <Label htmlFor="register-phone">Phone Number</Label>

                <Input
                  id="register-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.phone}
                  onChange={e =>
                    handleChange(
                      'phone',
                      e.target.value.replace(/\D/g, '').slice(0, 10)
                    )
                  }
                  disabled={loading}
                  maxLength={10}
                  className="h-11 rounded-lg"
                />
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>

                <Input
                  id="register-password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  maxLength={64}
                  className="h-11 rounded-lg"
                />

                <p className="text-xs text-slate-500">
                  Minimum 8 characters, uppercase, lowercase, number and special character.
                </p>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">
                  Confirm Password
                </Label>

                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleChange('confirmPassword', e.target.value)
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  maxLength={64}
                  className="h-11 rounded-lg"
                />
              </div>

            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50 px-6 py-6 sm:px-8">

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold shadow-md shadow-blue-600/20 hover:bg-blue-700"
                disabled={
                  loading ||
                  flatsLoading ||
                  availableFlats.length === 0
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Create User
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-center text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Only authorized Society Managers can create resident accounts.
              </div>

            </CardFooter>

          </form>

        </Card>

      </div>
    </div>
  );
}
