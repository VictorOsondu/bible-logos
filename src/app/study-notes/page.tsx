import { getEditionCatalogue } from '@/lib/edition-data';
import StudyNotes from '@/components/StudyNotes';
export const dynamic = 'force-dynamic';
export default function StudyNotesPage() { return <StudyNotes catalogue={getEditionCatalogue()} />; }
