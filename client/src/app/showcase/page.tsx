"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { 
  Building2, 
  ArrowRight, 
  Play, 
  Zap,
  Database,
  Mail,
  Shield,
  CreditCard,
  Bell,
  Users,
  BarChart3,
  Lock,
  Smartphone,
  Monitor,
  Github,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Globe,
  Settings,
  CheckCircle2,
  ArrowUpRight,
  Code2,
  Palette,
  Server,
} from "lucide-react";

// Video Demo Data
const videoDemos = [
  {
    title: "Manager Dashboard",
    description: "Complete admin control with user management, payment tracking, and asset management.",
    videoUrl: "https://ik.imagekit.io/xh3awoalr/Portfolio/Manager_Screen_Recording.mp4",
    thumbnail: "https://ik.imagekit.io/xh3awoalr/Portfolio/Manager_Thumbnail.png",
    role: "Manager",
    gradient: "from-violet-600 to-indigo-600",
    lightGradient: "from-violet-500/20 to-indigo-500/20",
    icon: <Settings className="w-6 h-6" />,
    features: ["User Management", "Payment Overview", "Complaint Resolution", "Asset Tracking"]
  },
  {
    title: "Resident Portal",
    description: "User-friendly interface for maintenance payments, complaints, and emergency alerts.",
    videoUrl: "https://ik.imagekit.io/xh3awoalr/Portfolio/Resident_Screen_Recording.mp4",
    thumbnail: "https://ik.imagekit.io/xh3awoalr/Portfolio/Resident_Thumbnail.png",
    role: "Resident",
    gradient: "from-blue-600 to-cyan-600",
    lightGradient: "from-blue-500/20 to-cyan-500/20",
    icon: <Users className="w-6 h-6" />,
    features: ["Pay Maintenance", "File Complaints", "View History", "Emergency Button"]
  },
  {
    title: "Watchman Portal",
    description: "Mobile-first portal for gate security, visitor logs, and emergency response.",
    videoUrl: "https://ik.imagekit.io/xh3awoalr/Portfolio/Watchman_Screen_Recording.mp4",
    thumbnail: "https://ik.imagekit.io/xh3awoalr/Portfolio/Watchman_Thumbanail.png",
    role: "Watchman",
    gradient: "from-amber-500 to-orange-600",
    lightGradient: "from-amber-500/20 to-orange-500/20",
    icon: <Shield className="w-6 h-6" />,
    features: ["Gate Log Entry", "Visitor Tracking", "Emergency Alerts", "Mobile Optimized"]
  }
];

// Tech Stack Data
const techStack = [
  { name: "Next.js 14", icon: <Globe className="w-5 h-5" />, category: "Frontend", color: "text-slate-900" },
  { name: "Tailwind CSS", icon: <Palette className="w-5 h-5" />, category: "Styling", color: "text-cyan-500" },
  { name: "shadcn/ui", icon: <Layers className="w-5 h-5" />, category: "Components", color: "text-slate-700" },
  { name: "Express.js", icon: <Server className="w-5 h-5" />, category: "Backend", color: "text-slate-800" },
  { name: "MongoDB", icon: <Database className="w-5 h-5" />, category: "Database", color: "text-green-600" },
  { name: "Razorpay", icon: <CreditCard className="w-5 h-5" />, category: "Payments", color: "text-blue-600" },
  { name: "Brevo", icon: <Mail className="w-5 h-5" />, category: "Email", color: "text-indigo-600" },
  { name: "ImageKit", icon: <Sparkles className="w-5 h-5" />, category: "CDN", color: "text-pink-600" },
];

// Features Data
const features = [
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Razorpay Payments",
    description: "Integrated UPI & Card payments with auto-generated invoices and ₹100 late fee after 18 days.",
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Lift Emergency Alerts",
    description: "One-click emergency button instantly notifies all residents and staff via email.",
    gradient: "from-red-500 to-rose-600"
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Role-Based Access",
    description: "4 distinct roles with tailored dashboards: Manager, Admin, Resident, Watchman.",
    gradient: "from-violet-500 to-purple-600"
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Asset Tracking",
    description: "Monitor lifts, water pumps, generators with complete service history logs.",
    gradient: "from-amber-500 to-orange-600"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure Authentication",
    description: "JWT with httpOnly cookies, OTP-based password reset via Brevo emails.",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Gate Log System",
    description: "Complete visitor management with in/out times, vehicle numbers, and purpose tracking.",
    gradient: "from-slate-600 to-slate-800"
  }
];

