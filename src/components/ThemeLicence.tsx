import { THEME_LICENCE_URL } from '@/lib/theme-studies';

export default function ThemeLicence() {
  return (
    <aside aria-label="Study content licence" className="mt-10 border-t border-parchment-800 pt-5 text-xs leading-relaxed text-parchment-500">
      <p>Original Themes study material © 2026 Bible Logos contributors. Licensed under{' '}
        <a href={THEME_LICENCE_URL} rel="license" className="text-gold-400 underline underline-offset-2">CC BY-NC 4.0</a>:
        {' '}share and adapt for non-commercial use with attribution and an indication of changes.
      </p>
      <p className="mt-2">Bible texts and third-party reference material retain their own licences. Your personal notes belong to you.{' '}
        <a href="/themes-licence.txt" className="underline underline-offset-2">Licence scope and attribution</a>
      </p>
    </aside>
  );
}
