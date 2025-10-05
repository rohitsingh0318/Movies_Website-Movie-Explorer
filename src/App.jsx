import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Film, Star, PlayCircle, X, ChevronLeft, ChevronRight,  Clapperboard, SlidersHorizontal } from "lucide-react";

const IMG_BASE = "https://image.tmdb.org/t/p/";
const POSTER_SIZE = "w342";

const CATEGORIES = [
  { key: "popular", label: "Popular" },
  { key: "top_rated", label: "Top Rated" },
  { key: "now_playing", label: "Now Playing" },
  { key: "upcoming", label: "Upcoming" },
];

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];


async function tmdb(path, params = {}) {
  const key = import.meta.env.VITE_TMDB_KEY;
  if (!key) throw new Error("Missing VITE_TMDB_KEY in .env");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  Object.entries({ api_key: key, include_adult: false, ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

function RatingBadge({ rating }) {
  const text = rating?.toFixed(1) ?? "–";
  return (
    <span className="badge bg-dark position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1">
      <Star size={14} /> {text}
    </span>
  );
}

function QualityTags({ vote }) {
  const tags = useMemo(() => {
    if (vote >= 8.5) return ["4K", "BluRay"];
    if (vote >= 7.5) return ["1080p", "WEB-DL"];
    if (vote >= 6.0) return ["720p"];
    return ["HD"];
  }, [vote]);
  return (
    <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
      {tags.map((t) => (
        <span key={t} className="badge bg-secondary">{t}</span>
      ))}
    </div>
  );
}

function MovieCard({ m, onOpen }) {
  return (
    <motion.div layout whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
      <div className="card h-100 bg-dark text-white" onClick={() => onOpen(m)} style={{ cursor: "pointer" }}>
        {m.poster_path ? (
          <img src={`${IMG_BASE}${POSTER_SIZE}${m.poster_path}`} className="card-img-top" alt={m.title || m.name} />
        ) : (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
            <Film size={40} />
          </div>
        )}
        <RatingBadge rating={m.vote_average || 0} />
        <QualityTags vote={m.vote_average || 0} />
        <div className="card-body">
          <h6 className="card-title">{m.title || m.name}</h6>
          <small className="text-muted">{(m.release_date || m.first_air_date || "").slice(0, 4)}</small>
        </div>
      </div>
    </motion.div>
  );
}

function Chips({ items, value, onChange }) {
  return (
    <div className="btn-group" role="group">
      {items.map((it) => (
        <button
          key={it.key || it.code}
          className={`btn btn-sm ${value === (it.key || it.code) ? "btn-light text-dark" : "btn-outline-light"}`}
          onClick={() => onChange(it.key || it.code)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function TopBar({ query, setQuery, onSubmit, category, setCategory, lang, setLang }) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <div className="d-flex align-items-center gap-2">
        <Clapperboard size={32} />
        <h1 className="h4 mb-0 fw-bold">Movie Explorer</h1>
      </div>

      <div className="d-flex flex-column flex-md-row gap-3 align-items-center">
        <Chips items={CATEGORIES} value={category} onChange={setCategory} />

        <select value={lang} onChange={(e) => setLang(e.target.value)} className="form-select form-select-sm w-auto">
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="d-flex">
          <input
            className="form-control form-control-sm me-2"
            type="search"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-sm btn-outline-light"><Search size={18} /></button>
        </form>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div className="d-flex justify-content-center align-items-center gap-3">
      <button className="btn btn-sm btn-dark" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft size={16}/> Prev
      </button>
      <span>Page {page} / {Math.min(totalPages, 500) || 1}</span>
      <button className="btn btn-sm btn-dark" onClick={() => onPage(Math.min((totalPages || 1), page + 1))} disabled={page >= Math.min(totalPages || 1, 500)}>
        Next <ChevronRight size={16}/>
      </button>
    </div>
  );
}

export default function MovieExplorer() {
  const [category, setCategory] = useState("popular");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lang, setLang] = useState("en");
  const [data, setData] = useState({ results: [], total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const p = { language: lang, page };
      const j = query.trim().length
        ? await tmdb("/search/movie", { ...p, query })
        : await tmdb(`/movie/${category}`, p);
      setData(j);
    } catch (e) {
      setError(e.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [category, page, lang]);

  return (
    <div className="bg-dark text-white min-vh-100">
      <header className="sticky-top bg-black p-3 border-bottom border-secondary">
        <div className="container">
          <TopBar query={query} setQuery={setQuery} onSubmit={() => { setPage(1); load(); }} category={category} setCategory={(c) => { setCategory(c); setPage(1); }} lang={lang} setLang={(l) => { setLang(l); setPage(1); }}/>
        </div>
      </header>

      <main className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <div key={i} className="col-6 col-sm-4 col-md-3"><div className="card bg-secondary" style={{ height: "300px" }}></div></div>)
            : (data.results || []).map((m) => (
                <div key={m.id} className="col-6 col-sm-4 col-md-3">
                  <MovieCard m={m} onOpen={() => {}} />
                </div>
              ))
          }
        </div>

        <div className="my-4">
          <Pagination page={page} totalPages={data.total_pages || 1} onPage={setPage} />
        </div>
      </main>

      <footer className="bg-black text-center text-muted py-3">
        Built for learning • Data from TMDB • © {new Date().getFullYear()}
      </footer>
      
    </div>
  );
}
