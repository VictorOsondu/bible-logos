// The app's pages, shared by the sidebar, home page and search palette.
import {
  ALargeSmall, ArrowLeftRight, BookOpen, Bookmark, CalendarCheck, Columns2, Crown, Flame, HandHeart, Handshake,
  Hourglass, Languages, Library, Link2, MapPin, Network, NotebookPen, Quote, ScrollText, Search, Sparkles, Sprout,
  Star, Sun, Tags, Users, type LucideIcon,
} from 'lucide-react';

export interface NavLink {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export interface NavSection {
  label: string;
  links: NavLink[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Study',
    links: [
      { href: '/reader', icon: BookOpen, label: 'Books', description: 'Choose a book and chapter to read' },
      { href: '/search', icon: Search, label: 'Search', description: 'Full-text search in every translation' },
      { href: '/compare', icon: Columns2, label: 'Compare', description: 'Translations side by side' },
      { href: '/concordance', icon: Languages, label: 'Concordance', description: "Strong's Hebrew and Greek lexicon" },
      { href: '/passages', icon: Star, label: 'Key Passages', description: 'Well-known passages, songs and prayers' },
      { href: '/themes', icon: Tags, label: 'Themes', description: 'Guided topic studies with passages and reflection' },
    ],
  },
  {
    label: 'Personal',
    links: [
      { href: '/verse-of-the-day', icon: Sun, label: 'Daily Verse', description: "Today's verse in every translation" },
      { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks', description: 'Saved passages and history' },
      { href: '/study-notes', icon: NotebookPen, label: 'Notes', description: 'Your study notes' },
      { href: '/reading-plans', icon: CalendarCheck, label: 'Reading Plans', description: 'Guided reading with progress' },
    ],
  },
  {
    label: 'Reference',
    links: [
      { href: '/parables', icon: Sprout, label: 'Parables', description: 'The parables of Jesus' },
      { href: '/miracles', icon: Sparkles, label: 'Miracles', description: 'Miracles in both Testaments' },
      { href: '/prophecies', icon: ScrollText, label: 'Prophecies', description: 'Prophecies and their fulfilment' },
      { href: '/typology', icon: Link2, label: 'Typology', description: 'Old Testament types and their fulfilment' },
      { href: '/covenants', icon: Handshake, label: 'Covenants', description: "God's covenants through Scripture" },
      { href: '/parallels', icon: ArrowLeftRight, label: 'Parallels', description: 'Parallel accounts in the Gospels and elsewhere' },
      { href: '/names-of-god', icon: Crown, label: 'Names of God', description: 'Divine names and titles' },
      { href: '/persons', icon: Users, label: 'People', description: 'Key people of the Bible' },
      { href: '/prayers', icon: HandHeart, label: 'Prayers', description: 'Notable prayers of Scripture' },
      { href: '/sacrifices', icon: Flame, label: 'Sacrifices', description: 'The Levitical offerings' },
      { href: '/figures', icon: Quote, label: 'Figures of Speech', description: 'Literary devices in the text' },
      { href: '/geography', icon: MapPin, label: 'Places', description: 'Biblical places' },
      { href: '/genealogy', icon: Network, label: 'Genealogies', description: 'Biblical family lines' },
      { href: '/timeline', icon: Hourglass, label: 'Timeline', description: 'Biblical chronology' },
      { href: '/alphabet', icon: ALargeSmall, label: 'Alphabets', description: 'Hebrew and Greek letters' },
    ],
  },
];

export const REFERENCE_SECTION = NAV_SECTIONS.find(s => s.label === 'Reference')!;

/** The sidebar keeps to the main pages: the reference indexes share one entry, at the end of Study. */
export const SIDEBAR_SECTIONS: NavSection[] = NAV_SECTIONS.filter(s => s !== REFERENCE_SECTION).map(s => s.label !== 'Study' ? s : {
  ...s,
  links: [...s.links, { href: '/reference', icon: Library, label: 'Reference', description: 'People, places, parables, prophecies and more' }],
});

/** Asks the search palette to open (it listens for this event). */
export const openSearch = () => window.dispatchEvent(new Event('open-search'));
