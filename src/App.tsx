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
  const [results, setResults] = useState<Hospital[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Initial load to show something immediately
  useEffect(() => {
    handleSearch(new Event('submit') as unknown as FormEvent);
  }, []);

  // Background polling every 10 seconds
  useEffect(() => {
    if (!searched) return;
    
    // Create an interval to poll for new results
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        
        if (response.ok) {
          const data = await JSON.parse(await response.text());
          const fetchedResults: Hospital[] = data.results || [];
          
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
        }
      } catch (err) {
        console.error('Background polling error:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [searched, query]);

  const handleSearch = async (e: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
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
      setResults(data.results || []);
      setSearched(true);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while finding openings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Klinik Sucher</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-2xl text-center mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Find Nursing Ausbildung Openings
          </h2>
          <p className="text-lg text-gray-600">
            Search for Pflegefachmann/Pflegefachfrau apprenticeships across hospitals in Germany. We provide direct contact details to help you apply.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative shadow-sm rounded-xl overflow-hidden bg-white border border-gray-200">
            <div className="flex items-center px-4 py-1">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by city, region, or hospital name..."
                className="w-full px-4 py-4 focus:outline-none text-gray-900 placeholder:text-gray-400 text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>
        </div>

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium mb-6">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {searched && !loading && `${results.length} Hospitals Found`}
              {loading && "Searching hospitals..."}
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
                <p>Querying hospital database...</p>
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div key="results" className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {Object.entries(
                  results.reduce((acc, hospital) => {
                    // Try to extract just the city name if it has commas like "Berlin, Germany"
                    const city = hospital.location.split(',')[0].trim();
                    if (!acc[city]) acc[city] = [];
                    acc[city].push(hospital);
                    return acc;
                  }, {} as Record<string, Hospital[]>)
                )
                .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
                .map(([city, cityHospitals]) => (
                  <div key={city} className="space-y-4">
                    <h4 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      {city}
                    </h4>
                    <div className="space-y-4">
                      {cityHospitals.map((hospital, i) => (
                        <HospitalCard key={i} hospital={hospital} index={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : searched && !loading ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-xl border border-gray-200"
              >
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No hospitals found</h3>
                <p className="text-gray-500 mt-1">Try searching for a different city or region like "Berlin" or "Bayern".</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
