import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DatabaseHealth } from '../types';
import { Database, CheckCircle, Info, Server } from 'lucide-react';

export const DatabaseStatusBanner: React.FC = () => {
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.public
      .getHealth()
      .then((res) => {
        if (isMounted && res.database) {
          setDbHealth(res.database);
        }
      })
      .catch(() => {
        // quiet fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!dbHealth) return null;

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-slate-300">
            Database Engine:
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {dbHealth.engine === 'mysql' ? 'MySQL 8 (Enterprise Pool)' : 'Embedded Relational (SQLite 3 WASM)'}
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Schema: <span className="text-slate-300 font-mono">smart_civic</span> (5 normalized tables)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-sky-400 hover:text-sky-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>{showDetails ? 'Hide Details' : 'Connection Info'}</span>
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div>
              <strong className="text-slate-300">Host:</strong> {dbHealth.host} |{' '}
              <strong className="text-slate-300">Tables:</strong> users, complaints, departments, complaint_assignments, complaint_status_history
            </div>
            {dbHealth.notice && (
              <div className="text-amber-400 font-mono text-[10px]">{dbHealth.notice}</div>
            )}
          </div>
          <div className="text-slate-400 font-mono">
            MySQL 8 .sql: <code className="text-sky-300">/database/schema.sql</code> & <code className="text-sky-300">/database/seed.sql</code>
          </div>
        </div>
      )}
    </div>
  );
};
