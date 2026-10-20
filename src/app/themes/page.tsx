import ThemeExplorer from '@/components/ThemeExplorer';

export const dynamic = 'force-dynamic';

export default function ThemesPage() {
  return (
    <>
      <main className="flex-1 p-4 lg:p-8 max-w-5xl">
        <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-2">Theological Themes</h1>
        <p className="text-parchment-400 mb-8 max-w-2xl">
          Explore the major theological themes of Scripture organized by category. Each theme includes its Hebrew and Greek vocabulary, key verses, and a brief overview — a gateway into deeper word study.
        </p>
        <ThemeExplorer />
      </main>
    </>
  );
}
