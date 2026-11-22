import { ElementEmbed } from '../../components/element-embed';
import {
  embedCodes,
  genericMap,
  PLATFORMS,
  URLS,
  type PlatformKey,
} from '../../samples';

const TEMPLATES = [
  ...(['x', 'instagram'] as const).map((key) => ({
    name: PLATFORMS[key],
    code: embedCodes(key)[0].value,
  })),
  { name: 'Generic iframe (Google Maps)', code: genericMap() },
];

export default function ElementPage() {
  return (
    <>
      <h1>
        <code>&lt;social-embed&gt;</code>
      </h1>
      <p>
        The custom element from <code>social-embeds/element</code>, with no
        React in the embeds. Each one shows the last <code>load</code> or{' '}
        <code>error</code> event it fired. Bluesky&apos;s handle URL,
        Rumble&apos;s page URL and Dailymotion without a Player ID are meant to
        report errors.
      </p>
      <h2>Embed code in a template</h2>
      {TEMPLATES.map(({ name, code }) => (
        <article key={name}>
          <h3>{name}</h3>
          <ElementEmbed code={code} />
        </article>
      ))}
      <h2>Post URLs</h2>
      {(Object.keys(URLS) as PlatformKey[]).flatMap((key) =>
        URLS[key].map((sample) => (
          <article key={`${key}-${sample.value}`}>
            <h3>
              {PLATFORMS[key]}: {sample.label}
            </h3>
            <p>
              <code>{sample.value}</code>
            </p>
            <ElementEmbed url={sample.value} />
          </article>
        )),
      )}
    </>
  );
}
