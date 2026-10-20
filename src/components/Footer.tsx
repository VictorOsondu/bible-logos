export default function Footer() {
  return (
    <footer className="no-print px-4 py-8 text-center text-xs text-parchment-500">
      <p>
        Bible Logos · based on{' '}
        <a href="https://github.com/quantumnic/biblelens" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-parchment-300">
          BibleLens
        </a>{' '}
        by Nicola Spieser ·{' '}
        <a href="https://github.com/VictorOsondu/bible-logos#-data-sources" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-parchment-300">
          data sources
        </a>
      </p>
      <p className="mt-1">
        A work in progress: not everything has been checked yet.{' '}
        <a href="https://github.com/VictorOsondu/bible-logos/issues" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-parchment-300">
          Report a mistake
        </a>
      </p>
    </footer>
  );
}
