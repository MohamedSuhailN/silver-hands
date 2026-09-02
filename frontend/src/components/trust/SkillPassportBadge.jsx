import React, { useState } from 'react';
import { Award, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

export const SkillPassportBadge = ({ passportId, trustScore = 95, trustBreakdown = null, compact = false }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 bg-sage-50 text-sage-dark px-3 py-1.5 rounded-xl border border-sage-200 text-xs font-bold shadow-warm-sm">
        <Award className="w-4 h-4 text-sage" />
        <span>Verified Elder Artisan</span>
        <span className="bg-sage text-white px-1.5 py-0.2 rounded-md text-[10px]">
          {trustScore}% Trust
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#EAF5FC]/60 border-2 border-[#3F9BE8]/40 rounded-2xl p-4 shadow-warm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#3F9BE8] text-white flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-[#163A5F] flex items-center gap-1.5">
              Verified Livelihood Skill Passport
              <button 
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-[#64748B] hover:text-[#3F9BE8] transition-colors"
                title="How is Trust Score calculated?"
                aria-label="How is Trust Score calculated?"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </h4>
            <span className="text-[10px] text-[#64748B] font-mono">Passport ID: {passportId || 'SP-VERIFIED-2026'}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-[#64748B] font-bold block">SilverTrust</span>
          <span className="font-heading text-base font-extrabold text-[#1F6FB2]">{trustScore}/100</span>
        </div>
      </div>

      {showExplanation && (
        <div className="mt-2 mb-3 p-3 bg-white rounded-xl border border-[#DCEAF4] text-[11px] text-[#1F2937] space-y-1 animate-fade-in">
          <span className="font-bold text-[#163A5F] block">Transparent Trust Calculation:</span>
          <p className="text-[#64748B]">
            {trustBreakdown?.explanation || "Trust is calculated strictly from account verification, profile completeness, practical experience, completed customer bookings, and verified customer reviews."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#1F2937] pt-2 border-t border-[#DCEAF4]">
        <span className="flex items-center gap-1 text-[#1F6FB2]"><CheckCircle2 className="w-3.5 h-3.5 text-[#3F9BE8]" /> Verified Profile & Contact</span>
        <span className="flex items-center gap-1 text-[#1F6FB2]"><CheckCircle2 className="w-3.5 h-3.5 text-[#3F9BE8]" /> Traditional Craft Mastery</span>
        <span className="flex items-center gap-1 text-[#1F6FB2]"><CheckCircle2 className="w-3.5 h-3.5 text-[#3F9BE8]" /> Direct Community Ratings</span>
      </div>
    </div>
  );
};
