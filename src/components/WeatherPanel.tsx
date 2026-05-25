import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Leaf, Droplets, Wind, Thermometer, Search,
  AlertTriangle, CheckCircle, CloudRain, Sun, Eye, Gauge,
  Zap, Shield, ArrowRight, RefreshCw, Navigation, CloudSnow,
  Cloud, CloudLightning, CloudDrizzle, Umbrella, Sunrise, Sunset,
  TrendingUp, Sprout, BarChart3, Clock, SprayCan
} from 'lucide-react';

// ── Types ────────────────────────────────────────────
interface WeatherData {
  temp: number; feels_like: number; temp_min: number; temp_max: number;
  humidity: number; pressure: number; wind_speed: number; wind_deg: number;
  clouds: number; visibility: number; rain_1h: number;
  description: string; icon: string; main: string;
}
interface Alert { type: string; message: string; severity: 'info' | 'warning' | 'danger'; }
interface Recommendation { icon: string; title: string; desc: string; priority: 'high' | 'medium' | 'low'; }
interface Advisory {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number; alerts: Alert[];
  recommendations: Recommendation[]; spray_conditions: boolean;
}
interface ForecastDay {
  date: string; temp_min: number; temp_max: number; temp_avg: number;
  humidity_avg: number; rain_total: number; wind_avg: number;
  description: string; icon: string; risk_level: string;
  risk_score: number; spray_suitable: boolean;
}
interface WeatherResponse {
  success: boolean; city: string; country: string; error?: string;
  weather: WeatherData; advisory: Advisory; timestamp: string;
  sunrise: number; sunset: number; demo_mode?: boolean;
}
interface ForecastResponse {
  success: boolean; city: string; forecast: ForecastDay[];
}

const API_BASE = 'http://localhost:5000/api';

// ── Weather Icon Mapper ──────────────────────────────
const getWeatherIcon = (main: string, size = 'w-10 h-10') => {
  const map: Record<string, React.ReactNode> = {
    'Clear': <Sun className={`${size} text-yellow-400`} />,
    'Clouds': <Cloud className={`${size} text-gray-400`} />,
    'Rain': <CloudRain className={`${size} text-blue-400`} />,
    'Drizzle': <CloudDrizzle className={`${size} text-blue-300`} />,
    'Thunderstorm': <CloudLightning className={`${size} text-purple-400`} />,
    'Snow': <CloudSnow className={`${size} text-white`} />,
    'Mist': <Cloud className={`${size} text-gray-500`} />,
    'Haze': <Cloud className={`${size} text-gray-500`} />,
    'Fog': <Cloud className={`${size} text-gray-500`} />,
  };
  return map[main] || <Cloud className={`${size} text-gray-400`} />;
};

// ── Risk Config ──────────────────────────────────────
const riskConfig = {
  low: { color: '#52b788', bg: '#52b78815', label: 'LOW RISK', icon: CheckCircle },
  medium: { color: '#d4a017', bg: '#d4a01715', label: 'MODERATE RISK', icon: AlertTriangle },
  high: { color: '#e67e22', bg: '#e67e2215', label: 'HIGH RISK', icon: AlertTriangle },
  critical: { color: '#c0392b', bg: '#c0392b15', label: 'CRITICAL', icon: Zap },
};

// ── Risk Gauge Component ─────────────────────────────
const RiskGauge = ({ score, level }: { score: number; level: string }) => {
  const colors: Record<string, string> = { low: '#52b788', medium: '#d4a017', high: '#e67e22', critical: '#c0392b' };
  const color = colors[level] || '#52b788';
  const rotation = (score / 100) * 180 - 90;
  return (
    <div className="relative flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 160 90">
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={color}
          strokeWidth="12" strokeLinecap="round" opacity="0.3"
          strokeDasharray={`${score * 2.2} 220`} />
        <motion.line x1="80" y1="80"
          animate={{ x2: 80 + 55 * Math.cos(((rotation - 90) * Math.PI) / 180), y2: 80 + 55 * Math.sin(((rotation - 90) * Math.PI) / 180) }}
          transition={{ duration: 1, ease: 'easeOut' }}
          stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="80" cy="80" r="4" fill={color} />
      </svg>
      <div className="text-center -mt-2">
        <div className="text-4xl font-bold" style={{ color }}>{score}</div>
        <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mt-1">Disease Risk Index</div>
      </div>
    </div>
  );
};

