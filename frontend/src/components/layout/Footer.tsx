import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a1a]/80 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-400">
              RePublish
            </span>
          </div>

          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} RePublish. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
