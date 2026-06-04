/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, FormEvent, useEffect } from 'react';
import { Search, Stethoscope, Loader2, MapPin } from 'lucide-react';
import { Hospital } from './types';
import { HospitalCard } from './components/HospitalCard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<Hospital[]>([]);
  const [ausbildungResults, setAusbildungResults] = useState<Hospital[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

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
        
        if (response.status === 429) {
          // Stop polling if we hit rate limits
          clearInterval(interval);
          setError('API Rate limit reached. Background polling disabled temporarily.');
          return;
        }
        
        if (response.ok) {
          const data = await JSON.parse(await response.text());
          const fetchedResults: Hospital[] = data.results || [];
          const fetchedAusbildungResults: Hospital[] = data.ausbildungResults || [];
          
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
      
      if (append) {
        setResults(prev => [...prev, ...newResults]);
        setAusbildungResults(prev => [...prev, ...newAusbildungResults]);
      } else {
        setResults(newResults);
        setAusbildungResults(newAusbildungResults);
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
          <div className="flex items-center gap-3 h-16">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-sm text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-display">Klinik Sucher</h1>
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
              {searched && !loading && <span className="text-slate-900 font-semibold">{results.length + ausbildungResults.length}</span>}
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
            ) : results.length > 0 || ausbildungResults.length > 0 ? (
              <motion.div key="results" className="grid grid-cols-1 lg:grid-cols-2 gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Left Column: General Openings */}
                <div className="space-y-10">
                  <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 pb-2 sticky top-20 z-10">
                    <h3 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
                       General Openings
                    </h3>
                  </div>
                  {Object.entries(
                    results.reduce((acc, hospital) => {
                      const city = hospital.location.split(',')[0].trim();
                      if (!acc[city]) acc[city] = [];
                      acc[city].push(hospital);
                      return acc;
                    }, {} as Record<string, Hospital[]>)
                  )
                  .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
                  .map(([city, cityHospitals]: [string, Hospital[]]) => (
                    <div key={`general-${city}`} className="space-y-6">
                      <h4 className="text-2xl font-bold text-slate-900 pb-2 flex items-center gap-3 font-display">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        {city}
                      </h4>
                      <div className="grid grid-cols-1 gap-6">
                        {cityHospitals.map((hospital, i) => (
                          <HospitalCard key={`gen-${i}`} hospital={hospital} index={i} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Ausbildung.de Openings */}
                <div className="space-y-10">
                  <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 pb-2 sticky top-20 z-10">
                    <h3 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Source</span>
                      Data from Ausbildung.de
                    </h3>
                  </div>
                  {Object.entries(
                    ausbildungResults.reduce((acc, hospital) => {
                      const city = hospital.location.split(',')[0].trim();
                      if (!acc[city]) acc[city] = [];
                      acc[city].push(hospital);
                      return acc;
                    }, {} as Record<string, Hospital[]>)
                  )
                  .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
                  .map(([city, cityHospitals]: [string, Hospital[]]) => (
                    <div key={`aus-${city}`} className="space-y-6">
                      <h4 className="text-2xl font-bold text-slate-900 pb-2 flex items-center gap-3 font-display">
                        <div className="bg-emerald-50 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                        </div>
                        {city}
                      </h4>
                      <div className="grid grid-cols-1 gap-6">
                        {cityHospitals.map((hospital, i) => (
                          <HospitalCard key={`aus-${i}`} hospital={hospital} index={i} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="col-span-1 lg:col-span-2 pt-10 text-center pb-8">
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
      </main>
    </div>
  );
}
