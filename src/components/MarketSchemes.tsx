import React, { useEffect, useState } from 'react';
import { IndianRupee, Landmark, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MarketPrice {
  crop: string;
  price: string;
  trend: 'up' | 'down' | 'stable';
}

interface Scheme {
  name: string;
  desc: string;
}

const MarketSchemes: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pricesRes, schemesRes] = await Promise.all([
          fetch('http://127.0.0.1:5000/api/market-prices'),
          fetch('http://127.0.0.1:5000/api/schemes')
        ]);
        const pricesData = await pricesRes.json();
        const schemesData = await schemesRes.json();
        
        if (pricesData.success) setPrices(pricesData.prices);
        if (schemesData.success) setSchemes(schemesData.schemes);
      } catch (e) {
        console.error("Failed to fetch market data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      {/* Market Prices */}
      <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white text-xl font-normal">Live Market Rates</h3>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Regional Average Prices</p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4 flex-1">
            {prices.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="text-white font-medium">{item.crop}</span>
                <div className="flex items-center gap-4">
                  <span className="text-white/80 font-mono text-sm">{item.price}</span>
                  {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-healthy-emerald" />}
                  {item.trend === 'down' && <TrendingDown className="w-4 h-4 text-danger-red" />}
                  {item.trend === 'stable' && <Minus className="w-4 h-4 text-white/40" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Government Schemes */}
      <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-warning-amber/10 rounded-xl flex items-center justify-center">
            <Landmark className="w-5 h-5 text-warning-amber" />
          </div>
          <div>
            <h3 className="text-white text-xl font-normal">Govt Support & Schemes</h3>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Active Agricultural Subsidies</p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-warning-amber border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {schemes.map((scheme, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="text-white font-medium mb-1">{scheme.name}</h4>
                <p className="text-white/60 text-sm leading-relaxed">{scheme.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketSchemes;
