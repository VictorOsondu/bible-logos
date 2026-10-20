// The app's pages, shared by the sidebar, footer, home page and search palette.

export interface NavLink {
  href: string;
  icon: string;
  label: string;
  description: string;
}

export interface NavSection {
  label: string;
  icon: string;
  links: NavLink[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Study',
    icon: '📚',
    links: [
      { href: '/search', icon: '🔍', label: 'Search', description: 'Full-text search in every translation' },
      { href: '/compare', icon: '⚖️', label: 'Compare', description: 'Translations side by side' },
      { href: '/concordance', icon: '📖', label: 'Concordance', description: "Strong's Hebrew & Greek lexicon" },
      { href: '/passages', icon: '📌', label: 'Key Passages', description: 'Well-known passages, songs and prayers' },
      { href: '/themes', icon: '🎨', label: 'Themes', description: 'Theological themes and their key words' },
    ],
  },
  {
    label: 'Reference',
    icon: '🗂️',
    links: [
      { href: '/parables', icon: '🌾', label: 'Parables', description: 'The parables of Jesus' },
      { href: '/miracles', icon: '✨', label: 'Miracles', description: 'Miracles in both Testaments' },
      { href: '/prophecies', icon: '🔮', label: 'Prophecies', description: 'Prophecies and their fulfilment' },
      { href: '/typology', icon: '🔗', label: 'Typology', description: 'Old Testament types and New Testament fulfilment' },
      { href: '/covenants', icon: '📜', label: 'Covenants', description: "God's covenants through Scripture" },
      { href: '/parallels', icon: '🔀', label: 'Parallels', description: 'Parallel accounts in the Gospels and elsewhere' },
      { href: '/names-of-god', icon: '✡️', label: 'Names of God', description: 'Divine names and titles' },
      { href: '/persons', icon: '👤', label: 'People', description: 'Key people of the Bible' },
      { href: '/prayers', icon: '🙏', label: 'Prayers', description: 'Notable prayers of Scripture' },
      { href: '/sacrifices', icon: '🔥', label: 'Sacrifices', description: 'The Levitical offerings' },
      { href: '/figures', icon: '🎭', label: 'Figures of Speech', description: 'Literary devices in the text' },
      { href: '/geography', icon: '🗺️', label: 'Places', description: 'Biblical places' },
      { href: '/genealogy', icon: '🌳', label: 'Genealogies', description: 'Biblical family lines' },
      { href: '/timeline', icon: '📅', label: 'Timeline', description: 'Biblical chronology' },
      { href: '/alphabet', icon: '🔤', label: 'Alphabets', description: 'Hebrew and Greek letters' },
    ],
  },
  {
    label: 'Personal',
    icon: '📝',
    links: [
      { href: '/verse-of-the-day', icon: '☀️', label: 'Daily Verse', description: "Today's verse in every translation" },
      { href: '/bookmarks', icon: '📑', label: 'Bookmarks', description: 'Saved passages and history' },
      { href: '/study-notes', icon: '📝', label: 'Notes', description: 'Your study notes' },
      { href: '/reading-plans', icon: '🗓️', label: 'Reading Plans', description: 'Guided reading with progress' },
    ],
  },
];
