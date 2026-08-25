import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck, TrendingUp, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-dingley/30 selection:text-pine">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-pine p-2 rounded-xl">
              <Leaf className="w-6 h-6 text-brandy" />
            </div>
            <span className="text-xl font-extrabold text-pine tracking-tight">
              AgriContract<span className="text-dingley">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-kombu/80">
            <Link href="#features" className="hover:text-pine transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-pine transition-colors">How it Works</Link>
            <Link href="#about" className="hover:text-pine transition-colors">About MVP</Link>
          </div>
          <div>
            <Link
              href="/roles"
              className="px-5 py-2.5 bg-pine hover:bg-kombu text-brandy text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-dingley/10 blur-3xl" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-brandy/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dingley/10 text-dingley font-semibold text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dingley opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-dingley"></span>
            </span>
            SIH 2024 MVP Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-pine tracking-tight mb-8 max-w-4xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Verifiable Contract Farming, Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-dingley to-kombu">AI.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-kombu/80 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Connect buyers, farmers, and field workers on a unified platform. Use GPS check-ins, photo evidence, and AI analytics to ensure milestone transparency.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link
              href="/roles"
              className="w-full sm:w-auto px-8 py-4 bg-pine hover:bg-kombu text-brandy text-lg font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-brandy/40 text-pine hover:bg-brandy/10 text-lg font-bold rounded-2xl transition-all flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-pine mb-4">
              Intelligence at Every Milestone
            </h2>
            <p className="text-kombu/70 max-w-2xl mx-auto text-lg">
              Our platform uses advanced AI and verifiable data points to guarantee fair and transparent execution of farming contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-brandy/5 border border-brandy/30 hover:border-dingley/50 transition-colors">
              <div className="w-14 h-14 bg-dingley/20 rounded-2xl flex items-center justify-center mb-6 text-dingley">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-pine mb-3">Verifiable Evidence</h3>
              <p className="text-kombu/70 leading-relaxed">
                Field workers use GPS-verified check-ins and photo uploads to prove task completion, eliminating disputes over milestones.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-brandy/5 border border-brandy/30 hover:border-copper/50 transition-colors">
              <div className="w-14 h-14 bg-copper/20 rounded-2xl flex items-center justify-center mb-6 text-copper">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-pine mb-3">AI Crop Analysis</h3>
              <p className="text-kombu/70 leading-relaxed">
                Machine learning models analyze crop health, growth stages, and weather risks from uploaded images to predict yield and issues early.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-brandy/5 border border-brandy/30 hover:border-kombu/50 transition-colors">
              <div className="w-14 h-14 bg-kombu/10 rounded-2xl flex items-center justify-center mb-6 text-kombu">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-pine mb-3">Multi-Role Dashboards</h3>
              <p className="text-kombu/70 leading-relaxed">
                Dedicated tools for Buyers to monitor contracts, Farmers to manage workers, and Workers to execute daily field tasks seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simple Footer */}
      <footer className="bg-pine text-brandy py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
            <Leaf className="w-6 h-6" />
            <span className="text-xl font-extrabold tracking-tight">
              AgriContract<span className="text-brandy/60">AI</span>
            </span>
          </div>
          <p className="text-brandy/60 mb-6 max-w-md mx-auto">
            Building trusted digital infrastructure for agricultural contracts where real-world farm activity becomes verifiable data.
          </p>
          <p className="text-brandy/40 text-sm">
            &copy; {new Date().getFullYear()} AgriContract AI MVP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
