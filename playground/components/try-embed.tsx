'use client';

import { useRef, useState } from 'react';
import { SocialEmbed } from 'social-embeds';

export function TryEmbed() {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState({ value: '', count: 0 });
  const [status, setStatus] = useState('');
  const started = useRef(0);
  const value = submitted.value.trim();

  const elapsed = () =>
    `${String(Math.round(performance.now() - started.current))} ms`;
  const handlers = {
    onLoad: () => {
      setStatus(`onLoad after ${elapsed()}`);
    },
    onError: (error: Error) => {
      setStatus(`onError after ${elapsed()}: ${error.message}`);
    },
  };

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          started.current = performance.now();
          setStatus('Rendering…');
          setSubmitted({ value: input, count: submitted.count + 1 });
        }}
      >
        <textarea
          rows={6}
          value={input}
          placeholder="Paste embed code or a post URL"
          onChange={(event) => {
            setInput(event.target.value);
          }}
        />
        <button type="submit">Render</button>
      </form>
      <p data-testid="try-status">{status}</p>
      {value &&
        (value.startsWith('<') ? (
          <SocialEmbed
            key={submitted.count}
            html={value}
            {...handlers}
            fallback={(code) => (
              <p>
                Not a recognised embed code. With a <code>fallback</code>, the
                host renders the original {code.length} characters itself.
              </p>
            )}
          />
        ) : (
          <SocialEmbed key={submitted.count} url={value} {...handlers} />
        ))}
    </>
  );
}
