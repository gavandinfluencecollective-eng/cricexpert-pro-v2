import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Wind, Target, Calendar } from 'lucide-react';
import { Match } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(err => console.error("Health check failed", err));

    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMatches(data);
        } else {
          console.error("API returned non-array:", data);
          setMatches([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-white/5 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500 font-mono text-[10px] tracking-[0.3em] uppercase">
            <Wind className="w-3 h-3" />
            Real-time Match Engine
          </div>
          {dbStatus && (
            <div className={`flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
              dbStatus.dbStatus?.includes('Connected') 
                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' 
                : 'border-amber-500/30 text-amber-500 bg-amber-500/5'
            }`}>
              <div className={`w-1 h-1 rounded-full ${
                dbStatus.dbStatus?.includes('Connected') ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-amber-500'
              }`} />
              {dbStatus.dbStatus}
            </div>
          )}
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter sm:text-6xl">
          Active <span className="text-white/20">Arenas</span>
        </h1>
      </header>

      <div className="grid gap-4">
        {matches.map((match, idx) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(`/match/${match.id}`)}
            className="group relative overflow-hidden bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-amber-500/50 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                    match.status === 'LIVE' ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-white/60"
                  )}>
                    {match.status}
                  </span>
                  <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{match.match_type} Match</span>
                </div>
                <h3 className="text-2xl font-bold italic uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                  {match.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-white/40 font-medium">
                  <span className="flex items-center gap-1.5"><Target className="w-3 h-3" /> {match.venue}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(match.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right space-y-1">
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Predictive AI</p>
                  <p className="text-xl font-black italic text-amber-500">92% <span className="text-[10px] font-normal not-italic text-white/40">Confidence</span></p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:border-amber-500 transition-all">
                  <ChevronRight className="w-6 h-6 text-white group-hover:text-black transition-colors" />
                </div>
              </div>
            </div>
            
            {/* Hover Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}

        {matches.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-white/20 italic uppercase tracking-widest font-black text-2xl">No active streams found</p>
          </div>
        )}
      </div>
    </div>
  );
}
