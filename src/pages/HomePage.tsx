import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PublicStats } from '../types';
import {
  AlertTriangle,
  Search,
  PlusCircle,
  Truck,
  Droplets,
  Zap,
  Lightbulb,
  Building,
  CheckCircle2,
  Users,
  Shield,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HomePageProps {
  navigate: (view: string, param?: string | number) => void;
}

const CATEGORIES_INFO = [
  {
    name: 'Road/Pothole',
    icon: AlertTriangle,
    desc: 'Damaged pavement, deep craters, cave-ins, and road resurfacing needs.',
    color: 'from-amber-500/10 to-amber-500/5 text-amber-700 border-amber-200',
  },
  {
    name: 'Garbage',
    icon: Truck,
    desc: 'Uncollected waste, overflowing municipal dumpsters, and illegal dumping.',
    color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-700 border-emerald-200',
  },
  {
    name: 'Water Supply',
    icon: Droplets,
    desc: 'Pipeline bursts, water contamination, low pressure, and pipeline leaks.',
    color: 'from-blue-500/10 to-blue-500/5 text-blue-700 border-blue-200',
  },
  {
    name: 'Drainage',
    icon: Droplets,
    desc: 'Clogged stormwater drains, sewage overflow, and road waterlogging.',
    color: 'from-teal-500/10 to-teal-500/5 text-teal-700 border-teal-200',
  },
  {
    name: 'Streetlight',
    icon: Lightbulb,
    desc: 'Defective poles, flickering lights, unlit street corridors, and timing errors.',
    color: 'from-yellow-500/10 to-yellow-500/5 text-yellow-700 border-yellow-200',
  },
  {
    name: 'Electricity',
    icon: Zap,
    desc: 'Low-hanging wires, transformer sparking, voltage surges, and feeder faults.',
    color: 'from-rose-500/10 to-rose-500/5 text-rose-700 border-rose-200',
  },
  {
    name: 'Public Sanitation',
    icon: Building,
    desc: 'Public toilet maintenance, unsanitary parks, vector breeding spots.',
    color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-700 border-cyan-200',
  },
  {
    name: 'Other',
    icon: Sparkles,
    desc: 'Encroachments, stray animal nuisances, unauthorized public hoardings.',
    color: 'from-slate-500/10 to-slate-500/5 text-slate-700 border-slate-200',
  },
];

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [quickCode, setQuickCode] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.public
      .getStats()
      .then((res) => {
        if (isMounted && res.success) {
          setStats(res.stats);
        }
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      navigate('track', quickCode.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white p-8 sm:p-14 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Civic Grievance Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Smart Civic Complaint System
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
            Report civic issues. Track progress. Build a better city.
          </p>

          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            A direct digital bridge connecting citizens with municipal administration. Submit geo-tagged reports for potholes, overflowing garbage, drainage bursts, and power hazards with real-time resolution transparency.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('report')}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Problem</span>
            </button>

            <button
              onClick={() => navigate('track')}
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-blue-300" />
              <span>Track Complaint</span>
            </button>
          </div>

          {/* Inline Quick Track Search */}
          <div className="pt-4 max-w-lg">
            <form onSubmit={handleQuickTrack} className="flex gap-2">
              <input
                type="text"
                placeholder="Have a complaint ID? e.g. SC-2026-00001"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Track Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Real Database Statistics */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Real-Time Municipal Resolution Metrics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Metrics calculated directly from live records in the database.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Database: <strong className="text-slate-700">smart_civic</strong>
          </div>
        </div>

        {loadingStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100">
              <div className="text-xs text-blue-800 font-medium">Total Complaints Logged</div>
              <div className="text-3xl font-extrabold text-blue-900 mt-2 font-mono">
                {stats.totalComplaints}
              </div>
              <div className="text-[11px] text-blue-700 mt-1">
                Citizens actively reporting
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <div className="text-xs text-emerald-800 font-medium">Resolved & Closed</div>
              <div className="text-3xl font-extrabold text-emerald-900 mt-2 font-mono">
                {stats.resolvedComplaints}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Completed on-ground actions
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-100">
              <div className="text-xs text-amber-800 font-medium">Active Grievances</div>
              <div className="text-3xl font-extrabold text-amber-900 mt-2 font-mono">
                {stats.activeComplaints}
              </div>
              <div className="text-[11px] text-amber-700 mt-1">
                Under review & in-progress
              </div>
            </div>

            <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100">
              <div className="text-xs text-indigo-800 font-medium">Resolution Efficiency</div>
              <div className="text-3xl font-extrabold text-indigo-900 mt-2 font-mono">
                {stats.resolutionRate}%
              </div>
              <div className="text-[11px] text-indigo-700 mt-1">
                Resolved vs total registered
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            Database metrics currently unavailable.
          </div>
        )}
      </section>

      {/* How the System Works */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            How The Smart Civic System Works
          </h2>
          <p className="text-sm text-slate-600">
            A 4-step workflow designed for rapid response, accountability, and citizen verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base mb-4">
              1
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1.5">
              Citizen Reports Problem
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit description, category, street location, GPS coordinates, and photo evidence in under 60 seconds.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base mb-4">
              2
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1.5">
              Review & Department Routing
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Central administration reviews severity and assigns to specialized municipal bodies (PWD, Waste, Water, Power).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base mb-4">
              3
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1.5">
              Field Action & Progress
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zonal squads deploy on-site. Status updates with remarks are logged in real-time on your visual tracking timeline.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base mb-4">
              4
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1.5">
              Resolution & Audit Proof
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Work is verified, official resolution remarks are recorded, and the complaint is marked Resolved.
            </p>
          </div>
        </div>
      </section>

      {/* Civic Issue Categories */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Civic Complaint Categories
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select a category below to quickly file an issue directly with the designated department.
            </p>
          </div>
          <button
            onClick={() => navigate('report')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View full submission form</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES_INFO.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => navigate('report', cat.name)}
                className="group p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Report this problem</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits: Citizens & Municipal Authorities */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-10">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Benefits for the Entire Civic Ecosystem
          </h2>
          <p className="text-sm text-slate-600">
            Engineered for mutual accountability between city residents and municipal administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Citizens */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                For Citizens & Neighborhoods
              </h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>No bureaucratic runarounds:</strong> File grievances online with automatic unique ID without visiting government offices.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Photographic & GPS Evidence:</strong> Pinpoint exact craters, bursting pipes, or trash piles with GPS accuracy.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Real-time Visual Timeline:</strong> Monitor every stage from submission to assignment and final closure.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Privacy Protection:</strong> Phone numbers and personal emails are never published on open tracking pages.</span>
              </li>
            </ul>
          </div>

          {/* For Municipal Authorities */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                For Municipal Authorities & Officers
              </h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Unified Dispatch Console:</strong> View, filter, and assign problems across all municipal departments in one place.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Audit Log Compliance:</strong> Automatic timestamps and officer IDs permanently recorded in history tables.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Data-Driven Analytics:</strong> Real database charts identify recurring hazard clusters and department resolution rates.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>CSV Report Export:</strong> Generate instant formatted reports for council meetings and administrative review.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
