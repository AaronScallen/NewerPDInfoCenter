import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Bell, Calendar, User } from 'lucide-react';

export default function ActiveNoticeBanner({ notices, onManageNotices }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto rotate single active notice every 8s if not expanded
  useEffect(() => {
    if (!notices || notices.length <= 1 || isExpanded) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [notices, isExpanded]);

  if (!notices || notices.length === 0) {
    return (
      <div className="bg-tactical-950/60 border-b border-tactical-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
          <span className="font-mono text-slate-500 uppercase">SYSTEM BROADCAST BANNER:</span>
          <span className="italic text-slate-400">No active general department notices for current time window.</span>
        </div>
        <button
          onClick={onManageNotices}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline ml-4"
        >
          + Post Notice
        </button>
      </div>
    );
  }

  const currentNotice = notices[currentIndex] || notices[0];

  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-tactical-950 border-b border-amber-600/40 px-4 py-2 text-xs shadow-md">
      <div className="flex items-center justify-between gap-4">
        {/* Notice Content */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold">
            <Bell className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>ACTIVE NOTICE ({currentIndex + 1}/{notices.length})</span>
          </div>

          <div className="truncate flex-1">
            <span className="font-medium text-amber-100">{currentNotice.message}</span>
          </div>

          {/* Metadata */}
          <div className="hidden lg:flex items-center space-x-3 text-slate-400 font-mono text-[11px] shrink-0">
            {currentNotice.author_name && (
              <span className="flex items-center space-x-1 text-slate-300">
                <User className="w-3 h-3 text-amber-400" />
                <span>Auth: {currentNotice.author_name} {currentNotice.author_badge ? `(#${currentNotice.author_badge})` : ''}</span>
              </span>
            )}
            <span className="flex items-center space-x-1 text-slate-400">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>Valid thru: {new Date(currentNotice.datetime_end).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {notices.length > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length)}
                className="p-1 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300"
                title="Previous notice"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % notices.length)}
                className="p-1 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300"
                title="Next notice"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 rounded bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-slate-300 text-[11px] flex items-center space-x-1"
          >
            <span>{isExpanded ? 'Collapse' : `All (${notices.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={onManageNotices}
            className="px-2 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 text-[11px] font-semibold"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Expanded Accordion for Multiple Active Notices */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {notices.map((n, idx) => (
            <div
              key={n.id || idx}
              className={`p-2.5 rounded border text-xs ${
                idx === currentIndex
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-100'
                  : 'bg-tactical-900/80 border-tactical-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/80 mb-1">
                <span>BULLETIN #{n.id}</span>
                <span>{new Date(n.datetime_start).toLocaleDateString()} – {new Date(n.datetime_end).toLocaleDateString()}</span>
              </div>
              <p className="font-medium text-slate-200 leading-snug">{n.message}</p>
              {n.author_name && (
                <div className="mt-1 text-[10px] text-slate-400 font-mono">
                  Posted by: {n.author_name} (Badge {n.author_badge || 'N/A'})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
