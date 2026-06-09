import { useState } from 'react';
import { Mail, Check, AlertCircle, Copy, CheckCircle2, Download, Send, X, Paperclip, Loader2 } from 'lucide-react';
import { Hospital } from '../types';
import { useAuth } from './AuthProvider';

interface EmailEntry {
  hospitalName: string;
  mailId: string;
  source: 'General' | 'Ausbildung' | 'Arbeitsagentur';
  isEmailVerified?: boolean | null;
  postedDaysAgo?: number;
}

const EMAIL_SUBJECT = "Bewerbung um eine Ausbildung Pflegefachmann/-frau über Ausbildung.de";
const EMAIL_BODY = `Sehr geehrte Damen und Herren,

hiermit übersende ich Ihnen meine Bewerbung um einen Ausbildungsplatz als Pflegefachkraft in Ihrer Einrichtung.
Im Anhang finden Sie mein Motivationsschreiben, meinen Lebenslauf sowie alle relevanten Zeugnisse und Nachweise.

Ich freue mich sehr über die Möglichkeit, meine Ausbildung in Ihrer Einrichtung zu beginnen, und würde mich über eine Einladung zu einem Vorstellungsgespräch sehr freuen.

Für weitere Fragen stehe ich Ihnen jederzeit gerne zur Verfügung.

Vielen Dank für Ihre Zeit und Ihre Berücksichtigung.

Mit freundlichen Grüßen
Bincy Abraham`;

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
  const [showApplyModal, setShowApplyModal] = useState(false);

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
    <>
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
          onClick={() => setShowApplyModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md font-medium text-xs hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" /> Apply
        </button>
      </td>
    </tr>
    {showApplyModal && (
      <ApplicationModal 
        entry={entry} 
        onClose={() => setShowApplyModal(false)} 
      />
    )}
    </>
  );
}

function ApplicationModal({ entry, onClose }: { entry: EmailEntry, onClose: () => void }) {
  const { user, googleSignIn, getAccessToken } = useAuth();
  const [subject, setSubject] = useState(EMAIL_SUBJECT);
  const [body, setBody] = useState(EMAIL_BODY);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const renderAuthUI = () => (
    <div className="p-8 text-center bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
       <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
         <Mail className="w-8 h-8 text-blue-600" />
       </div>
       <h2 className="text-xl font-bold text-slate-900 mb-2">Connect Gmail</h2>
       <p className="text-slate-600 mb-6 text-sm">To send emails directly from your account, please sign in with Google.</p>
       
       <button onClick={async () => {
         try {
           setError('');
           await googleSignIn();
         } catch (err: any) {
           setError(err.message || 'Failed to sign in');
         }
       }} className="gsi-material-button w-full mb-4">
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper p-2 flex items-center gap-3 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            <div className="gsi-material-button-icon bg-white p-1 rounded-sm">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents font-medium text-slate-700">Sign in with Google</span>
          </div>
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
    </div>
  );

  const u8ToBase64 = (u8: Uint8Array) => {
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(u8[i]);
    }
    return window.btoa(binary);
  };

  const handleSend = async () => {
    const token = getAccessToken();
    if (!token) return;

    setSending(true);
    setError('');
    try {
      const boundary = "foo_bar_baz_boundary";
      const utf8Subject = `=?utf-8?B?${btoa(encodeURIComponent(subject).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1 as any)))}?=`;

      const parts = [];
      parts.push(`To: ${entry.mailId}`);
      parts.push(`Cc: bincyabraham2050@gmail.com`); // CC to self as requested
      parts.push(`Subject: ${utf8Subject}`);
      parts.push('MIME-Version: 1.0');
      parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"\r\n`);
      parts.push(`--${boundary}`);
      parts.push('Content-Type: text/plain; charset="utf-8"');
      parts.push('Content-Transfer-Encoding: 7bit\r\n');
      parts.push(body + '\r\n');

      for (const file of files) {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        parts.push(`--${boundary}`);
        parts.push(`Content-Type: ${file.type || 'application/octet-stream'}; name="${file.name}"`);
        parts.push(`Content-Disposition: attachment; filename="${file.name}"`);
        parts.push(`Content-Transfer-Encoding: base64\r\n`);
        parts.push(base64Data + '\r\n');
      }

      parts.push(`--${boundary}--`);

      const rawMessage = parts.join('\r\n');
      
      const encoder = new TextEncoder();
      const buffer = encoder.encode(rawMessage);
      
      const chunk = 32768;
      let binaryStr = "";
      for (let i = 0; i < buffer.length; i += chunk) {
        binaryStr += String.fromCharCode.apply(null, Array.from(buffer.subarray(i, i + chunk)));
      }
      
      const base64 = btoa(binaryStr);
      const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: base64url }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to send email');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error sending email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      {(!user || user.isAnonymous || !getAccessToken()) ? renderAuthUI() : (
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Send Application</h2>
              <p className="text-slate-500 text-sm mt-1">To: <span className="font-medium text-slate-700">{entry.hospitalName}</span> ({entry.mailId})</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto space-y-4">
            {success ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Email Sent!</h3>
                <p className="text-slate-500">Your application has been successfully delivered to {entry.hospitalName}.</p>
              </div>
            ) : (
              <>
                {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">{error}</div>}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attachments</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                    <input 
                      type="file" 
                      multiple 
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                       <Paperclip className="w-6 h-6 text-slate-400" />
                       <span className="text-sm text-slate-600 font-medium">Click to upload your CV, Cover Letter etc.</span>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 p-2 border border-slate-200 rounded-md text-sm">
                          <span className="text-slate-700 font-medium truncate max-w-[80%]">{f.name}</span>
                          <span className="text-slate-400 text-xs text-right whitespace-nowrap">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {!success && (
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={onClose} disabled={sending} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button 
                onClick={handleSend} 
                disabled={sending}
                className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Email</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
