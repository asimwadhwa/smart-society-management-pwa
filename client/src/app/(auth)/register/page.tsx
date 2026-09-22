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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Building2,
  Loader2
} from 'lucide-react';

import {
  FLAT_NUMBERS
} from '@/lib/constants';

import api from '@/lib/api';


export default function RegisterPage() {

  const router = useRouter();


  const {
    isAuthenticated,
    loading: authLoading
  } = useAuth();


  // ==========================================================
  // FORM DATA
  // ==========================================================

  const [formData, setFormData] =
    useState({

      society_code: '',

      name: '',

      email: '',

      password: '',

      confirmPassword: '',

      flat_no: '',

      phone: ''

    });


  // ==========================================================
  // STATES
  // ==========================================================

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [loading, setLoading] =
    useState(false);


  // ==========================================================
  // FLAT STATES
  // ==========================================================

  const [availableFlats, setAvailableFlats] =
    useState<string[]>([]);

  const [flatsLoading, setFlatsLoading] =
    useState(false);

  const [flatError, setFlatError] =
    useState('');

  const [societyChecked, setSocietyChecked] =
    useState(false);


  // ==========================================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // ==========================================================

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


  // ==========================================================
  // GET AVAILABLE FLATS
  // ==========================================================

  useEffect(() => {

    const societyCode =
      formData.society_code
        .trim()
        .toUpperCase();


    // --------------------------------------------------------
    // Clear flats if society code is incomplete
    // --------------------------------------------------------

    if (
      societyCode.length < 3
    ) {

      setAvailableFlats([]);

      setSocietyChecked(false);

      setFlatError('');

      setFormData(prev => ({
        ...prev,
        flat_no: ''
      }));

      return;

    }


    let cancelled = false;


    const fetchAvailableFlats =
      async () => {

        setFlatsLoading(true);

        setSocietyChecked(false);

        setFlatError('');

        setAvailableFlats([]);

        setFormData(prev => ({
          ...prev,
          flat_no: ''
        }));


        try {

          const response =
            await api.get(
              '/users/flats/available',
              {
                params: {
                  society_code:
                    societyCode
                }
              }
            );


          if (cancelled) {
            return;
          }


          if (
            response.data?.success
          ) {

            setAvailableFlats(
              response.data.data || []
            );

            setSocietyChecked(true);

            if (
              (
                response.data.data || []
              ).length === 0
            ) {

              setFlatError(
                'No flats are available in this society.'
              );

            }

          } else {

            setAvailableFlats([]);

            setSocietyChecked(false);

            setFlatError(
              response.data?.message ||
              'Unable to load available flats.'
            );

          }

        } catch (err: any) {

          if (cancelled) {
            return;
          }


          setAvailableFlats([]);

          setSocietyChecked(false);

          setFormData(prev => ({
            ...prev,
            flat_no: ''
          }));


          setFlatError(
            err.response?.data?.message ||
            'Invalid society code or unable to load flats.'
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

  }, [
    formData.society_code
  ]);


  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  const handleChange = (
    field: string,
    value: string
  ) => {

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setError('');

    setSuccess('');

  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setError('');

    setSuccess('');


    const society_code =
      formData.society_code
        .trim()
        .toUpperCase();


    const name =
      formData.name.trim();


    const email =
      formData.email
        .trim()
        .toLowerCase();


    const password =
      formData.password;


    const confirmPassword =
      formData.confirmPassword;


    const flat_no =
      formData.flat_no;


    const phone =
      formData.phone.trim();


    // ========================================================
    // 1. REQUIRED
    // ========================================================

    if (
      !society_code ||
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


    // ========================================================
    // 2. SOCIETY CODE
    // ========================================================

    if (
      society_code.length < 3 ||
      society_code.length > 20
    ) {

      setError(
        'Society code must be between 3 and 20 characters.'
      );

      return;

    }


    if (
      !/^[A-Z0-9_-]+$/.test(
        society_code
      )
    ) {

      setError(
        'Society code can contain only letters, numbers, hyphen and underscore.'
      );

      return;

    }


    // ========================================================
    // 3. SOCIETY MUST BE VERIFIED
    // ========================================================

    if (
      !societyChecked
    ) {

      setError(
        'Please enter a valid active society code and wait for the flat list to load.'
      );

      return;

    }


    // ========================================================
    // 4. FLAT MUST BE AVAILABLE
    // ========================================================

    if (
      !availableFlats.includes(
        flat_no
      )
    ) {

      setError(
        'Please select an available flat.'
      );

      return;

    }


    // ========================================================
    // 5. NAME
    // ========================================================

    if (
      name.length < 2
    ) {

      setError(
        'Full name must be at least 2 characters.'
      );

      return;

    }


    if (
      name.length > 50
    ) {

      setError(
        'Full name must not exceed 50 characters.'
      );

      return;

    }


    if (
      !/^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(
        name
      )
    ) {

      setError(
        'Full name can contain only letters, spaces, dot, apostrophe and hyphen.'
      );

      return;

    }


    // ========================================================
    // 6. EMAIL
    // ========================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


    if (
      !emailRegex.test(email)
    ) {

      setError(
        'Please enter a valid email address.'
      );

      return;

    }


    // ========================================================
    // 7. PHONE
    // ========================================================

    if (
      !/^[6-9]\d{9}$/.test(
        phone
      )
    ) {

      setError(
        'Please enter a valid 10-digit Indian mobile number.'
      );

      return;

    }


    // ========================================================
    // 8. PASSWORD
    // ========================================================

    if (
      password.length < 8
    ) {

      setError(
        'Password must be at least 8 characters long.'
      );

      return;

    }


    if (
      password.length > 64
    ) {

      setError(
        'Password must not exceed 64 characters.'
      );

      return;

    }


    if (
      /\s/.test(password)
    ) {

      setError(
        'Password must not contain spaces.'
      );

      return;

    }


    if (
      !/[A-Z]/.test(password)
    ) {

      setError(
        'Password must contain at least one uppercase letter.'
      );

      return;

    }


    if (
      !/[a-z]/.test(password)
    ) {

      setError(
        'Password must contain at least one lowercase letter.'
      );

      return;

    }


    if (
      !/[0-9]/.test(password)
    ) {

      setError(
        'Password must contain at least one number.'
      );

      return;

    }


    if (
      !/[!@#$%^&*(),.?":{}|<>\-_[\]/+=;'`~]/.test(
        password
      )
    ) {

      setError(
        'Password must contain at least one special character.'
      );

      return;

    }


    // ========================================================
    // 9. CONFIRM PASSWORD
    // ========================================================

    if (
      password !==
      confirmPassword
    ) {

      setError(
        'Passwords do not match.'
      );

      return;

    }


    // ========================================================
    // SUBMIT
    // ========================================================

    setLoading(true);


    try {

      const response =
        await api.post(
          '/auth/register',
          {

            society_code,

            name,

            email,

            password,

            flat_no,

            phone

          }
        );


      if (
        response.data.success
      ) {

        setSuccess(
          'Registration successful! Redirecting to login...'
        );


        setFormData({

          society_code: '',

          name: '',

          email: '',

          password: '',

          confirmPassword: '',

          flat_no: '',

          phone: ''

        });


        setAvailableFlats([]);

        setSocietyChecked(false);

        setFlatError('');


        setTimeout(() => {

          router.push('/login');

        }, 2000);


      } else {

        setError(
          response.data.message ||
          'Registration failed.'
        );

      }

    } catch (
      err: any
    ) {

      setError(
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    authLoading
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


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <Card className="shadow-lg">

      <CardHeader className="space-y-1">

        <CardTitle className="text-2xl font-bold text-center">

          Create Account

        </CardTitle>


        <CardDescription className="text-center">

          Register as a resident of your society

        </CardDescription>

      </CardHeader>


      <form
        onSubmit={handleSubmit}
        autoComplete="off"
      >

        <CardContent className="space-y-4">


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <Alert variant="destructive">

              <AlertDescription>

                {error}

              </AlertDescription>

            </Alert>

          )}


          {/* ==================================================
              SUCCESS
          ================================================== */}

          {success && (

            <Alert className="border-green-500 bg-green-50 text-green-700">

              <AlertDescription>

                {success}

              </AlertDescription>

            </Alert>

          )}


          {/* ==================================================
              SOCIETY CODE
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="society-code">

              Society Code

            </Label>


            <div className="relative">

              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />


              <Input
                id="society-code"
                name="society-code"
                type="text"
                placeholder="Enter society code"
                value={
                  formData.society_code
                }
                onChange={(e) =>
                  handleChange(
                    'society_code',
                    e.target.value
                      .toUpperCase()
                  )
                }
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                maxLength={20}
                className="pl-10 uppercase"
              />

            </div>


            <p className="text-xs text-gray-500">

              Enter the society code provided by your society manager.

            </p>

          </div>


          {/* ==================================================
              NAME
          ================================================== */}

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


          {/* ==================================================
              EMAIL
          ================================================== */}

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


          {/* ==================================================
              FLAT + PHONE
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


            {/* ==================================================
                FLAT NUMBER
            ================================================== */}

            <div className="space-y-2">

              <Label htmlFor="flat_no">

                Flat Number

              </Label>


              <Select
                value={
                  formData.flat_no
                }
                onValueChange={(value) =>
                  handleChange(
                    'flat_no',
                    value
                  )
                }
                disabled={
                  loading ||
                  flatsLoading ||
                  !societyChecked
                }
              >


                <SelectTrigger id="flat_no">

                  <SelectValue
                    placeholder={
                      flatsLoading
                        ? 'Loading flats...'
                        : societyChecked
                          ? 'Select available flat'
                          : 'Enter valid society code first'
                    }
                  />

                </SelectTrigger>


                <SelectContent>

                  {FLAT_NUMBERS.map(
                    (flat) => {

                      const isAvailable =
                        availableFlats.includes(
                          flat
                        );


                      return (

                        <SelectItem
                          key={flat}
                          value={flat}
                          disabled={
                            !isAvailable
                          }
                          className={
                            isAvailable
                              ? 'font-bold text-gray-900'
                              : 'text-gray-300 opacity-50'
                          }
                        >

                          {flat}

                          {!isAvailable && (
                            <span className="ml-2 text-xs text-gray-300">
                              (Booked)
                            </span>
                          )}

                        </SelectItem>

                      );

                    }
                  )}

                </SelectContent>

              </Select>


              {/* ==================================================
                  FLAT STATUS
              ================================================== */}

              {flatsLoading && (

                <div className="flex items-center gap-2 text-xs text-gray-500">

                  <Loader2 className="w-3 h-3 animate-spin" />

                  Checking flat availability...

                </div>

              )}


              {!flatsLoading &&
                societyChecked &&
                !flatError && (

                  <p className="text-xs text-green-600">

                    Available flats are shown in bold.
                    Booked flats are disabled.

                  </p>

                )}


              {!flatsLoading &&
                flatError && (

                  <p className="text-xs text-red-500">

                    {flatError}

                  </p>

                )}

            </div>


            {/* ==================================================
                PHONE
            ================================================== */}

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


          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="register-password">

              Password

            </Label>


            <Input
              id="register-password"
              name="register-password"
              type="password"
              placeholder="Create a strong password"
              value={
                formData.password
              }
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


          {/* ==================================================
              CONFIRM PASSWORD
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="register-confirm-password">

              Confirm Password

            </Label>


            <Input
              id="register-confirm-password"
              name="register-confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={
                formData.confirmPassword
              }
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
            disabled={
              loading ||
              flatsLoading
            }
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