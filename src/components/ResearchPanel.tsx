'use client';

import { useState } from 'react';
import { useJson } from '@/lib/useJson';
import { getBookById } from '@/lib/bible-books';

interface Paper {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  citationCount?: number;
  authors?: { name: string }[];
  url?: string;
}

interface PubMedResult {
  id: string;
  title: string;
  authors: string[];
  year: string;
  journal: string;
  url: string;
}

interface OpenLibResult {
  key: string;
  title: string;
  authors: string[];
  year: number | null;
  subjects: string[];
  url: string;
  pages: number | null;
  publisher: string | null;
}

interface CrossRefResult {
  doi: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string;
  abstract: string | null;
  url: string;
}

type Tab = 'ai' | 'scholar' | 'pubmed' | 'books' | 'crossref' | 'openalex' | 'archive' | 'europepmc' | 'googlebooks' | 'core' | 'wiki' | 'perseus' | 'wikidata' | 'sacredtexts' | 'resources';

export default function ResearchPanel({ book, chapter, verse }: { book: number; chapter: number; verse: number }) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [pubmed, setPubmed] = useState<PubMedResult[]>([]);
  const [openlib, setOpenlib] = useState<OpenLibResult[]>([]);
  const [crossref, setCrossref] = useState<CrossRefResult[]>([]);
  const [openalex, setOpenalex] = useState<any[]>([]);
  const [archive, setArchive] = useState<any[]>([]);
  const [europepmc, setEuropepmc] = useState<any[]>([]);
  const [googlebooks, setGooglebooks] = useState<any[]>([]);
  const [coreResults, setCoreResults] = useState<any[]>([]);
  const [wikiResults, setWikiResults] = useState<any[]>([]);
  const [perseusResults, setPerseusResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [failedTab, setFailedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('ai');

  const bookInfo = getBookById(book);
  const bookName = bookInfo?.name || '';
  const ref = `${bookName} ${chapter}:${verse}`;
  const searchQuery = `Bible ${bookName} chapter ${chapter} verse ${verse}`;

  const fetchScholar = async (tab: Tab) => {
    if (papers.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' biblical scholarship')}&source=semanticscholar&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPapers(data.data || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchPubMed = async (tab: Tab) => {
    if (pubmed.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' archaeology')}&source=pubmed&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPubmed(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchOpenLib = async (tab: Tab) => {
    if (openlib.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(bookName + ' bible commentary')}&source=openlibrary&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOpenlib(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchCrossRef = async (tab: Tab) => {
    if (crossref.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' biblical exegesis')}&source=crossref&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCrossref(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchOpenAlex = async (tab: Tab) => {
    if (openalex.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' biblical theology')}&source=openalex&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOpenalex(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchArchive = async (tab: Tab) => {
    if (archive.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(bookName + ' bible commentary')}&source=internetarchive&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setArchive(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchEuropePMC = async (tab: Tab) => {
    if (europepmc.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' biblical studies')}&source=europepmc&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEuropepmc(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchGoogleBooks = async (tab: Tab) => {
    if (googlebooks.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' bible commentary')}&source=googlebooks&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGooglebooks(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchCore = async (tab: Tab) => {
    if (coreResults.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' biblical theology')}&source=core&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoreResults(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchWiki = async (tab: Tab) => {
    if (wikiResults.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery + ' Bible')}&source=wikipedia&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWikiResults(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  const fetchPerseus = async (tab: Tab) => {
    if (perseusResults.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(searchQuery)}&source=perseus&limit=5`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPerseusResults(data.results || []);
    } catch { setFailedTab(tab); }
    setLoading(false);
  };

  // Load a tab's results when it is opened (each fetcher skips work it has already done)
  const runFetch = (tab: Tab) => {
    setFailedTab(null);
    if (tab === 'scholar') fetchScholar(tab);
    if (tab === 'pubmed') fetchPubMed(tab);
    if (tab === 'books') fetchOpenLib(tab);
    if (tab === 'crossref') fetchCrossRef(tab);
    if (tab === 'openalex') fetchOpenAlex(tab);
    if (tab === 'archive') fetchArchive(tab);
    if (tab === 'europepmc') fetchEuropePMC(tab);
    if (tab === 'googlebooks') fetchGoogleBooks(tab);
    if (tab === 'core') fetchCore(tab);
    if (tab === 'wiki') fetchWiki(tab);
    if (tab === 'perseus') fetchPerseus(tab);
  };

  // AI research queries
  const aiQueries = [
    { label: 'Archaeological evidence', query: `Find archaeological evidence and discoveries related to ${ref} in the Bible` },
    { label: 'Scholarly analysis', query: `What do biblical scholars say about ${ref}? Include different perspectives and interpretations` },
    { label: 'Historical context', query: `What is the historical context of ${ref}? What was happening in the ancient Near East at this time?` },
    { label: 'Linguistic analysis', query: `Linguistic analysis of key terms in ${ref} including original Hebrew or Greek meanings` },
    { label: 'Textual criticism', query: `What are the textual variants and manuscript differences for ${ref}?` },
    { label: 'Geography', query: `Where did the events of ${ref} take place? Describe the geographical and archaeological setting` },
    { label: 'Patristic commentary', query: `What did early Church Fathers say about ${ref}? Include commentaries from Augustine, Chrysostom, Jerome, and others` },
    { label: 'Intertextuality', query: `How does ${ref} connect to other passages in the Bible? Show thematic and literary connections` },
  ];

  const aiLinks = (query: string) => [
    { name: 'Perplexity', url: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}` },
    { name: 'ChatGPT', url: `https://chat.openai.com/?q=${encodeURIComponent(query)}` },
    { name: 'Claude', url: `https://claude.ai/new?q=${encodeURIComponent(query)}` },
    { name: 'Google Scholar', url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}` },
    { name: 'JSTOR', url: `https://www.jstor.org/action/doBasicSearch?Query=${encodeURIComponent(query)}` },
  ];

  // External resource links
  const resourceLinks = [
    { name: 'OpenAlex', url: `https://openalex.org/works?search=${encodeURIComponent(searchQuery + ' biblical')}`, desc: 'Open scholarly metadata' },
    { name: 'CrossRef', url: `https://search.crossref.org/?q=${encodeURIComponent(searchQuery + ' biblical')}&from_ui=yes`, desc: 'DOI-linked articles' },
    { name: 'Bible Hub', url: `https://biblehub.com/${bookName?.toLowerCase().replace(/ /g, '_')}/${chapter}-${verse}.htm`, desc: 'Commentaries & lexicon' },
    { name: 'Blue Letter Bible', url: `https://www.blueletterbible.org/search/search.cfm?Criteria=${encodeURIComponent(ref)}&t=KJV`, desc: 'Interlinear & word study' },
    { name: 'NET Bible', url: `https://netbible.org/bible/${bookName?.replace(/ /g, '+')}+${chapter}`, desc: 'Translation notes' },
    { name: 'STEP Bible', url: `https://www.stepbible.org/?q=reference=${encodeURIComponent(ref)}|version=ESV`, desc: 'Multi-resource lookup' },
    { name: 'Mechon Mamre', url: 'https://www.mechon-mamre.org/', desc: 'Hebrew Bible (Tanakh)' },
    { name: 'Perseus Digital Library', url: `https://www.perseus.tufts.edu/hopper/searchresults?q=${encodeURIComponent(bookName || '')}`, desc: 'Greek & Latin texts' },
    { name: 'INTF (NT Manuscripts)', url: 'https://ntvmr.uni-muenster.de/home', desc: 'NT manuscript transcripts' },
    { name: 'Logeion', url: `https://logeion.uchicago.edu/`, desc: 'Greek & Latin lexicon' },
    { name: 'Internet Archive', url: `https://archive.org/search?query=${encodeURIComponent(searchQuery + ' biblical commentary')}`, desc: 'Historical commentaries (free)' },
    { name: 'Dead Sea Scrolls', url: `https://www.deadseascrolls.org.il/explore-the-archive`, desc: 'DSS digital archive' },
    { name: 'Tyndale House', url: `https://tyndalehouselibrary.com/`, desc: 'Cambridge biblical research' },
    { name: 'ORCID (scholars)', url: `https://orcid.org/orcid-search/search?searchQuery=${encodeURIComponent('biblical ' + (bookName || ''))}`, desc: 'Find biblical scholars' },
    { name: 'Aleppo Codex', url: 'https://www.aleppocodex.org/', desc: 'Oldest complete Hebrew Bible' },
    { name: 'Early Church Texts', url: 'https://www.earlychurchtexts.com/', desc: 'Patristic writings' },
    { name: 'Sefaria', url: `https://www.sefaria.org/search?q=${encodeURIComponent(bookName + ' ' + chapter + ':' + verse)}&tab=text`, desc: 'Jewish texts & commentaries (Rashi, Rambam)' },
    { name: 'ETCBC (BHSA)', url: 'https://shebanq.ancient-data.org/hebrew/query', desc: 'Hebrew syntax database (Eep Talstra Centre)' },
    { name: 'Codex Sinaiticus', url: 'https://codexsinaiticus.org/en/', desc: '4th-century Greek manuscript (complete NT)' },
    { name: 'Textus Receptus', url: `https://www.textusreceptusbibles.com/`, desc: 'Greek NT underlying the KJV' },
    { name: 'Bible Odyssey', url: `https://www.bibleodyssey.org/en/tools/search-results?q=${encodeURIComponent(bookName || '')}`, desc: 'Society of Biblical Literature resources' },
    { name: 'ATLA Religion DB', url: `https://www.atla.com/research-tool/?searchText=${encodeURIComponent(searchQuery + ' biblical')}`, desc: 'Premier religion & theology index' },
    { name: 'Bible Gateway', url: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV,NIV,ESV`, desc: 'Multi-version comparison' },
    { name: 'Kata Biblon', url: `https://en.katabiblon.com/us/index.php?text=LXX&book=${bookName?.replace(/ /g, '+')}`, desc: 'Greek-English Septuagint (LXX)' },
  ];

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 bg-parchment-800 rounded-lg p-1 overflow-x-auto">
        {([['ai', 'AI'], ['scholar', 'Scholar'], ['pubmed', 'PubMed'], ['books', 'Books'], ['googlebooks', 'Google'], ['crossref', 'CrossRef'], ['openalex', 'OpenAlex'], ['archive', 'Archive'], ['europepmc', 'EuroPMC'], ['core', 'CORE'], ['wiki', 'Wiki'], ['perseus', 'Perseus'], ['wikidata', 'Wikidata'], ['sacredtexts', 'Sacred'], ['resources', 'Links']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); runFetch(key); }}
            className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${activeTab === key ? 'bg-gold-600 text-parchment-950 font-semibold' : 'text-parchment-400 hover:text-parchment-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {failedTab === activeTab && (
        <p className="text-sm text-parchment-400">
          Couldn&apos;t reach this service just now.{' '}
          <button onClick={() => runFetch(activeTab)} className="underline underline-offset-2 hover:text-parchment-100">Try again</button>
        </p>
      )}

      {/* AI Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-3">
          <p className="text-xs text-parchment-500">Ask AI about <strong className="text-gold-400">{ref}</strong>:</p>
          {aiQueries.map((q, i) => (
            <div key={i} className="bg-parchment-800 rounded-lg p-3">
              <p className="text-sm text-parchment-200 mb-2">{q.label}</p>
              <div className="flex flex-wrap gap-1">
                {aiLinks(q.query).map(link => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded-sm bg-parchment-700 text-parchment-300 hover:bg-gold-600 hover:text-parchment-950 transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Semantic Scholar Tab */}
      {activeTab === 'scholar' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching Semantic Scholar…</div>}
          {!loading && failedTab !== activeTab && papers.length === 0 && <div className="text-parchment-500 text-sm">No papers found. Try a broader search.</div>}
          {papers.map((p, i) => (
            <a
              key={i}
              href={p.url || `https://www.semanticscholar.org/paper/${p.paperId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <h4 className="text-sm text-parchment-100 font-medium leading-tight">{p.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                {p.year && <span>{p.year}</span>}
                {p.citationCount !== undefined && <span>{p.citationCount} citations</span>}
              </div>
              {p.authors && p.authors.length > 0 && (
                <p className="text-xs text-parchment-500 mt-1">{p.authors.slice(0, 3).map(a => a.name).join(', ')}{p.authors.length > 3 ? ' et al.' : ''}</p>
              )}
              {p.abstract && (
                <p className="text-xs text-parchment-400 mt-2 line-clamp-3">{p.abstract}</p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* PubMed Tab */}
      {activeTab === 'pubmed' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching PubMed…</div>}
          {!loading && failedTab !== activeTab && pubmed.length === 0 && <div className="text-parchment-500 text-sm">No PubMed results found.</div>}
          {pubmed.map((p, i) => (
            <a
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <h4 className="text-sm text-parchment-100 font-medium leading-tight">{p.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                {p.year && <span>{p.year}</span>}
                {p.journal && <span>{p.journal}</span>}
              </div>
              {p.authors.length > 0 && (
                <p className="text-xs text-parchment-500 mt-1">{p.authors.slice(0, 3).join(', ')}{p.authors.length > 3 ? ' et al.' : ''}</p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* OpenLibrary Books Tab */}
      {activeTab === 'books' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching OpenLibrary…</div>}
          {!loading && failedTab !== activeTab && openlib.length === 0 && <div className="text-parchment-500 text-sm">No books found.</div>}
          {openlib.map((b, i) => (
            <a
              key={i}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <h4 className="text-sm text-parchment-100 font-medium leading-tight">{b.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                {b.year && <span>{b.year}</span>}
                {b.publisher && <span>{b.publisher}</span>}
                {b.pages && <span>{b.pages}p</span>}
              </div>
              {b.authors.length > 0 && (
                <p className="text-xs text-parchment-500 mt-1">{b.authors.slice(0, 3).join(', ')}{b.authors.length > 3 ? ' et al.' : ''}</p>
              )}
              {b.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {b.subjects.slice(0, 4).map((s, j) => (
                    <span key={j} className="text-xs px-1.5 py-0.5 rounded-sm bg-parchment-700 text-parchment-400">{s}</span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* CrossRef Tab */}
      {activeTab === 'crossref' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching CrossRef…</div>}
          {!loading && failedTab !== activeTab && crossref.length === 0 && <div className="text-parchment-500 text-sm">No articles found.</div>}
          {crossref.map((c, i) => (
            <a
              key={i}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <h4 className="text-sm text-parchment-100 font-medium leading-tight">{c.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                {c.year && <span>{c.year}</span>}
                {c.journal && <span>{c.journal}</span>}
              </div>
              {c.authors.length > 0 && (
                <p className="text-xs text-parchment-500 mt-1">{c.authors.slice(0, 3).join(', ')}{c.authors.length > 3 ? ' et al.' : ''}</p>
              )}
              {c.abstract && (
                <p className="text-xs text-parchment-400 mt-2 line-clamp-2">{c.abstract}</p>
              )}
              {c.doi && (
                <p className="text-xs text-parchment-600 mt-1 font-mono">DOI: {c.doi}</p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* OpenAlex Tab */}
      {activeTab === 'openalex' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching OpenAlex…</div>}
          {!loading && failedTab !== activeTab && openalex.length === 0 && <div className="text-parchment-500 text-sm">No results found.</div>}
          {openalex.map((item: any, i: number) => (
            <a
              key={i}
              href={item.url || item.id}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <h4 className="text-sm text-parchment-100 font-medium leading-tight">{item.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                {item.year && <span>{item.year}</span>}
                {item.citationCount > 0 && <span>{item.citationCount} citations</span>}
                {item.journal && <span>{item.journal}</span>}
              </div>
              {item.authors?.length > 0 && (
                <p className="text-xs text-parchment-500 mt-1">{item.authors.slice(0, 3).join(', ')}{item.authors.length > 3 ? ' et al.' : ''}</p>
              )}
              {item.abstract && (
                <p className="text-xs text-parchment-400 mt-2 line-clamp-3">{item.abstract}</p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Internet Archive Tab */}
      {activeTab === 'archive' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching Internet Archive…</div>}
          {!loading && failedTab !== activeTab && archive.length === 0 && <div className="text-parchment-500 text-sm">No results found.</div>}
          {archive.map((item: any, i: number) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <h4 className="text-sm text-parchment-100 font-medium leading-tight">{item.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                {item.year && <span>{item.year}</span>}
                {item.mediatype && <span>{item.mediatype}</span>}
              </div>
              {item.authors?.length > 0 && (
                <p className="text-xs text-parchment-500 mt-1">{item.authors.slice(0, 3).join(', ')}</p>
              )}
              {item.description && (
                <p className="text-xs text-parchment-400 mt-2 line-clamp-2">{item.description}</p>
              )}
              {item.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.subjects.slice(0, 4).map((s: string, j: number) => (
                    <span key={j} className="text-xs px-1.5 py-0.5 rounded-sm bg-parchment-700 text-parchment-400">{s}</span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Europe PMC Tab */}
      {activeTab === 'europepmc' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching Europe PMC…</div>}
          {!loading && failedTab !== activeTab && europepmc.length === 0 && <div className="text-parchment-500 text-sm">No results found.</div>}
          {europepmc.map((item: any, i: number) => (
            <a
              key={i}
              href={item.url || item.id}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <h4 className="text-sm text-parchment-100 font-medium leading-tight">{item.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                {item.year && <span>{item.year}</span>}
                {item.citationCount > 0 && <span>{item.citationCount} citations</span>}
                {item.journal && <span>{item.journal}</span>}
              </div>
              {item.authors?.length > 0 && (
                <p className="text-xs text-parchment-500 mt-1">{item.authors.slice(0, 3).join(', ')}{item.authors.length > 3 ? ' et al.' : ''}</p>
              )}
              {item.abstract && (
                <p className="text-xs text-parchment-400 mt-2 line-clamp-3">{item.abstract}</p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Google Books Tab */}
      {activeTab === 'googlebooks' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {loading && <div className="text-parchment-500 text-sm animate-pulse">Searching Google Books…</div>}
          {!loading && failedTab !== activeTab && googlebooks.length === 0 && <div className="text-parchment-500 text-sm">No results found.</div>}
          {googlebooks.map((item: any, i: number) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <div className="flex gap-3">
                {item.thumbnail && (
                  // Small remote covers; next/image would route them through the image optimiser for no gain
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" loading="lazy" className="w-10 h-14 object-cover rounded-sm shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-parchment-100 font-medium leading-tight">{item.title}</h4>
                  <div className="flex gap-3 mt-1 text-xs text-parchment-500">
                    {item.year && <span>{item.year}</span>}
                    {item.pages && <span>{item.pages}pp</span>}
                    {item.averageRating && <span>{item.averageRating}</span>}
                  </div>
                  {item.authors?.length > 0 && (
                    <p className="text-xs text-parchment-500 mt-1">{item.authors.slice(0, 3).join(', ')}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-parchment-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* CORE Tab */}
      {activeTab === 'core' && (
        <div className="space-y-2">
          <p className="text-xs text-parchment-500 mb-2">Open-access research from <strong className="text-gold-400">CORE</strong> — the world&apos;s largest aggregator of open-access papers</p>
          {loading && <p className="text-sm text-parchment-500 animate-pulse">Searching CORE...</p>}
          {coreResults.map((item: any, i: number) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
              className="block p-3 bg-parchment-800 rounded-lg hover:bg-parchment-700 transition-colors group">
              <p className="text-sm text-parchment-200 font-medium group-hover:text-gold-400 mb-1">{item.title}</p>
              <div className="flex items-center gap-2 text-xs text-parchment-500 flex-wrap">
                {item.authors?.slice(0, 3).join(', ') && <span>{item.authors.slice(0, 3).join(', ')}</span>}
                {item.year && <span>• {item.year}</span>}
                {item.journal && <span>• {item.journal}</span>}
              </div>
              {item.abstract && <p className="text-xs text-parchment-500 mt-1 line-clamp-2">{item.abstract}</p>}
            </a>
          ))}
          {!loading && failedTab !== activeTab && coreResults.length === 0 && <p className="text-sm text-parchment-500">No results found.</p>}
        </div>
      )}

      {/* Wikipedia Tab */}
      {activeTab === 'wiki' && (
        <div className="space-y-2">
          <p className="text-xs text-parchment-500 mb-2">Encyclopedia articles from <strong className="text-gold-400">Wikipedia</strong> — general reference and context</p>
          {loading && <p className="text-sm text-parchment-500 animate-pulse">Searching Wikipedia...</p>}
          {wikiResults.map((item: any, i: number) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
              className="block p-3 bg-parchment-800 rounded-lg hover:bg-parchment-700 transition-colors group">
              <p className="text-sm text-parchment-200 font-medium group-hover:text-gold-400 mb-1">{item.title}</p>
              <div className="flex items-center gap-2 text-xs text-parchment-500 flex-wrap">
                {item.wordcount && <span>{item.wordcount.toLocaleString()} words</span>}
              </div>
              {item.snippet && <p className="text-xs text-parchment-500 mt-1 line-clamp-2">{item.snippet}</p>}
            </a>
          ))}
          {!loading && failedTab !== activeTab && wikiResults.length === 0 && <p className="text-sm text-parchment-500">No results found.</p>}
        </div>
      )}

      {/* Perseus Tab */}
      {activeTab === 'perseus' && (
        <div className="space-y-2">
          <p className="text-xs text-parchment-500 mb-2">Classical texts from <strong className="text-gold-400">Perseus Digital Library</strong> — Greek &amp; Latin primary sources with lexicon tools</p>
          {loading && <p className="text-sm text-parchment-500 animate-pulse">Loading Perseus links...</p>}
          {perseusResults.map((item: any, i: number) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
              className="block p-3 bg-parchment-800 rounded-lg hover:bg-parchment-700 transition-colors group">
              <p className="text-sm text-parchment-200 font-medium group-hover:text-gold-400 mb-1">{item.title}</p>
              <div className="flex items-center gap-2 text-xs text-parchment-500">
                <span className="px-1.5 py-0.5 bg-parchment-700 rounded-sm">{item.type}</span>
              </div>
              {item.description && <p className="text-xs text-parchment-500 mt-1">{item.description}</p>}
            </a>
          ))}
          {!loading && failedTab !== activeTab && perseusResults.length === 0 && <p className="text-sm text-parchment-500">No results found.</p>}
        </div>
      )}

      {/* Wikidata Tab */}
      {activeTab === 'wikidata' && (
        <WikidataTab query={searchQuery} />
      )}

      {/* Sacred Texts Tab */}
      {activeTab === 'sacredtexts' && (
        <SacredTextsTab query={searchQuery} />
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          <p className="text-xs text-parchment-500 mb-2">External resources for <strong className="text-gold-400">{ref}</strong></p>
          {resourceLinks.map(link => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors"
            >
              <div>
                <h4 className="text-sm text-parchment-200 font-medium">{link.name}</h4>
                <p className="text-xs text-parchment-500">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function WikidataTab({ query }: { query: string }) {
  const { data, loading, error: failed } = useJson<{ results?: any[] }>(
    query ? `/api/research?q=${encodeURIComponent(query)}&source=wikidata&limit=8` : null
  );
  const results = data?.results ?? [];

  return (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
      <p className="text-xs text-parchment-500 mb-2">Structured knowledge from <strong className="text-gold-400">Wikidata</strong> — biblical persons, places, and concepts</p>
      {loading && <p className="text-sm text-parchment-500 animate-pulse">Searching Wikidata...</p>}
      {results.map((item: any, i: number) => (
        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
           className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors">
          <h4 className="text-sm text-parchment-200 font-medium">{item.title} <span className="text-parchment-600 text-xs">({item.id})</span></h4>
          {item.description && <p className="text-xs text-parchment-500 mt-1">{item.description}</p>}
        </a>
      ))}
      {!loading && results.length === 0 && (
        <p className="text-sm text-parchment-500">{failed ? 'Couldn\u2019t reach this service just now.' : 'No results found.'}</p>
      )}
    </div>
  );
}

function SacredTextsTab({ query }: { query: string }) {
  const { data, loading, error: failed } = useJson<{ results?: any[] }>(
    query ? `/api/research?q=${encodeURIComponent(query)}&source=sacredtexts` : null
  );
  const results = data?.results ?? [];

  return (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
      <p className="text-xs text-parchment-500 mb-2">Browse <strong className="text-gold-400">Internet Sacred Text Archive</strong> — public-domain religious texts</p>
      {loading && <p className="text-sm text-parchment-500 animate-pulse">Loading...</p>}
      {results.map((item: any, i: number) => (
        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
           className="block p-3 rounded-lg bg-parchment-800 hover:bg-parchment-700 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-sm bg-gold-600/20 text-gold-400">{item.type}</span>
            <h4 className="text-sm text-parchment-200 font-medium">{item.title}</h4>
          </div>
          {item.description && <p className="text-xs text-parchment-500 mt-1">{item.description}</p>}
        </a>
      ))}
      {!loading && results.length === 0 && (
        <p className="text-sm text-parchment-500">{failed ? 'Couldn\u2019t reach this service just now.' : 'No results found.'}</p>
      )}
    </div>
  );
}
