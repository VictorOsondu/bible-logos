import type { Metadata } from 'next';
import ThemeExplorer from '@/components/ThemeExplorer';
import ThemeLicence from '@/components/ThemeLicence';

export const metadata: Metadata = {
  title: 'Themes — Guided Topic Studies · Bible Logos',
  description: 'Explore core biblical topics through guided readings, original-language insights and reflection questions.',
};

export default function ThemesPage() {
  return (
    <main className="flex-1 p-4 lg:p-8 max-w-5xl">
      <p className="text-xs uppercase tracking-wider text-gold-400 mb-3">Guided topic studies</p>
      <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-3">Themes</h1>
      <p className="text-parchment-400 mb-8 max-w-2xl leading-relaxed">
        Study the core themes of Scripture through connected passages, explanations and reflection.
        Choose a theme, explore its sub-themes and keep your own notes as you go.
      </p>
      <ThemeExplorer />
      <ThemeLicence />
    </main>
  );
}