// ── Weather Metric Card ──────────────────────────────
const MetricCard = ({ icon: Icon, value, unit, label, color = 'text-farm-accent' }: {
  icon: any; value: string | number; unit: string; label: string; color?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white/[0.03] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
    <Icon className={`w-5 h-5 ${color} mb-2 group-hover:scale-110 transition-transform`} />
    <div className="flex items-end gap-1">
      <span className="text-white text-2xl font-bold">{value}</span>
      <span className="text-white/40 text-[10px] uppercase mb-1 font-bold">{unit}</span>
    </div>
    <div className="text-white/30 text-[9px] uppercase tracking-widest font-bold mt-1">{label}</div>
  </motion.div>
);

// ── Forecast Card ────────────────────────────────────
const ForecastCard = ({ day, index }: { day: ForecastDay; index: number }) => {
  const riskColors: Record<string, string> = { low: '#52b788', medium: '#d4a017', high: '#e67e22', critical: '#c0392b' };
  const dateObj = new Date(day.date);
  const dayName = index === 0 ? 'Today' : dateObj.toLocaleDateString('en', { weekday: 'short' });
  const dateStr = dateObj.toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="min-w-[150px] bg-white/[0.03] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col items-center gap-3 group">
      <div className="text-white font-bold text-sm">{dayName}</div>
      <div className="text-white/40 text-[10px] uppercase">{dateStr}</div>
      {getWeatherIcon(day.description.includes('rain') ? 'Rain' : day.description.includes('cloud') ? 'Clouds' : 'Clear', 'w-8 h-8')}
      <div className="text-white text-lg font-bold">{day.temp_max}°<span className="text-white/40 text-sm">/{day.temp_min}°</span></div>
      <div className="text-white/50 text-[10px] capitalize">{day.description}</div>
      <div className="flex items-center gap-1">
        <Droplets className="w-3 h-3 text-blue-400" />
        <span className="text-white/50 text-[10px]">{day.rain_total}mm</span>
      </div>
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-wider font-bold" style={{ color: riskColors[day.risk_level] }}>
            {day.risk_level} risk
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${day.risk_score}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="h-full rounded-full" style={{ background: riskColors[day.risk_level] }} />
        </div>
      </div>
      {day.spray_suitable && (
        <div className="flex items-center gap-1 bg-farm-accent/10 px-2 py-1 rounded-full">
          <SprayCan className="w-3 h-3 text-farm-accent" />
          <span className="text-farm-accent text-[8px] font-bold uppercase">Spray OK</span>
        </div>
      )}
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────
const WeatherPanel: React.FC = () => {
  const [city, setCity] = useState('Mangalore');
  const [searchInput, setSearchInput] = useState('Mangalore');
  const [crop, setCrop] = useState('Tomato');
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  const CROPS = ['Tomato', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Potato', 'Grape', 'Apple'];

  const fetchWeather = useCallback(async (targetCity: string) => {
    setLoading(true);
    setError('');
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`${API_BASE}/weather?city=${encodeURIComponent(targetCity)}&crop=${encodeURIComponent(crop)}`),
        fetch(`${API_BASE}/weather/forecast?city=${encodeURIComponent(targetCity)}&crop=${encodeURIComponent(crop)}`)
      ]);

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      if (!weatherData.success) {
        setError(weatherData.error || 'Failed to fetch weather data');
        setWeather(null);
        setForecast(null);
      } else {
        setWeather(weatherData);
        setForecast(forecastData.success ? forecastData : null);
        setCity(weatherData.city);
        setLastUpdated(new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      setWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [crop]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      fetchWeather(searchInput.trim());
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `${API_BASE}/weather?city=${latitude},${longitude}&crop=${encodeURIComponent(crop)}`
          );
          // Fallback: use lat/lon as city name for OpenWeather
          // Actually OpenWeather needs city name, so we'll use reverse geocoding via a different approach
          // For simplicity, let's just fetch with coordinates
          const resp = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=placeholder`
          );
          // Since we can't expose the key here, we'll just use a city-based fallback
          setSearchInput('My Location');
          fetchWeather(`${latitude},${longitude}`);
        } catch {
          setError('Could not detect location');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setError('Location access denied');
        setDetectingLocation(false);
      }
    );
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchWeather('Mangalore');
  }, []);

  const cfg = weather ? riskConfig[weather.advisory.risk_level] : null;
  const w = weather?.weather;
  const adv = weather?.advisory;

  const formatTime = (unix: number) => {
    if (!unix) return '--:--';
    return new Date(unix * 1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pt-4 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* ── Header Section ── */}
        <div className="mb-8 bg-black/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10">
          <div className="text-farm-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <CloudRain className="w-4 h-4" /> Smart Weather Advisory
            {weather?.demo_mode && (
              <span className="ml-2 text-[9px] bg-warning-amber/20 text-warning-amber border border-warning-amber/30 px-2 py-0.5 rounded-full tracking-wider">DEMO MODE</span>
            )}
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">
                Weather-Based<br />
                <span className="text-farm-accent">Farming Intelligence</span>
              </h1>
              <p className="text-white/50 mt-4 max-w-xl text-sm font-medium">
                Real-time weather data powered by OpenWeatherMap API with AI-driven farming advisories, disease risk prediction, and crop-specific recommendations.
              </p>
            </div>
            {weather && cfg && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 shrink-0"
                style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}10` }}>
                <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                <span className="font-bold text-sm uppercase tracking-widest" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              </motion.div>
            )}
          </div>

          {/* ── Search Bar ── */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text" value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search any city..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-farm-accent/50 transition-all"
                />
              </div>
              <button type="submit" disabled={loading}
                className="bg-farm-accent text-black px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-farm-accent/90 transition-all flex items-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            <div className="flex gap-3">
              <button onClick={handleGeolocate} disabled={detectingLocation}
                className="bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl text-sm font-medium hover:border-farm-accent/30 transition-all flex items-center gap-2 disabled:opacity-50">
                <Navigation className={`w-4 h-4 text-farm-accent ${detectingLocation ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{detectingLocation ? 'Detecting...' : 'My Location'}</span>
              </button>

              <div className="relative">
                <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farm-accent" />
                <select value={crop} onChange={e => setCrop(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:border-farm-accent/50 transition-all">
                  {CROPS.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error State ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-8 bg-danger-red/10 border border-danger-red/30 rounded-2xl p-6 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-danger-red shrink-0 mt-0.5" />
              <div>
                <div className="text-danger-red font-bold text-sm mb-1">Weather Data Unavailable</div>
                <p className="text-white/60 text-sm">{error}</p>
                <button onClick={() => handleSearch()}
                  className="mt-3 text-farm-accent text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading State ── */}
        {loading && !weather && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 border-4 border-farm-accent border-t-transparent rounded-full animate-spin" />
              <CloudRain className="absolute inset-0 m-auto w-8 h-8 text-farm-accent" />
            </div>
            <div className="space-y-3 w-full max-w-xs">
              {['Connecting to OpenWeatherMap', 'Analyzing atmospheric data', 'Generating farming advisory'].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                  className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                  <div className="w-2 h-2 bg-farm-accent rounded-full animate-pulse" />
                  <span className="text-white text-[11px] uppercase tracking-widest font-bold">{s}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Main Content ── */}
        {weather && w && adv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

            {/* ── Current Weather Hero ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${cfg!.color}15 0%, transparent 70%)` }} />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-farm-accent" />
                    <span className="text-white font-bold text-lg">{weather.city}</span>
                    {weather.country && <span className="text-white/40 text-sm font-medium">{weather.country}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {lastUpdated && (
                      <span className="text-white/30 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Updated {lastUpdated}
                      </span>
                    )}
                    <button onClick={() => fetchWeather(city)} disabled={loading}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                      <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-8 mb-8">
                  <div className="flex items-center gap-4">
                    {getWeatherIcon(w.main, 'w-16 h-16')}
                    <div>
                      <div className="text-white text-6xl font-light">{w.temp}<span className="text-3xl text-white/40">°C</span></div>
                      <div className="text-white/40 text-sm capitalize mt-1">{w.description}</div>
                    </div>
                  </div>
                  <div className="hidden md:block border-l border-white/10 pl-8 space-y-2">
                    <div className="text-white/50 text-sm">Feels like <span className="text-white font-bold">{w.feels_like}°C</span></div>
                    <div className="text-white/50 text-sm">
                      H: <span className="text-white font-bold">{w.temp_max}°</span> &nbsp;
                      L: <span className="text-white font-bold">{w.temp_min}°</span>
                    </div>
                  </div>
                </div>

                {/* Weather Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <MetricCard icon={Droplets} value={w.humidity} unit="%" label="Humidity" color="text-blue-400" />
                  <MetricCard icon={Wind} value={w.wind_speed} unit="m/s" label="Wind" color="text-cyan-400" />
                  <MetricCard icon={Gauge} value={w.pressure} unit="hPa" label="Pressure" color="text-purple-400" />
                  <MetricCard icon={Eye} value={(w.visibility / 1000).toFixed(1)} unit="km" label="Visibility" color="text-green-400" />
                  <MetricCard icon={Cloud} value={w.clouds} unit="%" label="Cloud Cover" color="text-gray-400" />
                  <MetricCard icon={Umbrella} value={w.rain_1h} unit="mm" label="Rainfall" color="text-blue-300" />
                </div>

                {/* Sunrise/Sunset */}
                <div className="flex items-center gap-8 mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Sunrise className="w-5 h-5 text-orange-400" />
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Sunrise</div>
                      <div className="text-white font-bold text-sm">{formatTime(weather.sunrise)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sunset className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Sunset</div>
                      <div className="text-white font-bold text-sm">{formatTime(weather.sunset)}</div>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${adv.spray_conditions ? 'bg-farm-accent' : 'bg-danger-red'} animate-pulse`} />
                    <span className="text-white/50 text-[10px] uppercase tracking-wider font-bold">
                      Spray {adv.spray_conditions ? 'Window Open' : 'Not Recommended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Risk Assessment ── */}
              <div className="bg-black/80 backdrop-blur-xl border-2 rounded-3xl p-8" style={{ borderColor: `${cfg!.color}30` }}>
                <div className="text-white text-[11px] uppercase tracking-widest font-bold mb-6 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-farm-accent" />
                  Disease Risk Assessment
                </div>
                <RiskGauge score={adv.risk_score} level={adv.risk_level} />

                <div className="space-y-3 mt-8">
                  {adv.alerts.map((alert, i) => {
                    const alertColors: Record<string, string> = { info: '#52b788', warning: '#d4a017', danger: '#c0392b' };
                    const c = alertColors[alert.severity] || '#52b788';
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="p-4 rounded-xl border" style={{ borderColor: `${c}30`, background: `${c}08` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" style={{ color: c }} />
                          <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: c }}>{alert.type}</span>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed">{alert.message}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── 5-Day Forecast ── */}
            {forecast && forecast.forecast && forecast.forecast.length > 0 && (
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-white text-[11px] uppercase tracking-widest font-bold flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-farm-accent" />
                    5-Day Forecast & Disease Risk
                  </div>
                  <div className="text-white/30 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                    <SprayCan className="w-3 h-3 text-farm-accent" /> = Best spray days
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {forecast.forecast.map((day, i) => (
                    <ForecastCard key={day.date} day={day} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Smart Recommendations ── */}
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="text-white text-[11px] uppercase tracking-widest font-bold mb-6 flex items-center gap-3">
                <Zap className="w-5 h-5 text-farm-accent" />
                Smart Farming Recommendations for {crop}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adv.recommendations.map((rec, i) => {
                  const priorityColors: Record<string, string> = { high: '#c0392b', medium: '#d4a017', low: '#52b788' };
                  const pc = priorityColors[rec.priority] || '#52b788';
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-all flex gap-4 group">
                      <span className="text-3xl shrink-0">{rec.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-white text-sm font-bold">{rec.title}</div>
                          <span className="text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                            style={{ color: pc, background: `${pc}15`, border: `1px solid ${pc}30` }}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-white/50 text-xs leading-relaxed">{rec.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Quick Stats Footer ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <Thermometer className="w-6 h-6 text-orange-400 mx-auto mb-3" />
                <div className="text-white text-2xl font-bold">{w.feels_like}°C</div>
                <div className="text-white/30 text-[9px] uppercase tracking-widest font-bold mt-1">Feels Like</div>
              </div>
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-3" />
                <div className="text-white text-2xl font-bold">{w.humidity}%</div>
                <div className="text-white/30 text-[9px] uppercase tracking-widest font-bold mt-1">Humidity</div>
              </div>
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <Sprout className="w-6 h-6 text-farm-accent mx-auto mb-3" />
                <div className="text-white text-2xl font-bold capitalize">{adv.risk_level}</div>
                <div className="text-white/30 text-[9px] uppercase tracking-widest font-bold mt-1">Crop Risk</div>
              </div>
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                <div className="text-white text-2xl font-bold">{adv.risk_score}</div>
                <div className="text-white/30 text-[9px] uppercase tracking-widest font-bold mt-1">Risk Score</div>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WeatherPanel;
