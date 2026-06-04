import { useState, useEffect } from 'react';
import { Hospital } from '../types';
import { Building2, Phone, Mail, MapPin, History, GraduationCap, CheckCircle2, AlertCircle, Clock, Globe, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface HospitalCardProps {
  hospital: Hospital;
  index: number;
}

export function HospitalCard({ hospital, index }: HospitalCardProps) {
  const hospitalKey = `applied-${hospital.hospitalName}-${hospital.location}`.replace(/\s+/g, '-').toLowerCase();
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(hospitalKey);
    if (stored) {
      setIsApplied(stored === 'true');
    }
  }, [hospitalKey]);

  const toggleApplied = () => {
    const newValue = !isApplied;
    setIsApplied(newValue);
    localStorage.setItem(hospitalKey, String(newValue));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`rounded-2xl border p-6 sm:p-8 flex flex-col gap-6 shadow-sm hover:shadow-lg transition-all duration-300 ${
        isApplied 
          ? 'bg-slate-50/50 border-slate-200/50' 
          : 'bg-white border-slate-200/60 hover:border-slate-300/80'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-xl mt-1 ring-1 ring-inset ring-indigo-100/50">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 leading-tight flex items-center gap-2 font-display">
                {hospital.hospitalName}
                {hospital.isNew && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    New
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-1.5 text-slate-500 mt-2">
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{hospital.location}</span>
                </div>
                {hospital.postedDaysAgo !== undefined && (
                  <>
                    <span className="mx-1 text-slate-300">•</span>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">
                        {hospital.postedDaysAgo === 0 ? 'Posted today' : `Posted ${hospital.postedDaysAgo} days ago`}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2.5 md:min-w-[300px]">
          <a 
            href={`tel:${hospital.contactNumber}`}
            className="group flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:text-blue-600 transition-colors">
              <Phone className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">{hospital.contactNumber}</span>
          </a>
          <a 
            href={`mailto:${hospital.mailId}`}
            className="group flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:text-blue-600 transition-colors">
              <Mail className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700 truncate flex-1">{hospital.mailId}</span>
            {hospital.isEmailVerified === true && (
              <span title="Email Domain Verified">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </span>
            )}
            {hospital.isEmailVerified === false && (
              <span title="Could not verify email domain">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              </span>
            )}
          </a>
          {hospital.website && (
            <a 
              href={hospital.website.startsWith('http') ? hospital.website : `https://${hospital.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:text-blue-600 transition-colors">
                <Globe className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700 truncate flex-1">{hospital.website}</span>
            </a>
          )}
          
          <button 
            onClick={toggleApplied}
            className={`mt-2 group flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all border ${
              isApplied 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-6 h-6 rounded-md transition-all ${
                isApplied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200 group-hover:text-slate-400'
              }`}>
                {isApplied && <Check className="w-4 h-4" />}
              </div>
              <span className="text-sm font-bold">
                {isApplied ? 'Application Submitted' : 'Mark as Applied'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {(hospital.history || hospital.openingDetails) && (
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {hospital.history && (
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100/50">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 font-display">
                <History className="w-4 h-4 text-indigo-500" />
                About Institution
              </h4>
              <p className="text-slate-600 leading-relaxed text-pretty">
                {hospital.history}
              </p>
            </div>
          )}
          {hospital.openingDetails && (
            <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100/50">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 font-display">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                Ausbildung Openings
              </h4>
              <p className="text-slate-600 leading-relaxed text-pretty">
                {hospital.openingDetails}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
