import { useState } from 'react';
import { Hospital } from '../types';
import { Phone, Mail, MapPin, History, GraduationCap, CheckCircle2, AlertCircle, Clock, Globe, Check, ChevronDown, ChevronUp, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApplicationState } from './useApplicationState';

interface HospitalTableProps {
  hospitals: Hospital[];
}

export function HospitalTable({ hospitals }: HospitalTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Institution</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hospitals.map((hospital, index) => (
              <HospitalTableRow key={`${hospital.hospitalName}-${index}`} hospital={hospital} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HospitalTableRow({ hospital, index }: { hospital: Hospital, index: number }) {
  const hospitalKey = `applied-${hospital.hospitalName}-${hospital.location}`.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const [expanded, setExpanded] = useState(false);
  const { isApplied, toggleApplied } = useApplicationState(hospitalKey, hospital.hospitalName, hospital.location);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleApplied();
  };

  return (
    <>
      <tr 
        className={`group transition-colors hover:bg-slate-50/50 cursor-pointer ${isApplied ? 'bg-emerald-50/20' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-4 px-6 align-top">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center flex-wrap gap-2">
              {hospital.hospitalName}
              {hospital.isNew && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  New
                </span>
              )}
              {hospital.duplicateSources && hospital.duplicateSources.length > 0 && (
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide border border-slate-200" title={`Also found in: ${hospital.duplicateSources.join(', ')}`}>
                  Also in {hospital.duplicateSources.join(' & ')}
                </span>
              )}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{hospital.location}</span>
              </div>
              {hospital.postedDaysAgo !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{hospital.postedDaysAgo === 0 ? 'Today' : `${hospital.postedDaysAgo}d ago`}</span>
                </div>
              )}
            </div>
            {(hospital.history || hospital.openingDetails) && (
              <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 font-medium select-none">
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide Details' : 'View Details'}
              </div>
            )}
          </div>
        </td>
        
        <td className="py-4 px-6 align-top">
          <div className="flex flex-col gap-2">
            <a href={`mailto:${hospital.mailId}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 truncate max-w-[150px]" title={hospital.mailId}>
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{hospital.mailId}</span>
              {hospital.isEmailVerified === true && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
              {hospital.isEmailVerified === false && <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />}
            </a>
            <a href={`tel:${hospital.contactNumber}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 truncate max-w-[150px]">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{hospital.contactNumber}</span>
            </a>
            {hospital.website && (
              <a href={hospital.website.startsWith('http') ? hospital.website : `https://${hospital.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 truncate max-w-[150px]">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Website</span>
              </a>
            )}
            <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(hospital.hospitalName)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 truncate max-w-[150px]">
              <Linkedin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Employees on LinkedIn</span>
            </a>
          </div>
        </td>

        <td className="py-4 px-6 align-top text-right">
          <button 
            onClick={handleToggle}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border text-xs font-bold ${
              isApplied 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {isApplied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Applied
              </>
            ) : (
              'Apply'
            )}
          </button>
        </td>
      </tr>
      
      <AnimatePresence>
        {expanded && (hospital.history || hospital.openingDetails) && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden border-b border-slate-100 ${isApplied ? 'bg-emerald-50/10' : 'bg-slate-50/30'}`}
          >
            <td colSpan={3} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {hospital.history && (
                  <div className="space-y-2">
                    <h5 className="flex items-center gap-1.5 font-bold text-slate-700">
                      <History className="w-3.5 h-3.5 text-indigo-500" />
                      About Institution
                    </h5>
                    <p className="text-slate-600 leading-relaxed max-w-sm">
                      {hospital.history}
                    </p>
                  </div>
                )}
                {hospital.openingDetails && (
                  <div className="space-y-2">
                    <h5 className="flex items-center gap-1.5 font-bold text-slate-700">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                      Ausbildung Openings
                    </h5>
                    <p className="text-slate-600 leading-relaxed max-w-sm">
                      {hospital.openingDetails}
                    </p>
                  </div>
                )}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
