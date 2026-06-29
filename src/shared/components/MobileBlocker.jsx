import { Monitor, Smartphone, Ban } from "lucide-react";

export default function MobileBlocker() {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <Smartphone className="w-12 h-12 text-slate-500" />
              <Ban className="w-8 h-8 text-red-500/80 absolute -bottom-1 -right-1" />
            </div>
            <div className="h-12 w-px bg-slate-800"></div>
            <Monitor className="w-12 h-12 text-indigo-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Desktop Experience Only
          </h2>
          
          <p className="text-slate-400 leading-relaxed mb-8">
            The World Atlas contains complex macroeconomic visualizations and heavy AI forecasting models that require a larger screen. 
            <br className="my-2"/>
            Please access this platform on a desktop or laptop computer for the best experience.
          </p>
          
          <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Minimum width: 1024px
          </div>
        </div>
      </div>
    </div>
  );
}
