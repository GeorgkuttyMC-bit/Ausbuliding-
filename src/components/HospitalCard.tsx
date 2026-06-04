import { Hospital } from '../types';
import { Building2, Phone, Mail, MapPin, History, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface HospitalCardProps {
  hospital: Hospital;
  index: number;
}

export function HospitalCard({ hospital, index }: HospitalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-lg mt-1">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 leading-tight flex items-center gap-2">
                {hospital.hospitalName}
                {hospital.isNew && (
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    New
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{hospital.location}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 md:min-w-[280px]">
          <a 
            href={`tel:${hospital.contactNumber}`}
            className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-4 h-4 text-gray-600 shrink-0" />
            <span className="text-sm font-medium text-gray-700">{hospital.contactNumber}</span>
          </a>
          <a 
            href={`mailto:${hospital.mailId}`}
            className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-4 h-4 text-gray-600 shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">{hospital.mailId}</span>
          </a>
        </div>
      </div>

      {(hospital.history || hospital.openingDetails) && (
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 text-sm">
          {hospital.history && (
            <div>
              <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                <History className="w-4 h-4 text-blue-600" />
                About Institution
              </h4>
              <p className="text-gray-600 leading-relaxed text-pretty">
                {hospital.history}
              </p>
            </div>
          )}
          {hospital.openingDetails && (
            <div>
              <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                Ausbildung Openings
              </h4>
              <p className="text-gray-600 leading-relaxed text-pretty">
                {hospital.openingDetails}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