// Video Modal Component
function VideoModal({ 
  isOpen, 
  onClose, 
  video 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  video: typeof videoDemos[0] | null;
}) {
  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-slate-950 border-slate-800 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${video.gradient}`}>
                {video.icon}
              </div>
              <div>
                <span className="block text-lg font-semibold">{video.title}</span>
                <span className="block text-sm text-slate-400 font-normal">{video.role} Role Demo</span>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="aspect-video bg-black">
          <video 
            src={video.videoUrl} 
            controls 
            autoPlay
            className="w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Video Card Component
function VideoCard({ 
  video, 
  onPlay 
}: { 
  video: typeof videoDemos[0]; 
  onPlay: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
      
      <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl">
        {/* Video Preview Area */}
        <div 
          className="relative aspect-video cursor-pointer overflow-hidden"
          onClick={onPlay}
        >
          {/* Thumbnail Image */}
          <Image 
            src={video.thumbnail} 
            alt={`${video.title} Preview`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient} opacity-20 group-hover:opacity-10 transition-opacity duration-300`} />
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`
              relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-md 
              flex items-center justify-center
              transform transition-all duration-300
              ${isHovered ? 'scale-110' : 'scale-100'}
            `}>
              <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                <Play className="w-7 h-7 text-slate-900 fill-slate-900 ml-1" />
              </div>
            </div>
          </div>

          {/* Role Badge */}
          <Badge className={`absolute top-4 right-4 bg-white/90 text-slate-900 font-semibold border-0 px-3 py-1`}>
            {video.role}
          </Badge>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/90 text-sm font-medium">Click to watch demo</p>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${video.lightGradient}`}>
              {video.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-1">{video.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{video.description}</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {video.features.map((feature, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="bg-slate-100 text-slate-700 font-medium border-0"
              >
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Animated Background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e510_1px,transparent_1px),linear-gradient(to_bottom,#4f46e510_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    </div>
  );
}

