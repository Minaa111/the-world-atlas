import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="w-full bg-[#05050A] text-[#EBE9FC] mt-auto relative overflow-hidden border-t border-white/5">
            {/* Subtle glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                    
                    {/* Brand Column */}
                    <div className="flex flex-col gap-6 max-w-sm">
                        <Link to="/" className="flex items-center gap-3 group w-fit">
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13.4365 18.2761C14.4246 16.414 17.7182 16.414 17.7182 16.414C21.1502 16.3782 21.6138 14.2944 21.9237 13.2412C21.369 17.7226 17.8494 21.2849 13.3885 21.9046C13.0659 21.2256 12.6837 19.6945 13.4365 18.2761Z" fill="#EBE9FC"/>
                                    <path d="M5.00602 5.8339L4.59438 5.48184C4.56011 5.45252 4.52734 5.42182 4.49611 5.38985C2.94252 7.15213 2 9.466 2 12C2 17.4608 6.37707 21.8992 11.8142 21.9983C11.4608 20.9435 11.2302 19.234 12.1116 17.5732C12.9217 16.0465 14.5516 15.4456 15.5899 15.1903C16.1567 15.051 16.6778 14.9831 17.0542 14.9493C17.2442 14.9323 17.4018 14.9235 17.5156 14.919C17.5726 14.9168 17.6189 14.9156 17.6531 14.9149L17.6952 14.9143L17.7064 14.9143C19.0872 14.8991 19.6231 14.4916 19.8704 14.2132C20.1763 13.8688 20.2962 13.4605 20.4632 12.8917L20.4849 12.818C20.683 12.1447 21.3156 11.7093 21.9968 11.743C21.934 9.25352 20.9613 6.99003 19.3989 5.27266C19.3673 5.45036 19.3297 5.61557 19.2921 5.76183C19.1225 6.4234 18.8378 7.13716 18.4884 7.66739C18.1465 8.1863 17.5392 8.64995 17.1355 8.94003C16.8308 9.15893 16.5194 9.34078 16.2628 9.48867L16.1707 9.54169C15.939 9.67497 15.7548 9.78114 15.5794 9.89699C15.2234 10.1322 15.0099 10.3411 14.8652 10.6241C14.9532 10.9464 15.0157 11.3168 15.0167 11.7041C15.0191 12.6256 14.5474 13.3537 13.9836 13.8081C13.4289 14.2551 12.7112 14.5078 11.984 14.4999C9.03417 14.4677 7.30397 12.0613 7.08118 9.5816C7.0164 8.8606 6.69205 8.08373 6.23879 7.35988C5.798 6.65591 5.29975 6.10474 5.00602 5.8339Z" fill="#EBE9FC"/>
                                    <path d="M8.57516 9.44737C8.3879 7.36316 6.7806 5.42105 6.00035 4.71053L5.56934 4.34189C7.30792 2.88037 9.55132 2 12.0004 2C14.2137 2 16.2592 2.7191 17.9158 3.93642C18.1498 4.64695 17.704 6.13158 17.2359 6.84211C17.0663 7.09947 16.6818 7.41898 16.2602 7.72186C15.3097 8.40477 14.1102 8.74254 13.5004 10C13.326 10.3595 13.3335 10.7108 13.4173 11.0163C13.4776 11.2358 13.5161 11.4745 13.5167 11.708C13.5187 12.4629 12.7552 13.0082 12.0004 13C10.0361 12.9786 8.7502 11.3955 8.57516 9.44737Z" fill="#EBE9FC"/>
                                </svg>
                            </div>
                            <span className="text-2xl font-black tracking-wide text-white group-hover:text-indigo-200 transition-colors">The World Atlas</span>
                        </Link>
                        <p className="text-gray-400 leading-relaxed font-medium text-sm md:text-base">
                            Visualizing global socio-economic data to empower understanding and drive change.
                        </p>
                    </div>

                    {/* Connect Column */}
                    <div className="flex flex-col md:items-end justify-center gap-6">
                        <div className="flex items-center gap-4">
                            <a 
                                href="https://github.com/Minaa111/the-inequality-atlas" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="group flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-[#181717] hover:border-[#181717] hover:scale-110 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                aria-label="Project Repository"
                                title="Project Repository"
                            >
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            </a>
                            <a 
                                href="https://github.com/Minaa111" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="group flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-[#181717] hover:border-[#181717] hover:scale-110 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                aria-label="Developer GitHub"
                                title="Developer GitHub"
                            >
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            </a>
                            <a 
                                href="https://www.linkedin.com/in/minaa-aziz/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="group flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:scale-110 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                aria-label="Developer LinkedIn"
                                title="Developer LinkedIn"
                            >
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                        </div>
                        <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
                            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                        </div>
                    </div>
                </div>

                {/* Sub Footer */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-xs font-medium text-gray-500">
                        &copy; {new Date().getFullYear()} The World Atlas. All rights reserved.
                    </div>
                    <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                        Designed with <span className="text-indigo-500 text-base leading-none">♥</span> for a better world
                    </div>
                </div>
            </div>
        </footer>
    );
}
