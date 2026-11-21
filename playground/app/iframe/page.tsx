import { parseIframe } from 'social-embeds/parser';
import { LoggedEmbed } from '../../components/logged-embed';
import { genericCodes } from '../../samples';

export default function GenericIframes() {
  const codes = genericCodes();
  return (
    <>
      <h1>Generic iframes</h1>
      <p>
        Every embed code in <code>test/fixtures/generic/</code>, given to{' '}
        <code>SocialEmbed html</code>. None is a supported platform, so each
        renders as a generic iframe: the one <code>&lt;iframe&gt;</code> rebuilt
        from its checked attributes, with no script. Each shows the last{' '}
        <code>onLoad</code> or <code>onError</code> it called.
      </p>
      {codes.map((sample) => (
        <article key={sample.label}>
          <h3>
            <code>{sample.label}</code>
          </h3>
          <LoggedEmbed html={sample.value} />
          <details>
            <summary>Embed code and parseIframe result</summary>
            <pre>{sample.value}</pre>
            <pre>{JSON.stringify(parseIframe(sample.value), null, 2)}</pre>
          </details>
        </article>
      ))}
    </>
  );
}
