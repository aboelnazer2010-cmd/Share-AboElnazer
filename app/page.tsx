'use client';

import Link from 'next/link';
import { Shield, Zap, Users, HardDrive, ArrowRight, Globe, Play } from 'lucide-react';
import { usePeerStore } from '@/store/usePeerStore';
import { motion, type Variants } from 'motion/react';
import AdBanner from '@/components/AdBanner';
import { dict } from '@/lib/locales';

export default function LandingPage() {
  const { language, setLanguage } = usePeerStore();
  const t = dict[language];
  const isRtl = language === 'ar';

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div
      className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-amber-500/20 selection:text-amber-200 overflow-hidden relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full bg-orange-600/5 blur-[140px]" />
        <div className="absolute top-[50%] left-[50%] w-[25%] h-[25%] rounded-full bg-emerald-500/3 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(245,158,11,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="border-b border-stone-800/50 bg-stone-950/70 backdrop-blur-xl fixed top-0 w-full z-50"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl flex items-center justify-center font-bold text-stone-950 shadow-lg shadow-amber-500/20">
              <span className="font-display text-base">S</span>
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-stone-100">{t.navTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="group flex items-center gap-2 text-stone-500 hover:text-stone-200 transition-colors text-sm"
            >
              <Globe size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
            <Link
              href="/chat"
              className="group bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.97] flex items-center gap-2"
            >
              <Play size={14} />
              {t.launchApp}
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="pt-36 pb-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Hero Content */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-7">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/5 border border-amber-500/15">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">{t.heroBadge}</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.08]">
                {t.heroTitle1} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500">
                  {t.heroTitle2}
                </span> <br />
                {t.heroTitle3}
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg text-stone-500 max-w-xl leading-relaxed">
                {t.heroDesc}
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/chat"
                  className="group inline-flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-8 py-3.5 rounded-xl text-base font-bold transition-all hover:shadow-xl hover:shadow-amber-500/25 active:scale-[0.97]"
                >
                  <span>{t.startChatting}</span>
                  <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 px-8 py-3.5 rounded-xl text-base font-medium transition-all active:scale-[0.97]"
                >
                  {t.learnMore}
                </a>
              </motion.div>
            </motion.div>

            {/* Hero Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, type: 'spring' }}
              className="relative lg:h-[580px] w-full"
            >
              <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Browser bar */}
                <div className="h-12 border-b border-stone-800 bg-stone-950/60 flex items-center px-5 gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="mx-auto bg-stone-900 border border-stone-800 rounded-lg px-4 py-1 text-[11px] text-stone-600 font-mono flex items-center gap-2 hidden sm:flex">
                    <Shield size={11} className="text-emerald-500" /> share.aboelnazer.io
                  </div>
                </div>

                {/* Chat mockup */}
                <div className="p-6 pt-8 space-y-5 h-full">
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-700 to-stone-800 flex items-center justify-center font-display font-bold text-sm text-stone-300">A</div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-stone-200 text-sm">{isRtl ? 'أليس' : 'Alice'}</span>
                        <span className="text-[10px] text-stone-600 font-mono">{t.todayAt} 10:42 AM</span>
                      </div>
                      <div className="text-stone-400 text-sm mt-1 leading-relaxed bg-stone-800/50 p-3 rounded-xl rounded-tl-none border border-stone-700/30 inline-block">{t.aliceMsg}</div>
                      <div className="mt-2 bg-stone-800/50 border border-stone-700/30 rounded-xl p-3 flex items-center max-w-xs">
                        <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center ltr:mr-3 rtl:ml-3 border border-stone-700/30">
                          <HardDrive size={18} className="text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-stone-300" dir="ltr">landing-v2.fig</div>
                          <div className="w-full bg-stone-700 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div className="bg-amber-500 h-full w-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          </div>
                          <div className="flex justify-between text-[9px] text-stone-600 mt-1 font-mono">
                            <span className="text-amber-400">100%</span>
                            <span dir="ltr">42.5 MB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 }}
                    className="flex items-start gap-3 flex-row-reverse"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-display font-bold text-sm text-stone-950">B</div>
                    <div className="flex-1 flex flex-col items-end">
                      <div className="flex items-baseline gap-2 flex-row-reverse">
                        <span className="font-semibold text-amber-400 text-sm">{isRtl ? 'بوب' : 'Bob'}</span>
                        <span className="text-[10px] text-stone-600 font-mono">{t.todayAt} 10:43 AM</span>
                      </div>
                      <div className="text-stone-200 text-sm mt-1 leading-relaxed bg-amber-500/10 border border-amber-500/15 p-3 rounded-xl rounded-tr-none max-w-xs">{t.bobMsg}</div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/15 rounded-full blur-[50px] pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-orange-600/10 rounded-full blur-[60px] pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </main>

      {/* 👇👇 بداية منطقة الإعلان التي سنضيفها 👇👇 */}
      <div className="max-w-6xl mx-auto px-6 relative z-10 my-8">
        <div className="bg-stone-900/30 border border-stone-800/50 rounded-2xl p-4">
          <p className="text-center text-xs text-stone-600 mb-2 uppercase tracking-widest font-mono">إعلان</p>
          
          {/* ضع رقم الـ Slot الخاص بك هنا بدلاً من الأصفار */}
          <AdBanner dataAdSlot="8015209706" /> 
        </div>
      </div>
      {/* 👆👆 نهاية منطقة الإعلان 👆👆 */}

      {/* Features */}
      <section id="features" className="py-28 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">

      {/* Features */}
      <section id="features" className="py-28 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 text-stone-100">{t.featuresTitle}</h2>
            <p className="text-stone-500 text-lg leading-relaxed">{t.featuresDesc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield size={24} className="text-amber-400" />}
              title={t.feature1Title}
              description={t.feature1Desc}
              accent="amber"
            />
            <FeatureCard
              icon={<Zap size={24} className="text-emerald-400" />}
              title={t.feature2Title}
              description={t.feature2Desc}
              accent="emerald"
            />
            <FeatureCard
              icon={<Users size={24} className="text-orange-400" />}
              title={t.feature3Title}
              description={t.feature3Desc}
              accent="orange"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-stone-800/50 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-stone-600">
          <div className="flex items-center gap-2.5 mb-3 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-700 rounded-md flex items-center justify-center font-bold text-stone-950 text-xs">S</div>
            <span className="font-display font-medium text-stone-400 text-sm">{t.navTitle}</span>
          </div>
          <p className="text-xs tracking-wide">{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: string }) {
  const accentColors: Record<string, string> = {
    amber: 'group-hover:border-amber-500/20 group-hover:bg-amber-500/[0.02]',
    emerald: 'group-hover:border-emerald-500/20 group-hover:bg-emerald-500/[0.02]',
    orange: 'group-hover:border-orange-500/20 group-hover:bg-orange-500/[0.02]',
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group bg-stone-900/50 border border-stone-800 rounded-2xl p-8 transition-all duration-300 ${accentColors[accent] || ''}`}
    >
      <div className="w-12 h-12 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold mb-3 text-stone-100">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
