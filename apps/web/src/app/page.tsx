import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="game-bg" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-pink/5 blur-[120px] pointer-events-none" />

      <div className="text-center space-y-10 max-w-2xl relative z-10">
        <div className="phase-enter">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight">
            <span className="text-[#EF3340]">Defence</span><span className="text-white">Quest</span>
          </h1>
          <div className="flex justify-center gap-1.5 mt-4">
            {['#EF3340', '#1E3A5F', '#FFD700', '#FFFFFF'].map((color, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color, opacity: 0.8, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        <p className="text-xl md:text-2xl text-white/60 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Learn about Singapore Total Defence through fun mini-games
        </p>

        {/* Total Defence Games */}
        <div className="grid gap-3 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/defense"
            className="block bg-gradient-to-r from-[#EF3340]/20 to-[#1E3A5F]/20 border border-[#EF3340]/30 rounded-xl p-4 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">🇸🇬</span>
              <div className="text-left">
                <h3 className="font-bold text-[#EF3340]">Total Defence Challenge</h3>
                <p className="text-sm text-white/60">Play action games about Singapore National Defence</p>
              </div>
              <span className="text-2xl">🛡️</span>
            </div>
          </Link>
          <Link
            href="/defense-academy"
            className="block bg-gradient-to-r from-[#6366f1]/20 to-[#0ea5e9]/20 border border-[#6366f1]/30 rounded-xl p-4 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">🎓</span>
              <div className="text-left">
                <h3 className="font-bold text-[#6366f1]">Defence Academy</h3>
                <p className="text-sm text-white/60">Learn through integrated quiz-games</p>
              </div>
              <span className="text-2xl">🎮</span>
            </div>
          </Link>
          <Link
            href="/defense-rpg"
            className="block bg-gradient-to-r from-[#a855f7]/20 to-[#ec4899]/20 border border-[#a855f7]/30 rounded-xl p-4 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">⚔️</span>
              <div className="text-left">
                <h3 className="font-bold text-[#a855f7]">Defence Quest RPG</h3>
                <p className="text-sm text-white/60">Epic RPG adventure with battles and bosses</p>
              </div>
              <span className="text-2xl">🐉</span>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
