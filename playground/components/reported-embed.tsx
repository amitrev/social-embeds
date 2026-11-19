'use client';

import { useState } from 'react';
import { SocialEmbed } from 'social-embeds';

/** A URL embed that shows its `onError` message, so a failed load explains itself. */
export function ReportedEmbed({ url }: { url: string }) {
  const [error, setError] = useState('');
  return (
    <>
      <SocialEmbed
        url={url}
        onError={(reported) => {
          setError(reported.message);
        }}
      />
      {error && <p role="alert">onError: {error}</p>}
    </>
  );
}
