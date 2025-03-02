// src/components/LanguageSwitcher.tsx
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LanguageSwitcher() {
  // App Router では useParams を利用して locale を取得可能
  const { locale } = useParams() as { locale: string };

  return (
    <div>
      {['ja', 'en'].map((lng) => (
        <Link key={lng} href="/" locale={lng}>
          <span style={{ marginRight: 10, fontWeight: locale === lng ? 'bold' : 'normal' }}>
            {lng.toUpperCase()}
          </span>
        </Link>
      ))}
    </div>
  );
}