export default function ShowcasePage() {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <AnimatedBackground />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/90 font-medium">Full-Stack Society Management System</span>
            </div>

            {/* Logo & Title */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
              Rajarshi Darshan
            </h1>
            <p className="text-xl sm:text-2xl text-indigo-200 font-medium mb-8">
              Society Management System
            </p>

            {/* Description */}
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              A complete production-ready solution featuring{' '}
              <span className="text-white font-semibold">Razorpay payments</span>,{' '}
              <span className="text-white font-semibold">real-time emergency alerts</span>,{' '}
              <span className="text-white font-semibold">role-based dashboards</span>, and{' '}
              <span className="text-white font-semibold">automated invoicing</span>.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-12">
              {[
                { value: "40+", label: "Flats" },
                { value: "4", label: "User Roles" },
                { value: "₹1000", label: "Monthly Fee" },
                { value: "100%", label: "Responsive" }
              ].map((stat, idx) => (
                <div key={idx} className="px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-indigo-200">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="h-14 px-8 text-base font-semibold bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl shadow-xl shadow-white/20 gap-2"
                asChild
              >
                <Link href="/login">
                  <Zap className="w-5 h-5" />
                  Try Live Demo
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 text-base font-semibold border-2 border-white/30 text-slate-700 hover:bg-indigo-50 rounded-2xl gap-2"
                asChild
              >
                <a href="https://github.com/AAYUSH412/Society-Management-System" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </Button>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-16 flex flex-col items-center gap-2 animate-bounce">
              <span className="text-sm text-indigo-300">Scroll to explore</span>
              <ChevronRight className="w-5 h-5 text-indigo-300 rotate-90" />
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </header>

      {/* Video Demos Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-0 px-4 py-2 text-sm font-semibold">
              <Play className="w-4 h-4 mr-2" />
              Video Demonstrations
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Watch complete walkthroughs of each dashboard and explore the features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videoDemos.map((video, index) => (
              <VideoCard 
                key={index} 
                video={video} 
                onPlay={() => setSelectedVideo(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal 
        isOpen={selectedVideo !== null}
        onClose={() => setSelectedVideo(null)}
        video={selectedVideo !== null ? videoDemos[selectedVideo] : null}
      />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-0 px-4 py-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Core Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive features for modern housing society management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-0 bg-slate-50 hover:bg-white transition-all duration-300 rounded-3xl hover:shadow-xl"
              >
                <CardContent className="p-8">
                  <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-5 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0 px-4 py-2 text-sm font-semibold">
              <Code2 className="w-4 h-4 mr-2" />
              Technology Stack
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Built With Modern Tech
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Production-ready stack following industry best practices.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {techStack.map((tech, index) => (
              <Card 
                key={index} 
                className="group border-0 bg-white hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 rounded-xl bg-slate-100 ${tech.color} mb-3 group-hover:scale-110 transition-transform`}>
                    {tech.icon}
                  </div>
                  <h3 className="font-bold text-slate-900">{tech.name}</h3>
                  <p className="text-sm text-slate-500">{tech.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/10 text-white border-0 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              <Settings className="w-4 h-4 mr-2" />
              Architecture
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Production-Ready Design
            </h2>
            <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
              Clean, maintainable code with industry-standard patterns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Monitor className="w-8 h-8" />, title: "Responsive Design", desc: "Mobile-first approach with Tailwind", color: "text-cyan-400" },
              { icon: <Zap className="w-8 h-8" />, title: "Cron Jobs", desc: "Automated invoicing & late fees", color: "text-amber-400" },
              { icon: <Shield className="w-8 h-8" />, title: "Secure APIs", desc: "JWT auth with role-based access", color: "text-emerald-400" },
              { icon: <Smartphone className="w-8 h-8" />, title: "Watchman Portal", desc: "Simplified mobile interface", color: "text-violet-400" }
            ].map((item, index) => (
              <div 
                key={index} 
                className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`mb-4 ${item.color}`}>{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-100 text-amber-700 border-0 px-4 py-2 text-sm font-semibold">
              <Users className="w-4 h-4 mr-2" />
              Access Control
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Multi-Role System
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: "Manager", gradient: "from-violet-500 to-purple-600", desc: "Super admin control", features: ["Assign roles", "View all data", "Manage assets"] },
              { role: "Admin", gradient: "from-blue-500 to-indigo-600", desc: "Operations manager", features: ["Handle complaints", "Resolve emergencies", "View payments"] },
              { role: "Resident", gradient: "from-cyan-500 to-blue-600", desc: "Society member", features: ["Pay maintenance", "File complaints", "Trigger emergency"] },
              { role: "Watchman", gradient: "from-amber-500 to-orange-600", desc: "Gate security", features: ["Log visitors", "Mark exits", "Emergency alerts"] }
            ].map((item, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-lg rounded-3xl bg-slate-50">
                <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{item.role}</h3>
                  <p className="text-sm text-slate-500 mb-4">{item.desc}</p>
                  <ul className="space-y-2">
                    {item.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-white/10 backdrop-blur-md mb-8">
            <Zap className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Explore?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Try the live demo or check out the source code on GitHub.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="h-14 px-8 text-base font-semibold bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl shadow-xl gap-2"
              asChild
            >
              <Link href="/login">
                Try Live Demo
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-14 px-8 text-base font-semibold border-2 border-white/30 text-slate-700 hover:bg-indigo-50 rounded-2xl gap-2"
              asChild
            >
              <a href="https://github.com/AAYUSH412/Society-Management-System" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5" />
                View Source
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Asim Wadhwa</p>
                <p className="text-sm text-slate-500">Society Management System</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/AAYUSH412/Society-Management-System" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a 
                href="https://aayush-vaghela.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="hidden sm:inline">Portfolio</span>
              </a>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2026 Society Management System. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                Built with
                <span className="text-red-500">♥</span>
                by
              </span>
              <a 
                href="https://aayush-vaghela.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Aayush Vaghela
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
