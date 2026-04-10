import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;


const DARK_SKIES = {
  Clear:        "linear-gradient(160deg, #0b1a3e 0%, #1a2d6b 40%, #0d3b72 70%, #0a1f4e 100%)",
  Clouds:       "linear-gradient(160deg, #1a1f2e 0%, #2d3a52 40%, #3a4a60 70%, #1e2840 100%)",
  Rain:         "linear-gradient(160deg, #0a1220 0%, #0f2040 40%, #162b52 70%, #0a1830 100%)",
  Drizzle:      "linear-gradient(160deg, #0a1220 0%, #0f2040 40%, #162b52 70%, #0a1830 100%)",
  Thunderstorm: "linear-gradient(160deg, #0a0818 0%, #1a0e38 40%, #120826 70%, #060412 100%)",
  Snow:         "linear-gradient(160deg, #101828 0%, #1a2c48 40%, #1e3558 70%, #0e1e36 100%)",
  Mist:         "linear-gradient(160deg, #111820 0%, #1e2d3a 40%, #253545 70%, #111f2a 100%)",
  default:      "linear-gradient(160deg, #0b1a3e 0%, #1a2d6b 40%, #0d3b72 70%, #0a1f4e 100%)",
};

const LIGHT_SKY = "linear-gradient(160deg, #e8eef7 0%, #dce6f5 40%, #cfdaee 70%, #e2eaf6 100%)";
const LIGHT_SKIES = {
  Clear: LIGHT_SKY, Clouds: LIGHT_SKY, Rain: LIGHT_SKY, Drizzle: LIGHT_SKY,
  Thunderstorm: LIGHT_SKY, Snow: LIGHT_SKY, Mist: LIGHT_SKY, default: LIGHT_SKY,
};

//Glass tint clr
const DARK_GLASS = {
  Clear:        { accent: "#fbbf24", tint: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)" },
  Clouds:       { accent: "#94a3b8", tint: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.18)" },
  Rain:         { accent: "#60a5fa", tint: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.18)" },
  Drizzle:      { accent: "#60a5fa", tint: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.18)" },
  Thunderstorm: { accent: "#a78bfa", tint: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.18)" },
  Snow:         { accent: "#7dd3fc", tint: "rgba(125,211,252,0.08)", border: "rgba(125,211,252,0.18)" },
  Mist:         { accent: "#94a8bc", tint: "rgba(148,168,188,0.08)", border: "rgba(148,168,188,0.18)" },
  default:      { accent: "#60a5fa", tint: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.18)" },
};

