/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, FormEvent, useEffect } from 'react';
import { Search, Stethoscope, Loader2, MapPin, Mail, User, LogOut, FileCheck } from 'lucide-react';
import { Hospital } from './types';
import { HospitalCard } from './components/HospitalCard';
import { HospitalTable } from './components/HospitalTable';
import { PaginatedHospitalList } from './components/PaginatedHospitalList';
import { EmailTable } from './components/EmailTable';
import { AggregatedEmailTable } from './components/AggregatedEmailTable';
import { customEmails } from './data/emails';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './components/AuthProvider';
import { useApplicationCount } from './components/useApplicationCount';

export default function App() {
  const { user, loading: authLoading, loginWithName, logout } = useAuth();
  const applicationCount = useApplicationCount();
  const [activeTab, setActiveTab] = useState<'general' | 'ausbildung' | 'arbeitsagentur' | 'radiology' | 'emails' | 'onlyEmails'>('general');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<Hospital[]>([]);
  const [ausbildungResults, setAusbildungResults] = useState<Hospital[]>([]);
  const [arbeitsagenturResults, setArbeitsagenturResults] = useState<Hospital[]>([]);
  const [radiologyResults, setRadiologyResults] = useState<Hospital[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginName, setLoginName] = useState('');

  // Initial load to show something immediately
  useEffect(() => {
    handleSearch(new Event('submit') as unknown as FormEvent);
  }, []);

  // Background polling every 12 hours
  useEffect(() => {
    if (!searched) return;
    
    // Create an interval to poll for new results
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, page: 1 }),
        });
        
        if (response.status === 429 || response.status === 503) {
          // Stop polling if we hit rate limits or high demand
          clearInterval(interval);
          setError(response.status === 429 ? 'API Rate limit reached. Background polling disabled temporarily.' : 'Model high demand. Background polling disabled temporarily.');
          return;
        }
        
        if (response.ok) {
          const data = await JSON.parse(await response.text());
          const fetchedResults: Hospital[] = data.results || [];
          const fetchedAusbildungResults: Hospital[] = data.ausbildungResults || [];
          const fetchedArbeitsagenturResults: Hospital[] = data.arbeitsagenturResults || [];
          const fetchedRadiologyResults: Hospital[] = data.radiologyResults || [];
          
          setResults(prevResults => {
            const newResultsList = [...prevResults];
            let hasNew = false;
            
            // Check for new hospitals
            fetchedResults.forEach(newHospital => {
              const exists = prevResults.some(
                existing => 
                  existing.hospitalName.toLowerCase() === newHospital.hospitalName.toLowerCase() && 
                  existing.location.toLowerCase() === newHospital.location.toLowerCase()
              );
              
              if (!exists) {
                newResultsList.push({ ...newHospital, isNew: true });
                hasNew = true;
              }
            });
            
            return hasNew ? newResultsList : prevResults;
          });

          setAusbildungResults(prevResults => {
            const newResultsList = [...prevResults];
            let hasNew = false;
            fetchedAusbildungResults.forEach(newHospital => {
              const exists = prevResults.some(existing => existing.hospitalName.toLowerCase() === newHospital.hospitalName.toLowerCase());
              if (!exists) {
                newResultsList.push({ ...newHospital, isNew: true });
                hasNew = true;
              }
            });
            return hasNew ? newResultsList : prevResults;
          });

          setArbeitsagenturResults(prevResults => {
            const newResultsList = [...prevResults];
            let hasNew = false;
            fetchedArbeitsagenturResults.forEach(newHospital => {
              const exists = prevResults.some(existing => existing.hospitalName.toLowerCase() === newHospital.hospitalName.toLowerCase());
              if (!exists) {
                newResultsList.push({ ...newHospital, isNew: true });
                hasNew = true;
              }
            });
            return hasNew ? newResultsList : prevResults;
          });

          setRadiologyResults(prevResults => {
            const newResultsList = [...prevResults];
            let hasNew = false;
            fetchedRadiologyResults.forEach(newHospital => {
              const exists = prevResults.some(existing => existing.hospitalName.toLowerCase() === newHospital.hospitalName.toLowerCase());
              if (!exists) {
                newResultsList.push({ ...newHospital, isNew: true });
                hasNew = true;
              }
            });
            return hasNew ? newResultsList : prevResults;
          });
        }
      } catch (err) {
        console.error('Background polling error:', err);
      }
    }, 12 * 60 * 60 * 1000); // Poll every 12 hours

    return () => clearInterval(interval);
  }, [searched, query]);

  const fetchResults = async (targetPage: number, append: boolean = false) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, page: targetPage }),
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API Rate limit exceeded. Please wait a moment before trying again.');
        }
        if (response.status === 503) {
          throw new Error('The AI model is currently experiencing high demand. Please try again in a few moments.');
        }
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch data';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `API Error (${response.status}): ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await JSON.parse(await response.text());
      const newResults = data.results || [];
      const newAusbildungResults = data.ausbildungResults || [];
      const newArbeitsagenturResults = data.arbeitsagenturResults || [];
      const newRadiologyResults = data.radiologyResults || [];
      
      const checkDuplicates = (targetList: Hospital[], generalList: Hospital[], ausbildungList: Hospital[]) => {
        return targetList.map(h => {
          const namesMatch = (h1: Hospital, h2: Hospital) => h1.hospitalName.toLowerCase() === h2.hospitalName.toLowerCase();
          const inGeneral = generalList.some(gh => namesMatch(h, gh));
          const inAusbildung = ausbildungList.some(ah => namesMatch(h, ah));
          
          const dupSources = [];
          if (inGeneral) dupSources.push('General');
          if (inAusbildung) dupSources.push('Ausbildung');
          
          return dupSources.length > 0 ? { ...h, duplicateSources: dupSources } : h;
        });
      };
      
      if (append) {
        setResults(prev => [...prev, ...newResults]);
        setAusbildungResults(prev => [...prev, ...newAusbildungResults]);
        setArbeitsagenturResults(prev => [
          ...prev, 
          ...checkDuplicates(newArbeitsagenturResults, [...prev, ...newResults], [...ausbildungResults, ...newAusbildungResults])
        ]);
        setRadiologyResults(prev => [...prev, ...newRadiologyResults]);
      } else {
        setResults(newResults);
        setAusbildungResults(newAusbildungResults);
        setArbeitsagenturResults(checkDuplicates(newArbeitsagenturResults, newResults, newAusbildungResults));
        setRadiologyResults(newRadiologyResults);
      }
      
      setPage(targetPage);
      setSearched(true);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while finding openings. Please try again.');
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    await fetchResults(1, false);
    setLoading(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    setError('');
    await fetchResults(page + 1, true);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-10 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-sm text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight font-display">Klinik Sucher</h1>
            </div>
            <div className="flex items-center gap-4">
              {!authLoading && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 py-1.5 px-3 rounded-full text-sm font-bold shadow-inner">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>{applicationCount} Applied</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-full">
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full" />
                      ) : (
                        <User className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="text-sm font-medium text-slate-700">{user.displayName || 'User'}</span>
                    </div>
                    <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors ml-2" title="Log out">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : !authLoading && !user ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-full shadow-sm"
                >
                  Log In
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-100/50 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-3xl text-center mx-auto mb-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium tracking-wide mb-5">
              Germany Wide Search
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight font-display leading-tight">
              Find Your Nursing Ausbildung <br className="hidden md:block"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Opportunities
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Search for Pflegefachmann/Pflegefachfrau apprenticeships across hospitals and care homes in Germany. Discover verified contact details and direct openings.
            </p>
          </motion.div>
        </div>

        <div className="flex justify-center mb-10 relative z-10">
          <div className="inline-flex flex-wrap justify-center gap-2 bg-slate-200/50 p-2 rounded-2xl backdrop-blur-sm border border-slate-200 max-w-full">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 xl:px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'general' 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Search className="w-4 h-4" />
              General Openings
            </button>
            <button
              onClick={() => setActiveTab('ausbildung')}
              className={`px-4 xl:px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'ausbildung' 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Search className="w-4 h-4" />
              Ausbildung.de
            </button>
            <button
              onClick={() => setActiveTab('arbeitsagentur')}
              className={`px-4 xl:px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'arbeitsagentur' 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Search className="w-4 h-4" />
              Arbeitsagentur.de
            </button>
            <button
              onClick={() => setActiveTab('radiology')}
              className={`px-4 xl:px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'radiology' 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Search className="w-4 h-4" />
              Radiology
            </button>
            <div className="w-px bg-slate-300 hidden md:block"></div>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-4 xl:px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'emails' 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Directory
            </button>
            <button
              onClick={() => setActiveTab('onlyEmails')}
              className={`px-4 xl:px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'onlyEmails' 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Mail className="w-4 h-4" />
              Only Email ID
            </button>
          </div>
        </div>

        {activeTab === 'general' || activeTab === 'ausbildung' || activeTab === 'arbeitsagentur' || activeTab === 'radiology' ? (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl mx-auto mb-16 relative z-10"
            >
              <form onSubmit={handleSearch} className="relative shadow-xl shadow-blue-900/5 rounded-2xl overflow-hidden bg-white border border-gray-200/80 p-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
            <div className="flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by city, region, or explicit hospital name..."
                className="w-full px-4 py-3 focus:outline-none text-slate-900 placeholder:text-gray-400 text-lg bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-xl text-center font-medium mb-8 backdrop-blur-sm">
              {error}
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/50">
            <h3 className="text-lg font-medium text-slate-700">
              {searched && !loading && <span className="text-slate-900 font-semibold">{results.length + ausbildungResults.length + arbeitsagenturResults.length + radiologyResults.length}</span>}
              {searched && !loading && " Total Opportunities Found"}
              {loading && "Searching for matching institutions..."}
              {!searched && !loading && "Enter a location to discover opportunities."}
            </h3>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-gray-500"
              >
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p>Querying hospital databases and Ausbildung.de...</p>
              </motion.div>
            ) : results.length > 0 || ausbildungResults.length > 0 || arbeitsagenturResults.length > 0 || radiologyResults.length > 0 ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                
                {activeTab === 'general' && (
                  <PaginatedHospitalList 
                    hospitals={results}
                    sourceName="General Openings"
                    sourceIconColorClass="text-indigo-600"
                    sourceBgColorClass="bg-indigo-50"
                  />
                )}

                {activeTab === 'ausbildung' && (
                  <PaginatedHospitalList 
                    hospitals={ausbildungResults}
                    sourceName="Data from Ausbildung.de"
                    sourceIconColorClass="text-emerald-600"
                    sourceBgColorClass="bg-emerald-50"
                    badgeContent={<span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Source</span>}
                  />
                )}

                {activeTab === 'arbeitsagentur' && (
                  <PaginatedHospitalList 
                    hospitals={arbeitsagenturResults}
                    sourceName="Arbeitsagentur.de"
                    sourceIconColorClass="text-orange-600"
                    sourceBgColorClass="bg-orange-50"
                    badgeContent={<span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Source</span>}
                  />
                )}

                {activeTab === 'radiology' && (
                  <PaginatedHospitalList 
                    hospitals={radiologyResults}
                    sourceName="Radiology Ausbildung"
                    sourceIconColorClass="text-purple-600"
                    sourceBgColorClass="bg-purple-50"
                    badgeContent={<span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Radiology</span>}
                  />
                )}
                
                <div className="pt-10 text-center pb-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 px-8 py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2 mx-auto shadow-sm hover:shadow active:scale-95"
                  >
                    {loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load More Opportunities'}
                  </button>
                </div>
              </motion.div>
            ) : searched && !loading ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300"
              >
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Stethoscope className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 font-display mb-2">No hospitals found</h3>
                <p className="text-slate-500 max-w-md mx-auto">Try searching for a different city or region like "Berlin", "Munich", or "Bayern" to see available apprenticeship spots.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
          </div>
          </>
        ) : activeTab === 'emails' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 mb-8 text-center max-w-3xl mx-auto shadow-sm">
               <h3 className="text-2xl font-bold text-slate-800 font-display flex items-center justify-center gap-3">
                 <div className="bg-blue-100 p-2 rounded-xl">
                   <Mail className="w-6 h-6 text-blue-600" />
                 </div>
                 Direct Application Emails
               </h3>
               <p className="text-slate-600 mt-4 text-lg">A provided list of direct contact emails for nursing apprenticeship applications.</p>
            </div>
            <EmailTable emails={customEmails} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 mb-8 text-center max-w-3xl mx-auto shadow-sm">
               <h3 className="text-2xl font-bold text-slate-800 font-display flex items-center justify-center gap-3">
                 <div className="bg-blue-100 p-2 rounded-xl">
                   <Mail className="w-6 h-6 text-blue-600" />
                 </div>
                 Aggregated Email IDs
               </h3>
               <p className="text-slate-600 mt-4 text-lg">A unified list of all available email IDs found in your search results, color-coded by source.</p>
            </div>
            <AggregatedEmailTable 
              results={results} 
              ausbildungResults={ausbildungResults} 
              arbeitsagenturResults={arbeitsagenturResults}
              radiologyResults={radiologyResults} 
            />
          </motion.div>
        )}

        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowLoginModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-200"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <User className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center text-slate-900 mb-2 font-display">Welcome Back</h3>
                <p className="text-center text-slate-500 mb-6">Enter your name to track your applications</p>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (loginName.trim()) {
                    await loginWithName(loginName.trim());
                    setShowLoginModal(false);
                    setLoginName('');
                  }
                }}>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="E.g. Sarah Schmidt"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all mb-4"
                    autoFocus
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!loginName.trim()}
                      className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
