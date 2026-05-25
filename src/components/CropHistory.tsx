import React, { useEffect, useState } from 'react';
import { History, ShieldAlert, ShieldCheck } from 'lucide-react';

interface HistoryItem {
  id: number;
  crop: string;
  disease: string;
  severity: string;
  date: string;
}

const CropHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('fs_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('http://127.0.0.1:5000/api/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setHistory(data.history);
        }
      } catch (e) {
        console.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
          <History className="w-5 h-5 text-white/80" />
        </div>
        <div>
          <h3 className="text-white text-xl font-normal">Diagnostic History</h3>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Previous Scan Reports</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {loading ? (
           <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
        ) : history.length === 0 ? (
           <div className="text-center py-10 text-white/40 text-sm">No diagnostic history found.</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                {item.severity === 'none' || item.severity === 'low' ? (
                  <ShieldCheck className="w-8 h-8 text-healthy-emerald" />
                ) : (
                  <ShieldAlert className={`w-8 h-8 ${item.severity === 'critical' ? 'text-danger-red' : 'text-warning-amber'}`} />
                )}
                <div>
                  <h4 className="text-white font-medium">{item.crop}</h4>
                  <p className="text-white/60 text-xs">{item.disease}</p>
                </div>
              </div>
              <div className="text-right">
                 <span className="block text-white/40 text-[10px] font-mono">{item.date}</span>
                 <span className={`text-[10px] uppercase font-bold tracking-widest ${item.severity === 'none' ? 'text-healthy-emerald' : item.severity === 'critical' ? 'text-danger-red' : 'text-warning-amber'}`}>
                   {item.severity} Risk
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CropHistory;