const LIGHT_GLASS = {
  Clear:        { accent: "#d97706", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
  Clouds:       { accent: "#475569", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
  Rain:         { accent: "#2563eb", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
  Drizzle:      { accent: "#2563eb", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
  Thunderstorm: { accent: "#7c3aed", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
  Snow:         { accent: "#0284c7", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
  Mist:         { accent: "#4b5563", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
  default:      { accent: "#2563eb", tint: "rgba(255,255,255,0.5)",  border: "rgba(255,255,255,0.75)" },
};

const ICONS = {
  "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "🌤️", "03d": "☁️", "03n": "☁️",
  "04d": "🌥️", "04n": "🌥️", "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️", "50d": "🌫️", "50n": "🌫️",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fmtTime = (unix, tz) => {
  const d = new Date((unix + tz) * 1000);
  return d.toUTCString().slice(17, 22);
};

export default function WeatherApp() {
  const [query, setQuery]       = useState("");
  const [weather, setWeather]   = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [unit, setUnit]         = useState("metric");
  const [tick, setTick]         = useState(new Date());
  const [lastCity, setLastCity] = useState("");
  const [isDark, setIsDark]     = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (lastCity) fetchWeather(lastCity);
    
  }, [unit]);

  const weatherKey = weather?.weather[0]?.main || "default";

  const sky  = isDark ? (DARK_SKIES[weatherKey]  || DARK_SKIES.default)  : (LIGHT_SKIES[weatherKey]  || LIGHT_SKIES.default);
  const g    = isDark ? (DARK_GLASS[weatherKey]  || DARK_GLASS.default)  : (LIGHT_GLASS[weatherKey]  || LIGHT_GLASS.default);

  const tu = unit === "metric" ? "°C" : "°F";
  const wu = unit === "metric" ? "m/s" : "mph";

  const fetchWeather = useCallback(async (city) => {
    if (!city.trim()) return;
    setLastCity(city);
    setLoading(true);
    setError("");
    try {
      const q = encodeURIComponent(city);
      const [wR, fR] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&units=${unit}&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${q}&units=${unit}&appid=${API_KEY}`),
      ]);
      if (!wR.ok) {
        const err = await wR.json();
        throw new Error(err.message || "City not found.");
      }
      const [wD, fD] = await Promise.all([wR.json(), fR.json()]);
      setWeather(wD);
      setForecast(fD.list.filter((_, i) => i % 8 === 0).slice(0, 5));
    } catch (e) {
      setError(e.message);
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const go = () => fetchWeather(query);

  //Glass card style
  const glassCard = isDark
    ? {
        background: `rgba(255,255,255,0.07)`,
        border: `1px solid ${g.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
      }
    : {
        background: g.tint,
        border: `1px solid ${g.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.5)`,
      };

  const glassSearch = isDark
    ? {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
      }
    : {
        background: g.tint,
        border: `1px solid ${g.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
      };

  const glassToggle = isDark
    ? {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#e8edf5",
      }
    : {
        background: g.tint,
        border: `1px solid ${g.border}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: g.accent,
      };

  const statTile = isDark
    ? { background: "rgba(255,255,255,0.05)", borderTop: "1px solid rgba(255,255,255,0.06)" }
    : { background: "rgba(255,255,255,0.3)",  borderTop: "1px solid rgba(255,255,255,0.5)"  };

  const fcCard = isDark
    ? {
        background: "rgba(255,255,255,0.07)",
        border: `1px solid ${g.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }
    : {
        background: g.tint,
        border: `1px solid ${g.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      };

  return (
    <div className={`app ${isDark ? "dk" : "lk"}`} style={{ background: sky }}>
      
      <div className="orb orb1" style={{ background: isDark ? `radial-gradient(circle, ${g.accent}22 0%, transparent 70%)` : `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)` }} />
      <div className="orb orb2" style={{ background: isDark ? `radial-gradient(circle, ${g.accent}12 0%, transparent 70%)` : `radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)` }} />

      <div className="container">

        {/* header */}
        <div className="hdr">
          <div className="hdr-brand">
            <span className="hdr-brand-icon">🌤️</span>
            <span className="hdr-brand-name">Weather</span>
          </div>
          <div className="hdr-right">
            <div className="hdr-time">
              <span className="hdr-clock" style={{ color: isDark ? "rgba(255,255,255,0.85)" : g.accent }}>
                {tick.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="hdr-date">
                {tick.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
            <button className="toggle-btn" style={glassToggle} onClick={() => setIsDark(d => !d)}>
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* search bar */}
        <div className="search-bar" style={glassSearch}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go()}
            placeholder="Search for a city…"
          />
          <button
            className="search-btn"
            style={{ background: g.accent }}
            onClick={go}
            disabled={loading}
          >
            {loading ? "···" : "Search"}
          </button>
        </div>

        {/* unit toggle */}
        <div className="unit-row">
          {[["metric", "°C"], ["imperial", "°F"]].map(([u, label]) => {
            const active = unit === u;
            const style = active
              ? {
                  background: g.accent,
                  color: "#fff",
                  border: `1.5px solid ${g.accent}`,
                  fontWeight: 600,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }
              : isDark
                ? {
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(232,237,245,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }
                : {
                    background: "rgba(255,255,255,0.4)",
                    color: "rgba(15,23,42,0.5)",
                    border: "1px solid rgba(255,255,255,0.65)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  };
            return (
              <button key={u} className="unit-btn" style={style} onClick={() => setUnit(u)}>
                {label}
              </button>
            );
          })}
        </div>

        
        {error && (
          <div className="error-box" style={
            isDark
              ? {
                  background: "rgba(220,55,55,0.12)",
                  border: "1px solid rgba(220,55,55,0.25)",
                  color: "#fca5a5",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }
              : {
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(220,55,55,0.3)",
                  color: "#dc2626",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }
          }>
            {error}
          </div>
        )}

        {/* loader */}
        {loading && (
          <div className="loader">
            <div className="spinner" style={{ borderTopColor: g.accent }} />
          </div>
        )}

        {/* weather card */}
        {!loading && weather && (
          <>
            <div className="card up" style={glassCard}>
              <div className="hero-top">
                <div>
                  <div className="city-name">{weather.name}</div>
                  <div className="country">{weather.sys.country}</div>
                  <span
                    className="cond-pill"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
                      color: g.accent,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : g.border}`,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    {ICONS[weather.weather[0].icon] || "🌡"}&nbsp;{weather.weather[0].description}
                  </span>
                </div>
                <div className="hero-right">
                  <div className="big-temp" style={{ color: g.accent }}>
                    {Math.round(weather.main.temp)}
                    <span className="temp-unit">{tu}</span>
                  </div>
                  <div className="feels">Feels like {Math.round(weather.main.feels_like)}{tu}</div>
                  <div className="hilo">↑{Math.round(weather.main.temp_max)}{tu}&nbsp; ↓{Math.round(weather.main.temp_min)}{tu}</div>
                </div>
              </div>

              <div
                className="card-divider"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)" }}
              />

              <div className="stats-grid">
                {[
                  { label: "Humidity",   val: `${weather.main.humidity}%`,                    icon: "💧" },
                  { label: "Wind",       val: `${weather.wind.speed} ${wu}`,                  icon: "💨" },
                  { label: "Pressure",   val: `${weather.main.pressure} hPa`,                 icon: "🌡️" },
                  { label: "Visibility", val: `${(weather.visibility / 1000).toFixed(1)} km`, icon: "👁️" },
                  { label: "Clouds",     val: `${weather.clouds.all}%`,                       icon: "☁️" },
                  { label: "Wind dir",   val: `${weather.wind.deg}°`,                         icon: "🧭" },
                  { label: "Sunrise",    val: fmtTime(weather.sys.sunrise, weather.timezone), icon: "🌅" },
                  { label: "Sunset",     val: fmtTime(weather.sys.sunset,  weather.timezone), icon: "🌇" },
                ].map(s => (
                  <div key={s.label} className="stat-tile" style={statTile}>
                    <span className="stat-icon">{s.icon}</span>
                    <span className="stat-label">{s.label}</span>
                    <span className="stat-val" style={{ color: g.accent }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* forecast */}
            {forecast.length > 0 && (
              <div className="fc-section up2">
                <div className="fc-title">5-day forecast</div>
                <div className="fc-row">
                  {forecast.map((d, i) => (
                    <div key={i} className="fc-card" style={fcCard}>
                      <div className="fc-day">{DAYS[new Date(d.dt * 1000).getDay()]}</div>
                      <div className="fc-icon">{ICONS[d.weather[0].icon] || "🌡"}</div>
                      <div className="fc-temp" style={{ color: g.accent }}>{Math.round(d.main.temp)}{tu}</div>
                      <div className="fc-desc">{d.weather[0].main}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

       
        {!loading && !weather && !error && (
          <div className="empty">
            <span className="empty-icon">🌤️</span>
            <div className="empty-title">Search for a city</div>
            <div className="empty-sub">Current conditions · 5-day forecast · Wind & humidity</div>
          </div>
        )}

      </div>
    </div>
  );
}
