import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, MessageSquare, Info, LayoutDashboard, ChevronRight, Filter, Settings, Bell, Circle } from 'lucide-react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { Match, Player, FantasyTeam } from './types';
import { cn } from './lib/utils';
import { onAuthStateChanged, User } from 'firebase/auth';

// Pages
import Dashboard from './components/Dashboard';
import MatchDetails from './components/MatchDetails';
import ChatAssistant from './components/ChatAssistant';

const Navbar = ({ user }: { user: User | null }) => {
  return (
    <nav className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white uppercase italic">CricExpert <span className="text-amber-500">Pro</span></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Dashboard</Link>
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Strategy</a>
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Stats Hub</a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-white/50 hover:text-white">
          <Bell className="w-5 h-5" />
        </button>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user.displayName}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Pro Member</p>
            </div>
            <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full border border-white/20" />
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-white/90 transition-all uppercase tracking-tighter"
          >
            Connect Profile
          </button>
        )}
      </div>
    </nav>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 selection:text-amber-500">
        <Navbar user={user} />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/match/:id" element={<MatchDetails />} />
          </Routes>
        </main>
        <ChatAssistant />
        
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>
      </div>
    </Router>
  );
}
