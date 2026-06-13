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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allEmails: EmailEntry[] = [
    ...results.map(h => ({ ...h, source: 'General' as const })),
    ...ausbildungResults.map(h => ({ ...h, source: 'Ausbildung' as const })),
    ...arbeitsagenturResults.map(h => ({ ...h, source: 'Arbeitsagentur' as const }))
  ].filter(h => h.mailId && h.mailId !== 'N/A' && h.mailId !== 'Not provided' && h.mailId.includes('@'));

  const totalPages = Math.ceil(allEmails.length / itemsPerPage);
  const paginatedEmails = allEmails.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100 text-slate-700 font-medium">
          <tr>
            <th className="px-4 py-3">Hospital / Institution</th>
            <th className="px-4 py-3">Email ID</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Posted</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {paginatedEmails.map((entry, i) => (
            <EmailRow key={`${entry.mailId}-${i}`} entry={entry} />
          ))}
        </tbody>
      </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, allEmails.length)}</span> of{' '}
                <span className="font-medium">{allEmails.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Simple page numbers */}
                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                  const pageNumber = totalPages <= 5 ? idx + 1 : (currentPage > 3 ? currentPage - 2 + idx : idx + 1);
                  if (pageNumber > totalPages) return null;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNumber
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailRow({ entry }: { entry: EmailEntry }) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(() => {
    return localStorage.getItem(`applied-${entry.mailId}`) === 'true';
  });

  const toggleApplied = () => {
    const newState = !applied;
    setApplied(newState);
    if (newState) {
      localStorage.setItem(`applied-${entry.mailId}`, 'true');
    } else {
      localStorage.removeItem(`applied-${entry.mailId}`);
    }
  };

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
      <td className="px-4 py-3 text-right">
        <button
          onClick={toggleApplied}
          className={`inline-flex items-center justify-center min-w-[100px] gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors shadow-sm border ${
            applied 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-slate-900 text-white border-transparent hover:bg-slate-800'
          }`}
        >
          {applied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Applied</> : 'Mark Applied'}
        </button>
      </td>
    </tr>
  );
}
