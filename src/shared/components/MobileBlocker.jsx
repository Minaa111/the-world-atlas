import { Monitor, Smartphone, Ban, Code, User, Briefcase } from "lucide-react";

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
          
          <div className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">
            Minimum width: 1024px
          </div>
          
          <div className="w-full pt-6 border-t border-slate-800/50">
            <p className="text-sm text-slate-400 mb-4">
              In the meantime, feel free to explore the project's source code:
            </p>
            <div className="flex flex-col space-y-3">
              <a 
                href="https://github.com/Minaa111" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
              >
                <User className="w-4 h-4" />
                <span>Visit My GitHub Profile</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/minaa-aziz/" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors duration-200"
              >
                <Briefcase className="w-4 h-4" />
                <span>Connect on LinkedIn</span>
              </a>
              <a 
                href="https://github.com/Minaa111/the-world-atlas" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-200 shadow-lg shadow-indigo-900/20"
              >
                <Code className="w-4 h-4" />
                <span>Explore the Repository</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
