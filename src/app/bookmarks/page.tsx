import { getEditionCatalogue } from '@/lib/edition-data';
import Bookmarks from '@/components/Bookmarks';
export const dynamic = 'force-dynamic';
export default function BookmarksPage() { return <Bookmarks catalogue={getEditionCatalogue()} />; }
