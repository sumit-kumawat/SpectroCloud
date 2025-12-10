import React, { useState, useMemo } from 'react';
import { ProcessedUser } from '../types';
import { 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Users, 
    X, Clock, Calendar, FileText, 
    Mail, Activity, Briefcase, Copy, Check
} from 'lucide-react';

interface UserTableProps {
  users: ProcessedUser[];
  onExport: (format: 'csv') => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProcessedUser; direction: 'asc' | 'desc' } | null>({
    key: 'lastSignIn', direction: 'desc'
  });
  const [selectedUser, setSelectedUser] = useState<ProcessedUser | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const itemsPerPage = 12;

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.teamNames.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const sortedUsers = useMemo(() => {
    let items = [...filteredUsers];
    if (sortConfig) {
      items.sort((a, b) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];
        if (sortConfig.key === 'lastSignIn' || sortConfig.key === 'createdAt') {
           if (valA === 'Never') valA = '1970-01-01';
           if (valB === 'Never') valB = '1970-01-01';
           valA = new Date(valA).getTime();
           valB = new Date(valB).getTime();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [filteredUsers, sortConfig]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const currentUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: keyof ProcessedUser) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const formatDate = (dateString: string) => {
      if (!dateString || dateString === 'Never') return 'Never';
      return new Date(dateString).toLocaleString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisibleButtons = 7;

    if (totalPages <= maxVisibleButtons) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }
    return pages;
  };

  const btnClass = "w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group";

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full animate-fade-in-up transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">User Directory</h2>
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">{filteredUsers.length}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* Export Group */}
            <button onClick={() => onExport('csv')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 rounded-lg transition-all shadow-sm" title="Export CSV">
                <FileText className="w-4 h-4" /> Export CSV
            </button>

            {/* Search */}
            <div className="relative w-full sm:w-64 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="Search users, emails, teams..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700 table-fixed">
            <thead className="bg-gray-50/80 dark:bg-slate-700/50 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="w-64 px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => requestSort('fullName')}>Name</th>
                <th className="w-72 px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => requestSort('email')}>Email</th>
                <th className="w-32 px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => requestSort('isActive')}>Status</th>
                <th className="w-56 px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => requestSort('lastSignIn')}>Last Sign In</th>
                <th className="w-auto px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Teams</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-50 dark:divide-slate-700/50">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group h-[88px] border-l-2 border-transparent hover:border-blue-500" onClick={() => setSelectedUser(user)}>
                  <td className="px-6 py-3 align-middle truncate" title={user.fullName}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-9 w-9 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-xs shadow-sm">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div className="ml-4 truncate font-semibold text-gray-800 dark:text-slate-100 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400">{user.fullName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-slate-400 align-middle truncate font-medium" title={user.email}>{user.email}</td>
                  <td className="px-6 py-3 whitespace-nowrap align-middle">
                    <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-md items-center gap-1.5 shadow-sm ${user.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 dark:text-slate-400 align-middle truncate font-mono text-xs">{formatDate(user.lastSignIn)}</td>
                  <td className="px-6 py-3 text-sm align-middle">
                    <div className="flex flex-col gap-1.5 justify-center h-full">
                       {user.teamNames.slice(0, 2).map((t, idx) => (
                          <span key={idx} title={t} className="inline-block w-fit bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800 truncate max-w-[200px] font-semibold">{t}</span>
                       ))}
                       {user.teamNames.length > 2 && <span className="text-[10px] text-gray-400 pl-1 font-medium">+{user.teamNames.length - 2} more...</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="bg-white dark:bg-slate-800 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium order-2 sm:order-1">
             Showing <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{sortedUsers.length}</span> entries
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={btnClass}><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={btnClass}><ChevronLeft className="h-4 w-4" /></button>
            
            <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((page, idx) => typeof page === 'number' ? (
                    <button 
                        key={idx} 
                        onClick={() => setCurrentPage(page)} 
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm ${
                            currentPage === page 
                            ? 'bg-blue-600 text-white shadow-blue-500/30' 
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {page}
                    </button>
                ) : <span key={idx} className="text-gray-400 px-1 font-bold">···</span>)}
            </div>

            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={btnClass}><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={btnClass}><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* User Details Modal - Neutral Design */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedUser(null)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-scale-in max-h-[90vh]">
             <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 z-20 transition-colors"><X className="w-5 h-5" /></button>
             
             {/* Left Sidebar - Neutral Profile */}
             <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-8 flex flex-col items-center text-center relative shrink-0">
                 <div className="h-32 w-32 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-5xl shadow-lg ring-4 ring-blue-50 dark:ring-slate-800 mb-6 shrink-0">
                     {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words w-full">{selectedUser.fullName}</h2>
                 <p className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 mb-8 mt-2 break-all w-full px-2">
                    <Mail className="w-3.5 h-3.5 shrink-0" />{selectedUser.email}
                 </p>
                 
                 <div className="w-full space-y-4">
                     <div className="text-center">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Account Status</p>
                         <span className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${selectedUser.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                             {selectedUser.isActive ? 'Active User' : 'Inactive User'}
                         </span>
                     </div>
                     <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                         <p className="flex items-center justify-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wide mb-1"><Clock className="w-3 h-3"/> Last Sign In</p>
                         <p className="font-mono text-sm text-gray-700 dark:text-slate-300">{formatDate(selectedUser.lastSignIn)}</p>
                     </div>
                     <div>
                         <p className="flex items-center justify-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wide mb-1"><Calendar className="w-3 h-3"/> Created On</p>
                         <p className="font-mono text-sm text-gray-700 dark:text-slate-300">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                     </div>
                 </div>
             </div>
             
             {/* Right Content - Details */}
             <div className="flex-1 p-8 bg-gray-50 dark:bg-slate-950/50 overflow-y-auto">
                 
                 {/* Teams Section */}
                 <div className="mb-8">
                     <div className="flex items-center gap-2 mb-4">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"><Briefcase className="w-4 h-4" /></div>
                         <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Team Membership ({selectedUser.teamNames.length})</h4>
                     </div>
                     
                     <div className="space-y-3">
                         {selectedUser.teamNames.length > 0 ? selectedUser.teamNames.map((team, i) => (
                             <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all group">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                                         <Users className="w-4 h-4" />
                                     </div>
                                     <p className="font-semibold text-sm text-gray-700 dark:text-slate-200 truncate" title={team}>{team}</p>
                                 </div>
                                 <button onClick={() => copyToClipboard(team)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Copy Team Name">
                                    {copiedId === team ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                 </button>
                             </div>
                         )) : (
                             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-white/50">
                                 <Users className="w-8 h-8 text-gray-300 dark:text-slate-600 mb-2" />
                                 <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">No teams assigned</p>
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Metadata Section (User ID REMOVED) */}
                 <div>
                     <div className="flex items-center gap-2 mb-4">
                         <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400"><Activity className="w-4 h-4" /></div>
                         <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">System Metadata</h4>
                     </div>
                     <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                         <div className="flex flex-col gap-4">
                             <div className="flex items-center justify-between py-1">
                                 <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Object Type</span>
                                 <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">SpectroUser</span>
                             </div>
                             <div className="w-full h-px bg-gray-100 dark:bg-slate-800"></div>
                             <div className="flex items-center justify-between py-1">
                                 <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Data Source</span>
                                 <span className="font-mono text-sm font-bold text-gray-700 dark:text-slate-300">Local Cache / API</span>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};