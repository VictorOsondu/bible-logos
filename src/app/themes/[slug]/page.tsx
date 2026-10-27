import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubThemes, getThemeStudy, passageHref, THEME_STUDIES } from '@/lib/theme-studies';
import ThemeLicence from '@/components/ThemeLicence';
import ThemeReflection from '@/components/ThemeReflection';
import LivingLetterChart from '@/components/LivingLetterChart';

export function generateStaticParams() {
  return THEME_STUDIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const study = getThemeStudy((await params).slug);
  return { title: study ? `${study.title} — Themes · Bible Logos` : 'Study not found' };
}

export default async function ThemeStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const study = getThemeStudy((await params).slug);
  if (!study) notFound();
  const parent = study.parentSlug ? getThemeStudy(study.parentSlug) : undefined;
  const children = getSubThemes(study.slug);
  const hasContent = study.sections.length > 0;
  const letterGroups = study.sections.flatMap(section => section.letterGroups ?? []);
  const heading = 'font-serif text-2xl text-parchment-100 mb-4';
  return (
    <main className="flex-1 px-4 py-8 lg:px-8 lg:py-12 max-w-3xl">
      <nav aria-label="Theme breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-gold-400">
        <Link href="/themes" className="hover:underline">← All themes</Link>
        {parent && <><span aria-hidden="true">/</span><Link href={`/themes/${parent.slug}`} className="hover:underline">{parent.title}</Link></>}
      </nav>
      <article className="mt-8">
        <header>
          <p className="text-xs text-parchment-500 mb-2">{parent ? `${parent.title} · Sub-theme` : 'Theme'}</p>
          <h1 className="font-serif text-4xl font-semibold text-parchment-50 mb-4">{study.title}</h1>
          {study.overview && <p className="text-lg text-parchment-300 leading-relaxed">{study.overview}</p>}
          {hasContent && <p className="text-sm text-parchment-500 mt-4">Read each passage in context, compare translations, then use the questions to develop your own notes.</p>}
        </header>
        {children.length > 0 && (
          <section className="mt-10" aria-labelledby="sub-themes">
            <h2 id="sub-themes" className={heading}>Sub-themes</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {children.map(child => <li key={child.slug}>
                <Link href={`/themes/${child.slug}`} className="block rounded-lg border border-parchment-800 p-4 text-gold-400 hover:bg-parchment-900">{child.title} →</Link>
              </li>)}
            </ul>
          </section>
        )}
        {!hasContent && <p className="mt-10 text-parchment-400">Study content to follow.</p>}
        {letterGroups.length > 0 && (
          <section className="mt-10" aria-labelledby="hebrew-alphabet">
            <h2 id="hebrew-alphabet" className={heading}>The Hebrew alphabet</h2>
            <LivingLetterChart groups={letterGroups} ordered />
          </section>
        )}
        {study.passages.length > 0 && <section className="mt-10" aria-labelledby="key-passages">
          <h2 id="key-passages" className={heading}>Key passages</h2>
          <div className="flex flex-wrap gap-2">
            {study.passages.map(passage => <Link key={passage.label} href={passageHref(passage)} className="rounded-lg border border-parchment-800 px-3 py-2 text-sm text-gold-400 hover:bg-parchment-900">{passage.label}</Link>)}
          </div>
        </section>}
        {study.sections.map((section, index) => (
          <section key={section.title} className="mt-10">
            <h2 className={heading}>{index + 1}. {section.title}</h2>
            <div className="space-y-4 text-parchment-300 leading-relaxed">
              {section.text.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {section.letterGroups && <LivingLetterChart groups={section.letterGroups} />}
          </section>
        ))}
        {study.words.length > 0 && <section className="mt-10" aria-labelledby="language-insights">
          <h2 id="language-insights" className={heading}>Original-language insights</h2>
          <ul className="space-y-4">
            {study.words.map(word => <li key={word.id}>
              <Link href={`/word/${word.id}`} className="text-gold-400 hover:underline">{word.label} <span className="text-xs">({word.id})</span></Link>
              <p className="mt-1 text-sm text-parchment-400 leading-relaxed">{word.note}</p>
            </li>)}
          </ul>
        </section>}
        {study.questions.length > 0 && <section className="mt-10" aria-labelledby="reflection-questions">
          <h2 id="reflection-questions" className={heading}>Reflect and respond</h2>
          <ol className="list-decimal pl-5 space-y-3 text-parchment-300 leading-relaxed">
            {study.questions.map(question => <li key={question}>{question}</li>)}
          </ol>
          <ThemeReflection slug={study.slug} />
        </section>}
        {study.related.length > 0 && <section className="mt-10" aria-labelledby="related-studies">
          <h2 id="related-studies" className={heading}>Related studies</h2>
          <div className="flex flex-wrap gap-3">
            {study.related.map(slug => {
              const related = getThemeStudy(slug);
              return related ? <Link key={slug} href={`/themes/${slug}`} className="text-gold-400 hover:underline">{related.title} →</Link> : null;
            })}
          </div>
        </section>}
        {study.sources && study.sources.length > 0 && (
          <section className="mt-12 border-t border-parchment-800 pt-6" aria-labelledby="study-sources">
            <h2 id="study-sources" className="font-serif text-xl text-parchment-100 mb-3">Source</h2>
            {study.sources.map(source => (
              <div key={source.citation} className="text-sm text-parchment-400 leading-relaxed">
                <p>{source.citation}</p>
                <p className="mt-3 text-xs text-parchment-500">{source.detail}</p>
              </div>
            ))}
          </section>
        )}
      </article>
      <ThemeLicence />
    </main>
  );
}
