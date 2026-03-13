'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
    CheckCircle2,
    ArrowRight,
    Target,
    DollarSign,
    Calendar,
    ListTodo,
    Sparkles,
    BarChart3,
    Shield,
    Zap,
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
};

const features = [
    {
        icon: ListTodo,
        title: 'Smart Task Management',
        description: 'Organize tasks with priorities, pillars, and intelligent scheduling that adapts to your workflow.',
    },
    {
        icon: DollarSign,
        title: 'Financial Tracking',
        description: 'Monitor income, expenses, and budgets with real-time insights and visual analytics.',
    },
    {
        icon: Target,
        title: 'Goal & Pillar System',
        description: 'Align every action with your life pillars. Track progress toward meaningful goals.',
    },
    {
        icon: Calendar,
        title: 'Calendar & Rituals',
        description: 'Build consistent habits with ritual tracking and integrated calendar management.',
    },
    {
        icon: BarChart3,
        title: 'Insights & Analytics',
        description: 'Data-driven dashboards that reveal patterns and help you optimize your daily life.',
    },
    {
        icon: Shield,
        title: 'Private & Local-First',
        description: 'Your data stays on your device. No cloud dependency, complete privacy by design.',
    },
];

export function LandingPage() {
    return (
        <div className="h-screen overflow-y-auto bg-gradient-to-b from-background via-background to-muted/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Sugularity</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                        >
                            Open App
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left: Text Content */}
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={stagger}
                            className="max-w-xl"
                        >
                            <motion.div
                                variants={fadeUp}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
                            >
                                <Zap className="w-4 h-4" />
                                Your Local Life Operating System
                            </motion.div>

                            <motion.h1
                                variants={fadeUp}
                                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
                            >
                                Master Your Life{' '}
                                <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                                    With Clarity
                                </span>
                            </motion.h1>

                            <motion.p
                                variants={fadeUp}
                                className="text-lg text-muted-foreground leading-relaxed mb-8"
                            >
                                Sugularity brings your tasks, finances, goals, and habits into one
                                beautiful dashboard. Stay organized, track progress, and build the
                                life you envision — all privately on your device.
                            </motion.p>

                            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5"
                                >
                                    Get Started
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <a
                                    href="#features"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-border bg-card/50 font-medium text-base hover:bg-card transition-all hover:-translate-y-0.5"
                                >
                                    See Features
                                </a>
                            </motion.div>

                            {/* Trust indicators */}
                            <motion.div variants={fadeUp} className="flex items-center gap-6 mt-10">
                                {['Private & Secure', 'Offline-First', 'Free Forever'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        {item}
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* Right: Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, x: 40, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="relative"
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-black/5">
                                {/* Main hero image */}
                                <Image
                                    src="/images/hero-professionals.png"
                                    alt="Somali professionals collaborating with modern technology in a futuristic office setting"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto object-cover"
                                    priority
                                />
                                {/* Gradient overlay at bottom */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                            </div>

                            {/* Floating stat cards */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="absolute -bottom-6 -left-6 px-5 py-4 rounded-xl bg-card/95 backdrop-blur-xl shadow-xl ring-1 ring-border/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Productivity</p>
                                        <p className="text-lg font-bold">+42%</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="absolute -top-4 -right-4 px-5 py-4 rounded-xl bg-card/95 backdrop-blur-xl shadow-xl ring-1 ring-border/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Goals Hit</p>
                                        <p className="text-lg font-bold">12/15</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={stagger}
                        className="text-center mb-16"
                    >
                        <motion.h2
                            variants={fadeUp}
                            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
                        >
                            Everything You Need,{' '}
                            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                                Nothing You Don&apos;t
                            </span>
                        </motion.h2>
                        <motion.p
                            variants={fadeUp}
                            className="text-lg text-muted-foreground max-w-2xl mx-auto"
                        >
                            One app to manage your entire life — tasks, money, goals, and habits —
                            beautifully designed and completely private.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={stagger}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {features.map((feature) => (
                            <motion.div
                                key={feature.title}
                                variants={fadeUp}
                                whileHover={{ y: -4 }}
                                className="group p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Social Proof / Showcase Section */}
            <section className="py-24 px-6 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={stagger}
                        className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
                    >
                        {/* Left: Second image */}
                        <motion.div variants={fadeUp} className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-black/5">
                                <Image
                                    src="/images/hero-collaboration.png"
                                    alt="Somali professionals collaborating with holographic technology dashboard in a modern office"
                                    width={1024}
                                    height={1024}
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                            </div>
                        </motion.div>

                        {/* Right: Text */}
                        <motion.div variants={stagger} className="max-w-lg">
                            <motion.h2
                                variants={fadeUp}
                                className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
                            >
                                Built for{' '}
                                <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                                    Professionals
                                </span>{' '}
                                Who Move Fast
                            </motion.h2>
                            <motion.p
                                variants={fadeUp}
                                className="text-lg text-muted-foreground leading-relaxed mb-8"
                            >
                                Whether you're managing a business, tracking personal finances, or
                                building daily habits — Sugularity gives you a command center for
                                your life that just works.
                            </motion.p>
                            <motion.div variants={stagger} className="space-y-4">
                                {[
                                    'Track tasks, projects, and deadlines in one place',
                                    'Monitor your finances with smart categorization',
                                    'Build streaks and maintain daily rituals',
                                    'Set goals aligned with your life pillars',
                                ].map((item) => (
                                    <motion.div
                                        key={item}
                                        variants={fadeUp}
                                        className="flex items-start gap-3"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                        <span className="text-foreground">{item}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        <motion.h2
                            variants={fadeUp}
                            className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
                        >
                            Ready to Take Control?
                        </motion.h2>
                        <motion.p
                            variants={fadeUp}
                            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
                        >
                            Start organizing your life today. No account needed, no data
                            collected — just you and your goals.
                        </motion.p>
                        <motion.div variants={fadeUp}>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5"
                            >
                                Launch Sugularity
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border/50">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <span>Sugularity</span>
                    </div>
                    <span>Your Life. Your Data. Your Way.</span>
                </div>
            </footer>
        </div>
    );
}
