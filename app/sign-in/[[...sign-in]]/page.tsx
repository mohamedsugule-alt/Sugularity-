import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm p-0.5 shadow-lg">
                            <div className="w-full h-full rounded-[10px] bg-white/10 flex items-center justify-center overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="Sugularity"
                                    fill
                                    className="object-contain p-1"
                                    priority
                                />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Sugularity</h2>
                            <p className="text-sm text-white/60">Cloud LifeOS</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold leading-tight">
                                Your Life,<br />
                                <span className="text-white/80">Intelligently Organized.</span>
                            </h1>
                            <p className="mt-4 text-lg text-white/70 max-w-md">
                                A hands-on operating system for your goals, finances, career, and daily rituals.
                            </p>
                        </div>

                        {/* Feature highlights */}
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            {[
                                { title: 'Smart Dashboard', desc: 'AI-powered insights' },
                                { title: 'Finance Tracker', desc: 'Budget & expenses' },
                                { title: 'Job Tracker', desc: 'Career management' },
                                { title: 'Goal System', desc: 'Track milestones' },
                            ].map((feature) => (
                                <div key={feature.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <h3 className="text-sm font-semibold">{feature.title}</h3>
                                    <p className="text-xs text-white/60 mt-1">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-sm text-white/40">
                        Built for clarity, designed for growth.
                    </p>
                </div>
            </div>

            {/* Right Panel - Sign In */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950/20 relative">
                {/* Subtle gradient orbs for mobile/right panel */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

                {/* Mobile logo - shown only on small screens */}
                <div className="lg:hidden mb-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 shadow-lg shadow-violet-500/20">
                            <div className="w-full h-full rounded-[10px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="Sugularity"
                                    fill
                                    className="object-contain p-1"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600">
                        Sugularity
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Your Cloud LifeOS</p>
                </div>

                {/* Sign in form area */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="hidden lg:block mb-8 text-center">
                        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                        <p className="text-muted-foreground mt-2">Sign in to your LifeOS</p>
                    </div>
                    <div className="flex justify-center">
                        <SignIn />
                    </div>
                </div>
            </div>
        </div>
    );
}
