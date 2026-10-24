import Link from 'next/link';
import {
  Zap,
  Download,
  Cpu,
  Upload,
  Trash2,
  Youtube,
  ArrowRight,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroCTA from '@/components/landing/HeroCTA';

const features = [
  {
    icon: Download,
    title: 'Auto Download',
    description:
      'Paste a video URL from TikTok, Instagram, or Facebook. We handle the rest.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Cpu,
    title: 'Smart Processing',
    description:
      'FFmpeg-powered trimming and processing. Ready for YouTube Shorts in seconds.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Upload,
    title: 'YouTube Upload',
    description:
      'Automatically published to your YouTube channel with title, tags, and description.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Trash2,
    title: 'Auto Cleanup',
    description:
      'Temporary files are deleted after publishing. Zero storage waste.',
    color: 'from-emerald-500 to-teal-500',
  },
];

const stats = [
  { icon: Shield, label: 'Secure OAuth2', value: 'Encrypted' },
  { icon: Clock, label: 'Processing Time', value: '< 2 min' },
  { icon: Layers, label: 'Concurrent Jobs', value: 'Unlimited' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(99,102,241,0.15),transparent_70%)]" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-[120px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8 animate-[fadeIn_0.5s_ease-out]">
                <Zap className="w-3.5 h-3.5" />
                Video Republishing Platform
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 animate-[fadeIn_0.6s_ease-out]">
                Republish Videos to{' '}
                <span className="gradient-text">YouTube</span>{' '}
                <br className="hidden sm:block" />
                in One Click
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-[fadeIn_0.7s_ease-out]">
                Paste a video URL from TikTok, Instagram, or Facebook. We
                download, process, and upload it to your YouTube channel
                automatically.
              </p>

              {/* CTA */}
              <HeroCTA />

              {/* Platform badges */}
              <div className="flex items-center justify-center gap-6 mt-14 animate-[fadeIn_0.9s_ease-out]">
                {['TikTok', 'Instagram', 'Facebook'].map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center gap-2 text-slate-500 text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    {platform}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                </div>
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Four simple steps from video URL to published YouTube Short.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="glass-card p-6 text-center group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-medium text-slate-500 mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card p-6 text-center"
                >
                  <stat.icon className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Start{' '}
              <span className="gradient-text">Republishing</span>?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Connect your Google account and publish your first video in under
              2 minutes.
            </p>
            <HeroCTA />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
