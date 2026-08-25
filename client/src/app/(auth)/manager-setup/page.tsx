'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FLAT_NUMBERS } from '@/lib/constants';
import api from '@/lib/api';

export default function ManagerSetupPage() {
  const router = useRouter();
  const { managerSetup, isAuthenticated, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    flat_no: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [managerExists, setManagerExists] = useState<boolean | null>(null);

  // Check if manager already exists
  useEffect(() => {
    const checkManager = async () => {
      try {
        const response = await api.get('/auth/manager-exists');
        const exists = response.data.data?.exists;
        setManagerExists(exists);
        if (exists) {
          // Manager already exists, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Error checking manager:', err);
        setManagerExists(false);
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    const { name, email, password, confirmPassword, flat_no, phone } = formData;
    
    if (!name || !email || !password || !confirmPassword || !flat_no || !phone) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    
    try {
      const result = await managerSetup({
        name,
        email,
        password,
        flat_no,
        phone,
      });
      
      if (result.success) {
        router.push('/');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking status
  if (authLoading || managerExists === null) {
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

  // If manager exists, show message (will redirect)
  if (managerExists) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">Manager already registered. Redirecting to login...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Manager Setup</CardTitle>
        <CardDescription className="text-center">
          Set up the first manager account for Asim Wadhwa
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Alert className="border-blue-500 bg-blue-50 text-blue-700">
            <AlertDescription>
              👋 Welcome! As the first user, you will be registered as the Manager with full administrative access.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flat_no">Flat Number</Label>
              <Select 
                value={formData.flat_no} 
                onValueChange={(value) => handleChange('flat_no', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flat" />
                </SelectTrigger>
                <SelectContent>
                  {FLAT_NUMBERS.map((flat) => (
                    <SelectItem key={flat} value={flat}>
                      {flat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
          
          <p className="text-sm text-center text-gray-600">
            Already have a manager account?{' '}
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
