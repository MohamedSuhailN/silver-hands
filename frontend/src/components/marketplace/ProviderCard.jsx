import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ShieldCheck, Award } from 'lucide-react';
import { SkillPassportBadge } from '../trust/SkillPassportBadge';

export const ProviderCard = ({ provider }) => {
  return (
    <div className="card-surface p-6 flex flex-col justify-between h-full group border border-[#E8F1F7] hover:border-[#3F9BE8]">
      <div className="space-y-4">
        {/* Header: Avatar, Name & Rating */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF5FC] text-[#1F6FB2] flex items-center justify-center font-extrabold text-xl shrink-0 border border-[#DCEAF4] shadow-sm">
            {provider.display_name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Link to={`/providers/${provider.id}`} className="font-heading text-lg font-bold text-[#163A5F] hover:text-[#3F9BE8] truncate transition-colors">
                {provider.display_name}
              </Link>
              <div className="flex items-center gap-1 text-xs font-bold text-[#1F6FB2] bg-[#EAF5FC] px-2 py-0.5 rounded-full border border-[#DCEAF4] shrink-0">
                <Star className="w-3.5 h-3.5 fill-current text-[#3F9BE8]" />
                <span>{provider.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                {provider.location}
              </span>
              <span>•</span>
              <span className="font-bold text-[#1F6FB2]">{provider.experience_years}+ yrs exp</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-[#64748B] line-clamp-3 leading-relaxed">
          {provider.bio}
        </p>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5">
          {(provider.skills || []).slice(0, 3).map((skill, idx) => (
            <span key={idx} className="bg-[#F5F9FC] text-[#1F2937] text-[11px] font-semibold px-2.5 py-1 rounded-md border border-[#E8F1F7]">
              {skill}
            </span>
          ))}
        </div>

        {/* Verified Passport Status */}
        <div className="pt-2">
          <SkillPassportBadge passportId={provider.skill_passport_id} trustScore={provider.trust_score} compact={true} />
        </div>
      </div>

      {/* Footer / Action */}
      <div className="mt-5 pt-4 border-t border-[#E8F1F7] flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#64748B]">
          {provider.services?.length || 0} Services Listed
        </span>
        <Link to={`/providers/${provider.id}`} className="btn-secondary text-xs !px-4 !py-2 shrink-0">
          View Profile
        </Link>
      </div>
    </div>
  );
};
