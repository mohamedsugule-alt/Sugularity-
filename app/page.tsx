'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Target, BadgeDollarSign, Briefcase,
    Repeat, LineChart, ArrowRight,
    Sparkles, Brain, CheckCircle2,
    ChevronRight, Menu, X, Zap, Shield, Clock,
    BookOpen, Calendar, ListTodo, Inbox
} from 'lucide-react';

/* ============================================
   DATA
   ============================================ */
const features = [
    {
        icon: LayoutDashboard,
        title: 'Smart Dashboard',
        description: 'AI-powered daily briefings with a bird\'s eye view of your entire life system.',
        gradient: 'from-violet-500 to-purple-500',
        bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    },
    {
        icon: Target,
        title: 'Goal Tracking',
        description: 'Set meaningful goals, break them into milestones, and track progress visually.',
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    {
        icon: BadgeDollarSign,
        title: 'Finance Manager',
        description: 'Budget tracking, expense categories, bank accounts, and financial goal planning.',
        gradient: 'from-green-500 to-emerald-500',
        bg: 'bg-green-500/10 dark:bg-green-500/20',
    },
    {
        icon: Briefcase,
        title: 'Job Tracker',
        description: 'Manage applications, interviews, contacts, and your entire career pipeline.',
        gradient: 'from-blue-500 to-indigo-500',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
        icon: Repeat,
        title: 'Daily Rituals',
        description: 'Build lasting habits with streak tracking, ritual templates, and daily routines.',
        gradient: 'from-cyan-500 to-blue-500',
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    },
    {
        icon: LineChart,
        title: 'Life Insights',
        description: 'Weekly reviews, analytics dashboards, and data-driven personal growth metrics.',
        gradient: 'from-rose-500 to-pink-500',
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    },
];

const stats = [
    { value: '15+', label: 'Integrated Modules', icon: Zap },
    { value: 'AI', label: 'Powered Insights', icon: Brain },
    { value: '100%', label: 'Free & Open', icon: Shield },
    { value: '24/7', label: 'Cloud Access', icon: Clock },
];

const steps = [
    {
        step: '01',
        title: 'Sign Up in Seconds',
        description: 'Create your free account and set up your personal workspace in under a minute.',
    },
    {
        step: '02',
        title: 'Customize Your System',
        description: 'Choose which modules matter to you — goals, finance, career, rituals, and more.',
    },
    {
        step: '03',
        title: 'Live Your Best Life',
        description: 'Let Sugularity organize, track, and optimize every area of your life automatically.',
    },
];

/* ============================================
   COMPONENT
   ============================================ */
export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            setScrolled(target.scrollTop > 20);
        };
        const container = document.getElementById('landing-scroll');
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div id="landing-scroll" className="h-screen overflow-y-auto overflow-x-hidden scroll-smooth" style={{ background: 'linear-gradient(180deg, #fafafa 0%, #f5f0ff 50%, #fafafa 100%)' }}>

            {/* ==========================================
                NAVBAR
               ========================================== */}
            <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
                ? 'bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl shadow-lg shadow-gray-200/20 dark:shadow-black/10 border-b border-gray-200/50 dark:border-gray-800/50'
                : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-all">
                                <div className="w-full h-full rounded-[10px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    <Image src="/logo.png" alt="Sugularity" fill className="object-contain p-0.5" priority />
                                </div>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Sugularity</span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-8">
                            {[
                                { label: 'Features', href: '#features' },
                                { label: 'How it Works', href: '#how-it-works' },
                                { label: 'Preview', href: '#preview' },
                            ].map((link) => (
                                <a key={link.label} href={link.href} className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        {/* Desktop CTAs */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors px-4 py-2.5 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80">
                                Sign In
                            </Link>
                            <Link href="/sign-up" className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-6 py-2.5 rounded-full shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                Get Started Free
                            </Link>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-t border-gray-200/50 dark:border-gray-800/50 animate-in slide-in-from-top-2">
                        <div className="px-4 py-4 space-y-1">
                            {[
                                { label: 'Features', href: '#features' },
                                { label: 'How it Works', href: '#how-it-works' },
                                { label: 'Preview', href: '#preview' },
                            ].map((link) => (
                                <a key={link.label} href={link.href} className="block text-sm font-medium text-gray-600 dark:text-gray-400 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setMobileMenuOpen(false)}>
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
                                <Link href="/sign-in" className="text-sm font-medium text-gray-600 dark:text-gray-400 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-center">Sign In</Link>
                                <Link href="/sign-up" className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 rounded-full text-center shadow-lg shadow-violet-500/20">Get Started Free</Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* ==========================================
                HERO SECTION
               ========================================== */}
            <section className="relative pt-12 pb-8 lg:pt-24 lg:pb-16 overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-b from-violet-300/30 via-purple-200/20 to-transparent dark:from-violet-800/15 dark:via-purple-900/10 rounded-full blur-3xl" />
                    <div className="absolute top-40 -left-20 w-80 h-80 bg-blue-200/25 dark:bg-blue-900/10 rounded-full blur-3xl landing-float" />
                    <div className="absolute top-10 -right-20 w-96 h-96 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl landing-float-delayed" />
                    <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-200/15 dark:bg-pink-900/5 rounded-full blur-3xl landing-float" style={{ animationDelay: '3s' }} />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-5xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200/80 dark:border-violet-800/50 mb-8 landing-fade-up">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Your Personal Life Operating System</span>
                        </div>

                        {/* Giant Heading */}
                        <h1 className="landing-fade-up" style={{ animationDelay: '0.1s' }}>
                            <span className="block text-5xl sm:text-7xl lg:text-[6.5rem] font-black tracking-tighter text-gray-900 dark:text-white leading-[0.85]">
                                ORGANIZE
                            </span>
                            <span className="block text-5xl sm:text-7xl lg:text-[6.5rem] font-black tracking-tighter leading-[0.85] mt-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500">
                                YOUR ENTIRE
                            </span>
                            <span className="block text-5xl sm:text-7xl lg:text-[6.5rem] font-black tracking-tighter text-gray-900 dark:text-white leading-[0.85] mt-2">
                                LIFE
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="mt-8 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed landing-fade-up" style={{ animationDelay: '0.2s' }}>
                            A hands-on operating system for your goals, finances, career, and daily rituals.
                            All in one beautiful, intelligent platform.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 landing-fade-up" style={{ animationDelay: '0.3s' }}>
                            <Link href="/sign-up" className="group flex items-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-8 py-4 rounded-full shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-1 active:translate-y-0">
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features" className="group flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-8 py-4 rounded-full border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all hover:-translate-y-0.5">
                                Learn More
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        </div>
                    </div>

                    {/* Dashboard Preview with Floating Cards */}
                    <div className="mt-16 lg:mt-24 relative landing-fade-up" style={{ animationDelay: '0.5s' }}>
                        {/* Floating Card - Left */}
                        <div className="absolute -left-2 top-12 sm:left-4 lg:left-0 z-20 landing-float hidden md:block">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-violet-500/10 p-4 border border-gray-100 dark:border-gray-800 w-56 backdrop-blur-xl">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Goal Achieved</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Morning Routine</p>
                                <p className="text-xs text-gray-400 mt-0.5">7-day streak maintained</p>
                                <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[85%] bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Floating Card - Right */}
                        <div className="absolute -right-2 top-20 sm:right-4 lg:right-0 z-20 landing-float-delayed hidden md:block">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-purple-500/10 p-4 border border-gray-100 dark:border-gray-800 w-52 backdrop-blur-xl">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                        <Brain className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400">AI Insight</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Peak Focus Time</p>
                                <p className="text-xs text-gray-400 mt-0.5">9:00 - 11:30 AM today</p>
                            </div>
                        </div>

                        {/* Floating Card - Bottom Left */}
                        <div className="absolute left-8 -bottom-6 lg:left-16 lg:-bottom-8 z-20 landing-float hidden lg:block" style={{ animationDelay: '1.5s' }}>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-blue-500/10 p-4 border border-gray-100 dark:border-gray-800 w-48 backdrop-blur-xl">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <BadgeDollarSign className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Finance</span>
                                </div>
                                <p className="text-xs text-gray-400">Saved this month</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">$1,247</p>
                            </div>
                        </div>

                        {/* Dashboard Preview Mockup */}
                        <div className="mx-auto max-w-5xl">
                            <div className="relative bg-white dark:bg-gray-900 rounded-2xl lg:rounded-3xl shadow-[0_20px_70px_-15px_rgba(139,92,246,0.15)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.4)] border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                                {/* Window Chrome */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                                        <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div className="px-4 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-400 font-mono">sugularity.vercel.app/dashboard</div>
                                    </div>
                                </div>

                                {/* Mock Dashboard */}
                                <div className="flex min-h-[320px] lg:min-h-[420px]">
                                    {/* Mock Sidebar */}
                                    <div className="hidden sm:flex w-44 lg:w-48 border-r border-gray-100 dark:border-gray-800 flex-col p-3 bg-gray-50/30 dark:bg-gray-900/50 flex-shrink-0">
                                        <div className="flex items-center gap-2 mb-5 px-2 pt-1">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0" />
                                            <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">Sugularity</span>
                                        </div>
                                        {[
                                            { name: 'Dashboard', active: true },
                                            { name: 'Today' },
                                            { name: 'Calendar' },
                                            { name: 'Inbox' },
                                            { name: 'Tasks' },
                                            { name: 'Goals' },
                                            { name: 'Projects' },
                                            { name: 'Rituals' },
                                            { name: 'Finance' },
                                            { name: 'Job Tracker' },
                                        ].map((item) => (
                                            <div key={item.name} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs mb-0.5 transition-colors ${item.active
                                                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}>
                                                <div className={`w-3.5 h-3.5 rounded ${item.active ? 'bg-violet-500/30' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                                {item.name}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mock Main Content */}
                                    <div className="flex-1 p-4 lg:p-6 overflow-hidden">
                                        <div className="flex items-center justify-between mb-5">
                                            <div>
                                                <div className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">Good Morning!</div>
                                                <div className="text-xs text-gray-400">Wednesday, March 12</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20" />
                                        </div>

                                        {/* Mock Stat Cards */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3 mb-4">
                                            {[
                                                { label: 'Tasks', value: '8', sub: '3 urgent', gradient: 'from-violet-500 to-purple-500' },
                                                { label: 'Goals', value: '65%', sub: 'on track', gradient: 'from-emerald-500 to-teal-500' },
                                                { label: 'Streak', value: '14', sub: 'days', gradient: 'from-amber-500 to-orange-500' },
                                                { label: 'Focus', value: '4.2h', sub: 'today', gradient: 'from-blue-500 to-indigo-500' },
                                            ].map((card) => (
                                                <div key={card.label} className="bg-gray-50/80 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{card.label}</div>
                                                    <div className={`text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${card.gradient}`}>{card.value}</div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">{card.sub}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mock Plan */}
                                        <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-xl p-3 lg:p-4 border border-gray-100 dark:border-gray-700/50">
                                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Today&apos;s Plan</div>
                                            {[
                                                { text: 'Morning meditation', done: true },
                                                { text: 'Team standup @ 9:30 AM', done: true },
                                                { text: 'Deep work block', done: false },
                                                { text: 'Review weekly finances', done: false },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-2.5 py-2 text-xs border-b border-gray-100 dark:border-gray-700/30 last:border-0">
                                                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${item.done
                                                        ? 'border-emerald-400 bg-emerald-400'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                        }`}>
                                                        {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className={item.done ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}>{item.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================
                STATS BAR
               ========================================== */}
            <section className="py-12 lg:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center group">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 mb-3 group-hover:scale-110 transition-transform">
                                    <stat.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
                FEATURES SECTION
               ========================================== */}
            <section id="features" className="py-20 lg:py-28 relative">
                {/* Section Background */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-violet-50/50 to-transparent dark:via-violet-950/10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200/80 dark:border-violet-800/50 mb-6">
                            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Everything You Need</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                            One Platform,
                            <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-500">Every Dimension of Life</span>
                        </h2>
                        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                            From daily tasks to long-term goals, finances to career — everything managed in one place.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800/50 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>

                                {/* Subtle gradient border on hover */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
                HOW IT WORKS
               ========================================== */}
            <section id="how-it-works" className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200/80 dark:border-violet-800/50 mb-6">
                            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Simple Process</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                            Start in{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-500">Three Steps</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={step.step} className="relative text-center">
                                {/* Step Number */}
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-black mb-6 shadow-xl shadow-violet-500/20">
                                    {step.step}
                                </div>
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-violet-300 to-purple-300 dark:from-violet-800 dark:to-purple-800" />
                                )}
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
                MODULES PREVIEW
               ========================================== */}
            <section id="preview" className="py-20 lg:py-28 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-violet-50/50 to-transparent dark:via-violet-950/10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200/80 dark:border-violet-800/50 mb-6">
                            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">All Modules</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                            Everything Built In,
                            <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-500">Nothing Left Out</span>
                        </h2>
                    </div>

                    {/* Module Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { icon: LayoutDashboard, name: 'Dashboard', color: 'from-violet-500 to-purple-500' },
                            { icon: Calendar, name: 'Calendar', color: 'from-purple-500 to-indigo-500' },
                            { icon: ListTodo, name: 'Task Board', color: 'from-pink-500 to-rose-500' },
                            { icon: Target, name: 'Goals', color: 'from-emerald-500 to-teal-500' },
                            { icon: Repeat, name: 'Rituals', color: 'from-cyan-500 to-blue-500' },
                            { icon: Briefcase, name: 'Job Tracker', color: 'from-blue-500 to-indigo-500' },
                            { icon: BadgeDollarSign, name: 'Finance', color: 'from-green-500 to-emerald-500' },
                            { icon: LineChart, name: 'Insights', color: 'from-rose-500 to-pink-500' },
                            { icon: BookOpen, name: 'Library', color: 'from-indigo-500 to-violet-500' },
                            { icon: Inbox, name: 'Inbox', color: 'from-amber-500 to-orange-500' },
                        ].map((module) => (
                            <div key={module.name} className="group relative bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800/50 text-center shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 hover:-translate-y-1 cursor-default">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <module.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{module.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
                FINAL CTA
               ========================================== */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl px-8 py-16 lg:px-16 lg:py-24 text-center">
                        {/* Background Elements */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
                            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl" />
                            <div className="absolute inset-0 opacity-[0.02]" style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }} />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                                Ready to Organize
                                <br />
                                Your Life?
                            </h2>
                            <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
                                Join Sugularity today and transform how you manage your goals, finances, career, and daily routines.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/sign-up" className="group flex items-center gap-2 text-base font-semibold text-violet-600 bg-white hover:bg-gray-50 px-8 py-4 rounded-full shadow-xl shadow-black/10 transition-all hover:-translate-y-1 active:translate-y-0">
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/sign-in" className="text-base font-medium text-white/80 hover:text-white px-8 py-4 rounded-full border border-white/20 hover:border-white/40 transition-all">
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================
                FOOTER
               ========================================== */}
            <footer className="py-12 border-t border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 shadow-lg shadow-violet-500/20">
                                <div className="w-full h-full rounded-[6px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    <Image src="/logo.png" alt="Sugularity" fill className="object-contain p-0.5" priority />
                                </div>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Sugularity</span>
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
                            <a href="#how-it-works" className="hover:text-gray-900 dark:hover:text-white transition-colors">How it Works</a>
                            <Link href="/sign-in" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
                            <Link href="/sign-up" className="hover:text-gray-900 dark:hover:text-white transition-colors">Get Started</Link>
                        </div>

                        {/* Copyright */}
                        <p className="text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} Sugularity. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
