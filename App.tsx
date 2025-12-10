import React, { useState, useEffect } from 'react';
import { fetchAndSyncUsers, loadLocalData } from './services/spectroService';
import { getLastSyncTime } from './services/dbService';
import { ProcessedUser } from './types';
import { UserTable } from './components/UserTable';
import { DashboardStats } from './components/StatsOverview';
import { Toast, ToastType } from './components/Toast';
import { RefreshCw, AlertCircle, Terminal, ShieldCheck, X, Info, Globe, Moon, Sun, Search } from 'lucide-react';

const App: React.FC = () => {
  const [users, setUsers] = useState<ProcessedUser[]>([]);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
      if (typeof window !== 'undefined') return localStorage.getItem('theme') === 'dark';
      return false;
  });

  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [isDarkMode]);

  useEffect(() => {
    const init = async () => {
      const cachedUsers = await loadLocalData();
      const lastSync = getLastSyncTime();
      const now = new Date();
      const oneHour = 60 * 60 * 1000;

      if (cachedUsers.length > 0) {
        setUsers(cachedUsers);
        setIsInitialLoad(false); 
        
        // Only sync if cache is older than 1 hour
        if (!lastSync || (now.getTime() - lastSync.getTime() > oneHour)) {
           performSync(true);
        }
      } else {
        // No cache, force sync
        performSync(false); 
      }
    };
    init();
    
    // Auto sync every 1 hour (3600000 ms)
    const intervalId = setInterval(() => performSync(true), 3600000); 
    return () => clearInterval(intervalId);
  }, []);

  const performSync = async (silent: boolean = false) => {
    if (!silent) { setIsSyncing(true); setError(null); }
    try {
      const data = await fetchAndSyncUsers(() => {});
      if (silent && data.length !== users.length) {
         setToast({ message: 'Database updated successfully with new records.', type: 'info' });
      }
      setUsers(data);
      if (!silent && data.length > 0) {
         setToast({ message: 'Sync completed successfully.', type: 'success' });
      }
    } catch (err: any) {
      if (users.length === 0 && !silent) {
         let msg = err.message || 'Failed to fetch users.';
         if (msg.includes('Failed to fetch')) msg = 'Connection Error: Unable to reach the Backend API.';
         setError(msg);
      } else if (!silent) {
         setToast({ message: 'Sync failed. Please check connection.', type: 'error' });
      }
    } finally {
      if (!silent) { setIsSyncing(false); setIsInitialLoad(false); }
    }
  };

  const exportData = (format: 'csv') => {
    if (users.length === 0) return;
    const headers = ['ID', 'Full Name', 'Email', 'Status', 'Last Sign In', 'Roles', 'Teams', 'Created At'];
    const rows = users.map(u => [u.id, `"${u.fullName}"`, u.email, u.isActive ? 'Active' : 'Inactive', u.lastSignIn, `"${u.roleNames.join(', ')}"`, `"${u.teamNames.join(', ')}"`, u.createdAt]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    link.download = `spectro_users_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setToast({ message: `Exported ${users.length} records to CSV`, type: 'success' });
  };

  const logoSrc = isDarkMode 
    ? "http://helixit.bmc.com/assets/images/logo-dark.png" 
    : "http://helixit.bmc.com/assets/images/logo-light.png";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-slate-100 pb-24 transition-colors duration-300">
      <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-5">
             <img src={logoSrc} alt="BMC" className="h-11 w-auto" />
             <div className="h-6 w-px bg-gray-200 dark:bg-slate-600 hidden sm:block"></div>
             <div>
                <h1 className="text-gray-900 dark:text-white text-lg font-bold tracking-tight hidden sm:block">Identity Console</h1>
                <div className="hidden sm:flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Developed by</span>
                    <a href="mailto:Sumit_Kumawat@bmc.com" className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-md font-bold border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors">Sumit Kumawat</a>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            <button onClick={() => setShowInfoModal(true)} className="p-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="About"><Info className="w-5 h-5" /></button>
            <div className="h-6 w-px bg-gray-200 dark:bg-slate-600 mx-2"></div>
            <button onClick={() => performSync(false)} disabled={isSyncing} className="flex items-center text-sm font-semibold px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500 transition-all shadow-sm"><RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin text-blue-600' : 'text-gray-500 dark:text-slate-400'}`} />{isSyncing ? 'Refreshing...' : 'Refresh Data'}</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {isInitialLoad && users.length === 0 ? (
           <div className="space-y-8 animate-pulse">
              <div className="grid grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>)}</div>
              <div className="h-[600px] bg-gray-200 dark:bg-slate-800 rounded-2xl w-full"></div>
           </div>
        ) : (
           <>
              {error && users.length === 0 && (
                <div className="mb-8 p-6 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl flex flex-col sm:flex-row gap-5 animate-fade-in shadow-sm">
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full h-fit w-fit shrink-0"><AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-red-900 dark:text-red-300">Connection Failed</h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-red-100 dark:border-red-900 shadow-sm inline-block">
                          <p className="text-xs font-mono text-gray-800 dark:text-slate-200 flex items-center"><Terminal className="w-3 h-3 mr-2" />node server.js</p>
                      </div>
                    </div>
                </div>
              )}

              {users.length > 0 ? (
                <div className="animate-fade-in">
                  <DashboardStats users={users} />
                  <UserTable users={users} onExport={exportData} />
                </div>
              ) : !error && (
                 <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                        <div className="bg-gray-100 dark:bg-slate-800 p-8 rounded-full mb-6"><Search className="w-16 h-16 text-gray-300 dark:text-slate-600" /></div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Data Found</h2>
                        <button onClick={() => performSync(false)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl mt-4 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Retry Sync</button>
                 </div>
              )}
           </>
        )}
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowInfoModal(false)}></div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full relative z-10 p-8 text-center animate-scale-in border border-gray-100 dark:border-slate-700">
                <button onClick={() => setShowInfoModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"><X className="w-4 h-4 text-gray-500 dark:text-slate-400" /></button>
                <div className="p-6 bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 flex justify-center">
                    <img src={logoSrc} alt="BMC Helix" className="h-16 w-auto" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Spectro Cloud Identity Console</h2>
                <div className="w-full space-y-4 text-left mt-8">
                    <a href="https://www.helixops.ai" target="_blank" className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-slate-600 group">
                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Company</p>
                            <p className="font-bold text-sm text-gray-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">BMC Helix Inc.</p>
                        </div>
                    </a>

                    <a href="mailto:HelixDevSupport@BMC.com" className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-slate-600 group">
                        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Managed By</p>
                            <p className="font-bold text-sm text-gray-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">Helix-Dev-Support</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;