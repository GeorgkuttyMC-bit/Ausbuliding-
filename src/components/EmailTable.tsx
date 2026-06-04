import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { useApplicationState } from './useApplicationState';

interface EmailTableProps {
  emails: string[];
}

export function EmailTable({ emails }: { emails: string[] }) {
  // Deduplicate emails just in case
  const uniqueEmails = Array.from(new Set(emails));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uniqueEmails.map((email, index) => (
              <EmailTableRow key={`${email}-${index}`} email={email} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmailTableRow({ email }: { email: string }) {
  const emailKey = `applied-custom-email-${email}`.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const { isApplied, toggleApplied } = useApplicationState(emailKey, 'Email Application', email);

  return (
    <tr className={`group transition-colors hover:bg-slate-50/50 ${isApplied ? 'bg-emerald-50/20' : ''}`}>
      <td className="py-4 px-6 align-middle">
        <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-medium">
          <Mail className="w-4 h-4 shrink-0 text-slate-400" />
          <span>{email}</span>
        </a>
      </td>
      <td className="py-4 px-6 align-middle text-right">
        <button 
          onClick={toggleApplied}
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
  );
}
