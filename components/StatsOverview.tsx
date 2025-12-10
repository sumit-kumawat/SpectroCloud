import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ProcessedUser } from '../types';
import { Users, UserCheck, UserX, Layers, Trophy, PieChart as PieChartIcon } from 'lucide-react';

interface StatsProps {
  users: ProcessedUser[];
}

const PIE_COLORS = ['#10B981', '#EF4444'];

export const DashboardStats: React.FC<StatsProps> = ({ users }) => {
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.length - activeCount;
  
  const uniqueTeamsCount = useMemo(() => {
    const teams = new Set<string>();
    users.forEach(u => u.teamNames.forEach(t => teams.add(t)));
    return teams.size;
  }, [users]);

  const allTeamsData = useMemo(() => {
      const teamCounts: Record<string, number> = {};
      users.forEach(u => u.teamNames.forEach(t => teamCounts[t] = (teamCounts[t] || 0) + 1));
      return Object.entries(teamCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
  }, [users]);

  const pieChartData = [
    { name: 'Active', value: activeCount },
    { name: 'Inactive', value: inactiveCount },
  ];

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, borderColor }: any) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${borderColor} dark:border-slate-700 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}>
      <div>
        <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${bgClass} dark:bg-slate-700/50 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mb-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={users.length} icon={Users} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50" borderColor="border-blue-100" />
        <StatCard title="Active Users" value={activeCount} icon={UserCheck} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50" borderColor="border-emerald-100" />
        <StatCard title="Inactive Users" value={inactiveCount} icon={UserX} colorClass="text-red-600 dark:text-red-400" bgClass="bg-red-50" borderColor="border-red-100" />
        <StatCard title="Total Teams" value={uniqueTeamsCount} icon={Layers} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-50" borderColor="border-purple-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-[350px]">
            <div className="flex items-center justify-between mb-5 shrink-0 pb-4 border-b border-gray-50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">Top Teams by Membership</h3>
                </div>
                <span className="text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-full">{allTeamsData.length} Teams</span>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-3">
                {allTeamsData.map((team, index) => {
                    const percent = (team.count / (allTeamsData[0]?.count || 1)) * 100;
                    return (
                        <div key={index} className="group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 truncate pr-4">{team.name}</span>
                                <span className="text-xs font-bold bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-600 dark:text-slate-300">{team.count} users</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full group-hover:from-indigo-400 group-hover:to-blue-400 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-[350px] flex flex-col">
             <div className="flex items-center gap-3 mb-4 shrink-0 pb-4 border-b border-gray-50 dark:border-slate-700/50">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <PieChartIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">User Status</h3>
            </div>
            <div className="flex justify-center gap-4 mb-4 text-xs font-bold">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>Active ({activeCount})
                </div>
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></span>Inactive ({inactiveCount})
                </div>
            </div>
            <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={pieChartData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={65} 
                            outerRadius={85} 
                            paddingAngle={5} 
                            dataKey="value" 
                            stroke="none"
                        >
                            {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} className="hover:opacity-80 transition-opacity" />)}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                color: '#1f2937'
                            }} 
                            itemStyle={{ fontWeight: 600 }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                    <span className="text-3xl font-extrabold text-gray-800 dark:text-white">{Math.round((activeCount / users.length) * 100)}%</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Active</span>
                </div>
            </div>
          </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:5px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background-color:#cbd5e1;border-radius:20px}.dark .custom-scrollbar::-webkit-scrollbar-thumb{background-color:#475569}.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover{background-color:#64748b}`}</style>
    </div>
  );
};