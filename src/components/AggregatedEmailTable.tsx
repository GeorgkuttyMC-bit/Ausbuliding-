import { useState } from 'react';
import { Mail, Check, AlertCircle, Copy, CheckCircle2, Download } from 'lucide-react';
import { Hospital } from '../types';

interface EmailEntry {
  hospitalName: string;
  mailId: string;
  source: 'General' | 'Ausbildung' | 'Arbeitsagentur';
  isEmailVerified?: boolean | null;
  postedDaysAgo?: number;
}

export function AggregatedEmailTable({ results, ausbildungResults, arbeitsagenturResults }: { results: Hospital[], ausbildungResults: Hospital[], arbeitsagenturResults: Hospital[] }) {
  const allEmails: EmailEntry[] = [
    ...results.map(h => ({ ...h, source: 'General' as const })),
    ...ausbildungResults.map(h => ({ ...h, source: 'Ausbildung' as const })),
    ...arbeitsagenturResults.map(h => ({ ...h, source: 'Arbeitsagentur' as const }))
  ].filter(h => h.mailId && h.mailId !== 'N/A' && h.mailId !== 'Not provided' && h.mailId.includes('@'));

  const exportToCSV = () => {
    if (allEmails.length === 0) return;

    const headers = ['Hospital Name', 'Email ID', 'Source', 'Verification Status', 'Posted Days Ago'];
    
    const escapeCSV = (str: string | undefined | null) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = allEmails.map(entry => [
      escapeCSV(entry.hospitalName),
      escapeCSV(entry.mailId),
      escapeCSV(entry.source),
      escapeCSV(entry.isEmailVerified === true ? 'Verified' : entry.isEmailVerified === false ? 'Invalid' : 'Unverified'),
      escapeCSV(entry.postedDaysAgo !== undefined ? String(entry.postedDaysAgo) : 'Unknown')
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `klinik_sucher_emails_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (allEmails.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Mail className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p>No valid email addresses found yet. Please perform a search first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100 text-slate-700 font-medium">
          <tr>
            <th className="px-4 py-3">Hospital / Institution</th>
            <th className="px-4 py-3">Email ID</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Posted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {allEmails.map((entry, i) => (
            <EmailRow key={i} entry={entry} />
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function EmailRow({ entry }: { entry: EmailEntry }) {
  const [copied, setCopied] = useState(false);

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'General': return 'bg-blue-50/50 hover:bg-blue-50';
      case 'Ausbildung': return 'bg-purple-50/50 hover:bg-purple-50';
      case 'Arbeitsagentur': return 'bg-orange-50/50 hover:bg-orange-50';
      default: return 'bg-slate-50/50 hover:bg-slate-50';
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'General': return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">General</span>;
      case 'Ausbildung': return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Ausbildung.de</span>;
      case 'Arbeitsagentur': return <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Arbeitsagentur.de</span>;
      default: return null;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.mailId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <tr className={`transition-colors ${getSourceColor(entry.source)}`}>
      <td className="px-4 py-3 font-medium text-slate-900">{entry.hospitalName}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-900 font-medium select-all">{entry.mailId}</span>
          <button 
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Copy Email"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </td>
      <td className="px-4 py-3">{getSourceBadge(entry.source)}</td>
      <td className="px-4 py-3">
        {entry.isEmailVerified ? (
          <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold border border-emerald-200 bg-emerald-50 px-2 py-1 rounded-full w-fit">
            <Check className="w-3.5 h-3.5" /> Verified
          </span>
        ) : entry.isEmailVerified === false ? (
          <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold border border-red-200 bg-red-50 px-2 py-1 rounded-full w-fit">
            <AlertCircle className="w-3.5 h-3.5" /> Invalid
          </span>
        ) : (
          <span className="text-slate-500 text-xs font-medium border border-slate-200 bg-slate-50 px-2 py-1 rounded-full w-fit">Unverified</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 font-medium">
        {entry.postedDaysAgo !== undefined 
            ? (entry.postedDaysAgo === 0 ? 'Today' : `${entry.postedDaysAgo}d ago`) 
            : 'Unknown'}
      </td>
    </tr>
  );
}
