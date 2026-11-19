'use client';

import { useState } from 'react';
import { SocialEmbed, type SocialEmbedSource } from 'social-embeds';

/** An embed that shows its `onError` message, so a failed load explains itself. */
export function ReportedEmbed(source: SocialEmbedSource) {
  const [error, setError] = useState('');
  return (
    <>
      <SocialEmbed
        {...source}
        onError={(reported) => {
          setError(reported.message);
        }}
      />
      {error && <p role="alert">onError: {error}</p>}
    </>
  );
}
