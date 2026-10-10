import React from 'react';
import { Building2, PhoneCall, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  navigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: System Branding */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                Smart Civic
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens to report public grievances and collaborate with municipal authorities for cleaner, safer, and better-maintained urban infrastructure.
            </p>
            <div className="pt-2 text-xs text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Gov-Grade Civic Redressal Portal</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Civic Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('report')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Report a Civic Problem
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('track')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Track Public Complaint Status
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('citizen-dashboard')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Citizen Grievance Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('admin-dashboard')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Municipal Authority Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Emergency & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Civic Helpline Desk
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Toll-Free Control Room: 1800-11-2026</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>support@smartcivic.gov.in</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Municipal Corporation HQ, Central Zone</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Student Project & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Project Specification
            </h4>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
              <div className="text-slate-400 text-[11px]">Academic & Production Capstone:</div>
              <div className="font-semibold text-emerald-300">
                Developed by Anish Kumar Singh
              </div>
              <div className="text-[11px] text-slate-400">
                Full-Stack Architecture: React 19, Node Express, MySQL 8 & TypeScript.
              </div>
            </div>
            <div className="flex gap-3 text-[11px] text-slate-400">
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy Notice: Citizen phone numbers and emails are encrypted and never disclosed in public tracking records."); }} className="hover:text-white underline">
                Privacy Policy
              </a>
              <span>·</span>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Civic Terms: All complaint submissions are subject to administrative verification."); }} className="hover:text-white underline">
                Citizen Charter & Terms
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Credits Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Smart Civic Complaint System. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-400">
            <span>Designed and Built by</span>
            <span className="text-white font-semibold underline decoration-blue-500 underline-offset-4">
              Anish Kumar Singh
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
