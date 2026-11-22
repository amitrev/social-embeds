'use client';

import { useState } from 'react';
import { SocialEmbed, type SocialEmbedSource } from 'social-embeds';

/** A `<SocialEmbed>` that shows the last `onLoad` or `onError` it called. */
export function LoggedEmbed(source: SocialEmbedSource) {
  const [event, setEvent] = useState('waiting');
  return (
    <>
      <SocialEmbed
        {...source}
        onLoad={() => {
          setEvent('load');
        }}
        onError={(error) => {
          setEvent(`error: ${error.message}`);
        }}
      />
      <p role="status">Last event: {event}</p>
    </>
  );
}
