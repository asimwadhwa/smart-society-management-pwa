import { SOCIETY_NAME, SOCIETY_TAGLINE } from '@/lib/constants';
import { Building2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{SOCIETY_NAME}</h1>
                <p className="text-blue-400 text-sm">{SOCIETY_TAGLINE}</p>
              </div>
            </div>

            {/* Tagline */}
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Manage your society
              <span className="text-blue-400"> effortlessly</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Pay maintenance, track complaints, and stay connected with your community - all in one place.
            </p>

            {/* Features */}
            <div className="mt-12 space-y-4">
              {[
                'Quick maintenance payments via UPI/Cards',
                'Real-time emergency alerts',
                'Track and manage complaints easily',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  </div>
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Mobile Logo */}
        <div className="lg:hidden sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-3">{SOCIETY_NAME}</h1>
          <p className="text-sm text-slate-500">{SOCIETY_TAGLINE}</p>
        </div>

        {/* Auth Card Container */}
        <div className="sm:mx-auto sm:w-full sm:max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}
