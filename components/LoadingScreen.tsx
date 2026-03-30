import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate a smooth loading progress bar
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return 95; // Hold at 95% until the actual data finishes loading
                }
                // Random increment between 5 and 15
                return prev + Math.floor(Math.random() * 10) + 5;
            });
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-brand-primary flex flex-col items-center justify-center z-[9999] overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
                <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-brand-secondary blur-3xl"></div>
                <div className="absolute -bottom-48 left-1/4 w-80 h-80 rounded-full bg-white blur-3xl"></div>
            </div>

            <div className="relative z-10 text-center flex flex-col items-center">
                {/* Logo Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-pulse relative p-2">
                        <div className="absolute inset-0 rounded-full border-4 border-brand-secondary opacity-50 animate-ping"></div>
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Seal_of_the_Municipality_of_Maasim.png/720px-Seal_of_the_Municipality_of_Maasim.png"
                            onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src.includes('wikimedia')) {
                                    target.src = "/CLS-Maasim-Ver1/maasim-logo.png";
                                } else if (target.src.includes('CLS-Maasim-Ver1')) {
                                    target.src = "maasim-logo.png";
                                } else {
                                    target.onerror = null;
                                }
                            }}
                            alt="Municipality of Maasim Seal" 
                            className="w-full h-full object-contain relative z-10"
                        />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-6xl font-extrabold text-white mb-3 tracking-widest drop-shadow-lg">
                    CLTS
                </h1>
                
                {/* Subtitle */}
                <p className="text-brand-light text-xl font-medium mb-16 opacity-90 tracking-wide max-w-md px-4 leading-relaxed">
                    Computerized Legislative Tracking System
                </p>

                {/* Progress Bar Container */}
                <div className="w-72 max-w-xs mx-auto">
                    <div className="h-2.5 w-full bg-brand-dark/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm border border-white/10">
                        <div 
                            className="h-full bg-brand-secondary transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-brand-light text-xs font-semibold uppercase tracking-widest opacity-80 animate-pulse">
                            Loading System Data...
                        </p>
                        <p className="text-brand-light text-xs font-bold opacity-90">
                            {progress}%
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-8 text-center w-full opacity-60">
                <p className="text-white text-xs tracking-wider">
                    Powered by Modern Legislative Tech
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;
