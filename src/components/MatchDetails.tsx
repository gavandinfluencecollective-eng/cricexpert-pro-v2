import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ShieldCheck, TrendingUp, AlertTriangle, ChevronLeft, Swords, Users, Sparkles, Wand2 } from 'lucide-react';
import { Match, Player } from '../types';
import { generateAITeams } from '../services/aiService';
import { cn } from '../lib/utils';

export default function MatchDetails() {
  const { id } = useParams();
  const [matchData, setMatchData] = useState<{ players: Player[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedTeam, setGeneratedTeam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'strategy'>('roster');

  useEffect(() => {
    fetch(`/api/matches/${id}`)
      .then(res => res.json())
      .then(data => {
        setMatchData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleGenerate = async (type: string) => {
    if (!matchData) return;
    setGenerating(true);
    // Mock match object for prompt
    const matchObj = { title: "Current Match", venue: "The Arena", toss: "TBD" } as Match;
    const team = await generateAITeams(matchObj, matchData.players, type);
    setGeneratedTeam(team);
    setGenerating(false);
  };

  if (loading) return <div className="h-96 flex items-center justify-center text-white/20 uppercase tracking-[0.5em] italic font-black text-xl">Loading Intel...</div>;

  return (
    <div className="space-y-10">
       <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
            <p className="text-[10px] font-mono tracking-[0.4em] text-white/40 uppercase">Match Intelligence Node</p>
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter sm:text-7xl leading-none">
            Tactical <span className="text-white/20">Analysis</span>
          </h2>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('roster')}
            className={cn("px-6 py-2 text-xs font-bold uppercase rounded-lg transition-all", activeTab === 'roster' ? "bg-white text-black" : "text-white/60 hover:text-white")}
          >
            Roster
          </button>
          <button 
            onClick={() => setActiveTab('strategy')}
            className={cn("px-6 py-2 text-xs font-bold uppercase rounded-lg transition-all", activeTab === 'strategy' ? "bg-white text-black" : "text-white/60 hover:text-white")}
          >
            AI Strategy
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Analysis & Generation */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'roster' ? (
            <div className="grid gap-4">
               <div className="flex items-center justify-between px-4 text-[10px] uppercase tracking-widest font-bold text-white/30">
                <span>Player</span>
                <div className="flex gap-12">
                  <span>Credits</span>
                  <span className="w-16 text-right">Selection %</span>
                </div>
              </div>
              {matchData?.players.map((player) => (
                <div key={player.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border border-white/10",
                      player.role === 'batsman' ? "bg-blue-500/20 text-blue-400" :
                      player.role === 'bowler' ? "bg-red-500/20 text-red-400" :
                      "bg-amber-500/20 text-amber-400"
                    )}>
                      {player.role[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-tight">{player.name}</p>
                      <p className="text-[10px] text-white/40 uppercase font-mono">{player.team} • {player.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12 font-mono">
                    <span className="text-sm font-bold text-amber-500">{player.credits}</span>
                    <div className="w-16 text-right">
                      <span className="text-xs text-white/60">{player.selection_percentage}%</span>
                      <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${player.selection_percentage}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-black italic uppercase">Generate Ultimate Teams</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed max-w-xl">
                  Our advanced neural engine processes thousands of data points including pitch humidity, player trajectory, 
                  and historical matchup advantages to synthesize 0.1% probability strike teams.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  {[
                    { label: 'Safe Core', type: 'Safe', icon: ShieldCheck },
                    { label: 'Grand League', type: 'GL', icon: TrendingUp },
                    { label: 'Extreme GL', type: 'Extreme GL', icon: Zap },
                    { label: 'Experimental', type: 'Experimental', icon: Wand2 }
                  ].map((btn) => (
                    <button 
                      key={btn.type}
                      onClick={() => handleGenerate(btn.type)}
                      disabled={generating}
                      className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 hover:border-amber-500/50 transition-all disabled:opacity-50 group"
                    >
                      <btn.icon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {generatedTeam && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-amber-500 border border-amber-400 p-1 rounded-3xl overflow-hidden"
                  >
                    <div className="bg-black p-8 space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          <h4 className="text-lg font-black italic uppercase">Generated Selection <span className="text-white/20">| v2.4</span></h4>
                        </div>
                        <div className="bg-amber-500 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                          Prob: {(generatedTeam.winProbability * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {generatedTeam.playerIds.map((pid: string) => {
                          const player = matchData?.players.find(p => p.id === pid);
                          const isC = generatedTeam.captainId === pid;
                          const isVC = generatedTeam.viceCaptainId === pid;
                          return (
                            <div key={pid} className={cn(
                              "relative p-3 rounded-xl border flex flex-col gap-1",
                              isC || isVC ? "bg-amber-500/10 border-amber-500/50" : "bg-white/5 border-white/10"
                            )}>
                              {isC && <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">C</span>}
                              {isVC && <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center">VC</span>}
                              <p className="text-[10px] font-bold uppercase truncate">{player?.name || 'Unknown'}</p>
                              <p className="text-[8px] text-white/40 uppercase font-mono">{player?.team}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">AI Reasoning</p>
                        <p className="text-xs text-white/80 leading-relaxed italic">"{generatedTeam.reasoning}"</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Side: Insights Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
            <h4 className="text-sm font-black italic uppercase tracking-[0.2em] flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" /> Player Exposure
            </h4>
            <div className="space-y-4">
              {[
                { name: 'Highly Owned', color: 'bg-red-500', count: '4 Players' },
                { name: 'Medium Owned', color: 'bg-amber-500', count: '9 Players' },
                { name: 'Differentials', color: 'bg-blue-500', count: '9 Players' }
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-1 h-8 rounded-full", item.color)} />
                    <div>
                      <p className="text-[10px] font-bold uppercase group-hover:text-white transition-colors">{item.name}</p>
                      <p className="text-[8px] text-white/40 uppercase tracking-widest">{item.count}</p>
                    </div>
                  </div>
                  <AlertTriangle className="w-3 h-3 text-white/10 group-hover:text-white/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500 p-6 rounded-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <h4 className="text-black font-black italic uppercase text-lg leading-none">Unlock Unlimited G-Leagues</h4>
              <p className="text-black/70 text-[10px] font-bold leading-relaxed">Upgrade to Pro for advanced pitch friction analysis and daily 100+ team exports.</p>
              <button className="bg-black text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg hover:scale-105 transition-transform">Get Access Now</button>
            </div>
            <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-black/10 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
