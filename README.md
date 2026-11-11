# social-embeds

Turn social media embed code or post URLs into working React components.

Pasting a platform's embed code into `dangerouslySetInnerHTML` does not work in React: the `<script>` tag never runs, every embed adds the same script again, and nothing initialises after client-side navigation. `social-embeds` recognises the platform, reads the post and its options from the embed code, drops the `<script>` tag, loads each platform script once per page and asks the platform to render the post. Iframe-based platforms get a responsive `<iframe>` instead.

- X, Instagram, Threads, Facebook, TikTok and YouTube
- React 19, Next.js App Router (Server Components, client navigation), or plain React
- Zero runtime dependencies, ESM only, typed
- No styling and no defaults beyond what the embed code or your props ask for

## Install

```sh
npm install social-embeds
```

`react` and `react-dom` 19 are peer dependencies.

## Quick start

```tsx
import { SocialEmbed } from 'social-embeds';

// Embed code, exactly as the platform's "Embed" dialog gave it
<SocialEmbed html={post.embedCode} />

// Or a post URL
<SocialEmbed url="https://x.com/jack/status/20" />
```

## Inputs: `html` vs `url`

There are two inputs, and they lead to the same component:

- **`html`**: the embed code from the platform's Embed dialog, stored as-is (for example in your CMS). It carries the post's options (theme, caption, start time, and so on), and for X, Instagram, Threads and some Facebook code it also carries **fallback content**: the post text, author and link inside the `<blockquote>`. That content is rendered on the server, so crawlers and visitors without JavaScript see it, and the platform script upgrades it in place.
- **`url`**: the post's address. A URL has no fallback content, so until the post has loaded the component shows a placeholder. This is a property of the input, not a limitation of the package. A URL carries no options either, except a YouTube start time (`t` or `start`) and the privacy-enhanced host.

Embed code is matched strictly: it must be one platform's own snippet, as the platform produced it. Extra wrappers, other markup or unknown scripts make it unrecognised (see [`fallback`](#unrecognised-embed-code)).

## Usage

### `<SocialEmbed>`

`<SocialEmbed>` takes `html` or `url` (never both) and renders the matching platform component.

```tsx
import { SocialEmbed } from 'social-embeds';

export function Embed({ code }: { code: string }) {
  return (
    <SocialEmbed
      html={code}
      maxWidth={560}
      onLoad={() => console.log('rendered')}
      onError={(error) => console.warn(error.message)}
    />
  );
}
```

It accepts the [shared props](#shared-props); `height` reaches only the iframe-based platforms. Platform options come from the embed code. To set them with props, use a platform component.

#### Unrecognised embed code

When `html` is not a recognised embed code, `<SocialEmbed>` calls `fallback` with the original string and renders what it returns. Without `fallback`, it renders nothing and calls `onError`.

```tsx
<SocialEmbed
  html={code}
  fallback={(html) => (
    // Only if your CMS sanitised this HTML upstream: social-embeds never does.
    <div dangerouslySetInnerHTML={{ __html: html }} />
  )}
/>
```

An unsupported URL never reaches `fallback`: nothing is rendered and `onError` names the URL.

### Platform components

Each platform component takes a `url`, or an `embed` already parsed by [`social-embeds/parser`](#parser), plus the shared props and its own option props. Option props override options from the embed code.

```tsx
import {
  FacebookEmbed,
  InstagramEmbed,
  ThreadsEmbed,
  TikTokEmbed,
  XEmbed,
  YouTubeEmbed,
} from 'social-embeds';

<XEmbed url="https://x.com/jack/status/20" theme="dark" cards="hidden" />

<InstagramEmbed url="https://www.instagram.com/p/DfPQchkG1tg/" captioned />

<ThreadsEmbed url="https://www.threads.com/@instagram/post/DfQSavwEs5C" theme="auto" />

<FacebookEmbed
  url="https://www.facebook.com/facebook/videos/10153231379946729/"
  locale="bg_BG"
  showCaptions
/>

<TikTokEmbed
  url="https://www.tiktok.com/@scout2015/video/6718335390845095173"
  musicInfo={false}
  description={false}
/>

<YouTubeEmbed url="https://youtu.be/jNQXAC9IVRw?t=90" nocookie controls={false} />
```

| Component        | Option props                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `XEmbed`         | `theme` (`'light'` \| `'dark'`), `conversation` (`'none'`), `cards` (`'hidden'`), `align` (`'left'` \| `'center'` \| `'right'`), `lang`, `dnt`                                                                                                                                                                                                                      |
| `InstagramEmbed` | `captioned`                                                                                                                                                                                                                                                                                                                                                         |
| `ThreadsEmbed`   | `theme` (`'light'` \| `'dark'` \| `'auto'`)                                                                                                                                                                                                                                                                                                                         |
| `FacebookEmbed`  | `locale` (SDK locale, default `'en_US'`), `showText`; videos also `allowfullscreen`, `autoplay`, `showCaptions`                                                                                                                                                                                                                                                     |
| `TikTokEmbed`    | the [Embed Player](https://developers.tiktok.com/doc/embed-player) parameters: `controls`, `progressBar`, `playButton`, `volumeControl`, `fullscreenButton`, `timestamp`, `loop`, `autoplay`, `musicInfo`, `description`, `rel`, `nativeContextMenu`, `closedCaption`, `forceMuted`                                                                                 |
| `YouTubeEmbed`   | the [player parameters](https://developers.google.com/youtube/player_parameters): `autoplay`, `ccLangPref`, `ccLoadPolicy`, `color`, `controls`, `disablekb`, `enablejsapi`, `end`, `fs`, `hl`, `ivLoadPolicy`, `list`, `listType`, `loop`, `origin`, `playlist`, `playsinline`, `rel`, `start`, `widgetReferrer`; plus `nocookie` (play from youtube-nocookie.com) |

Boolean player parameters are written as `1`/`0`.

### Parser

`social-embeds/parser` exports `parseEmbed(html)` and `matchUrl(url)`. They are pure functions with no React and no DOM, so they run the same in a Server Component, in Node (for example when your CMS saves a post) and in the browser. Both return a plain, serialisable `ParsedEmbed`, or `null` for input they do not recognise. They never throw.

```ts
import { matchUrl, parseEmbed, type ParsedEmbed } from 'social-embeds/parser';

const embed = parseEmbed(code);
// {
//   platform: 'x',
//   kind: 'post',
//   url: 'https://x.com/jack/status/20',
//   id: '20',
//   variant: 'sdk',
//   options: { theme: 'dark' },
//   fallbackHtml: '<p lang="en" dir="ltr">just setting up my twttr</p>…',
// }
```

```ts
type ParsedEmbed = {
  platform: 'x' | 'instagram' | 'facebook' | 'threads' | 'tiktok' | 'youtube';
  kind: 'post' | 'video';
  url: string; // canonical post URL
  id: string;
  variant: 'sdk' | 'iframe'; // which rendering path applies
  options: Record<string, string | number | boolean>;
  size?: { width?: number; height?: number };
  fallbackHtml?: string; // rebuilt from a whitelist, only from embed code
};
```

`fallbackHtml` is not the raw input: it is rebuilt from the elements and attributes that appear in the platform's own markup, and everything else is dropped. Pass the result to the platform component as `embed`:

```tsx
import { YouTubeEmbed } from 'social-embeds';

{
  embed?.platform === 'youtube' && <YouTubeEmbed embed={embed} />;
}
```

A component checks an `embed` before using it: its `url` must be one `matchUrl` recognises with the same platform and id, and `fallbackHtml` must be exactly what the parser would produce. Otherwise it calls `onError`, or drops the fallback content.

## Shared props

| Prop          | Type                     | Default      | Notes                                                                                                                                          |
| ------------- | ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`         | `string`                 |              | Post URL. Platform components take `url` or `embed`; `<SocialEmbed>` takes `url` or `html`.                                                    |
| `embed`       | `ParsedEmbed`            |              | Platform components only.                                                                                                                      |
| `html`        | `string`                 |              | `<SocialEmbed>` only.                                                                                                                          |
| `width`       | `number \| string`       | `'100%'`     | Wrapper width.                                                                                                                                 |
| `maxWidth`    | `number`                 | per platform | The embed fills its container up to this width, in pixels. See [Platforms](#platforms).                                                        |
| `height`      | `number`                 |              | Iframe-based embeds only (YouTube, TikTok, Facebook video embed code): a fixed height instead of the aspect ratio. The others size themselves. |
| `placeholder` | `ReactNode`              | a skeleton   | Shown until the post has loaded. The default skeleton has a per-platform minimum height to limit layout shift.                                 |
| `lazy`        | `boolean`                | `true`       | Load the embed only when it comes within 200 px of the viewport.                                                                               |
| `onLoad`      | `() => void`             |              | Called once the platform has rendered the post (iframe embeds: when the iframe has loaded).                                                    |
| `onError`     | `(error: Error) => void` |              | Called on invalid input, a script that fails to load, or a post that does not render. Components never throw.                                  |
| `...rest`     | `ComponentProps<'div'>`  |              | Passed to the wrapper `div` (`className`, `style`, `data-*`, …).                                                                               |

Script-based embeds try to render three times, waiting 15 s each time, 1 s and then 2 s apart, before `onError` reports the failure.

## Platforms

| Platform  | Mechanism                                                                        | URL formats                                                                                                                                           | Options read from embed code                                                                                                                                   | Default `maxWidth`     |
| --------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| X         | script (`widgets.js`), `twttr.widgets.load`                                      | `x.com/{user}/status/{id}`, `twitter.com/…` (also `www.` and `mobile.`)                                                                               | `data-theme`, `data-conversation`, `data-cards`, `data-align` or `align`, `data-lang`, `data-dnt`, `data-width`                                                | 550                    |
| Instagram | script (`embed.js`), `instgrm.Embeds.process`                                    | `instagram.com/p/{code}/`, `/reel/`, `/reels/`, `/tv/`, `/{user}/p/{code}/`, `/{user}/reel/{code}/`                                                   | `data-instgrm-captioned`, `data-instgrm-version`                                                                                                               | 540                    |
| Threads   | script (`embed.js`), `instgrm.Embeds.process`                                    | `threads.com/@{user}/post/{code}`, `threads.com/t/{code}` (and `threads.net`)                                                                         | `data-theme`, `data-text-post-version`                                                                                                                         | 658                    |
| Facebook  | posts and video URLs: SDK (`sdk.js`), `FB.XFBML.parse`; video embed code: iframe | see [Facebook](#facebook)                                                                                                                             | `data-width`, `data-show-text`, `data-lazy`, `data-allowfullscreen`, `data-autoplay`, `data-show-captions`; iframe query (`show_text`, `width`, …); SDK locale | posts 750, videos none |
| TikTok    | iframe ([Embed Player](https://developers.tiktok.com/doc/embed-player))          | `tiktok.com/@{user}/video/{id}`                                                                                                                       | every player query parameter                                                                                                                                   | 325                    |
| YouTube   | iframe                                                                           | `youtube.com/watch?v={id}`, `youtu.be/{id}`, `/shorts/{id}`, `/embed/{id}`, `/live/{id}`, `youtube-nocookie.com/embed/{id}`; `t` and `start` are kept | every player query parameter; the youtube-nocookie.com host                                                                                                    | none                   |

URLs must be absolute `http(s)` URLs. Hosts may have `www.`; YouTube also `m.`, Facebook also `m.`.

### X

- The post that renders is the one the blockquote links to.
- widgets.js loads from `platform.twitter.com`; a host page that already loaded it from `platform.x.com` or `platform.twitter.com` is reused.

### Instagram

- Embed code has no caption text: its fallback content is "View this post on Instagram" and the "A post shared by …" link.
- The canonical URL is `https://www.instagram.com/{p|reel|tv}/{code}/`; `reels` becomes `reel` and a username in the path is dropped, because Instagram's embed only works with those paths.
- A post that has been removed never reports back, so `onError` fires after the retries.
- Instagram's script renders at most three posts at a time and starts the next one when one finishes, so on a page with many posts some appear later.

### Threads

- Embed code's fallback content is only a "View on Threads" link: Threads does not include the post text.
- The oEmbed `maxwidth` parameter only changes an inline style, which is not read. Use `maxWidth`.
- Threads' script also renders at most three posts at a time, and retries waiting ones after 5 s and 10 s.
- Threads and Instagram share one global (`instgrm.Embeds`). Each platform's own registration is what counts as ready, so Instagram's script alone never makes Threads look loaded.

### Facebook

The rules:

- **Posts** always render through the SDK, including when the embed code is the `plugins/post.php` iframe. That iframe's height only fits the `width` it was made for, so it cannot be responsive; the SDK resizes the post itself. `show_text` and `width` from the iframe carry over; `height` is dropped.
- **Video embed code** (the `plugins/video.php` iframe) renders as that iframe, in a box with its aspect ratio. No script.
- **Video embed code that shows the post text** (`show_text=true`, the Embed dialog's "Include full post") renders through the SDK, like a post. The text below the player has its own height at every width, so no aspect ratio fits the iframe, and its own height cuts the text off. `show_text`, `allowfullscreen`, `autoplay` and `show_captions` carry over; `width`, `height` and `t` are dropped.
- **Video URLs** and `fb-video` SDK code render through the SDK, which knows the video's real size (videos are both 16:9 and vertical).

URL shapes, each tested against Facebook's plugins on `www.facebook.com`, `facebook.com` and `m.facebook.com`:

| Kind  | Shapes                                                                                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Post  | `/{user}/posts/{id}`, `/{user}/posts/pfbid…`, `/permalink.php?story_fbid={id}&id={owner}`, `/story.php?story_fbid={id}&id={owner}`, `/photo.php?fbid={id}`, `/photo/?fbid={id}`, `/{user}/photos/{album}/{fbid}/` |
| Video | `/{page}/videos/{id}`, `/{page}/videos/{slug}/{id}/`, `/watch/?v={id}`, `/video.php?v={id}`, `/reel/{id}`                                                                                                         |

- One SDK serves the whole page, so the first `locale` requested wins.
- The SDK loads with `xfbml=0` and parses only the embed's own element, so it never scans the rest of the page. An SDK the host page already loaded is reused.
- Instagram's and Threads' scripts do nothing on a page where the Facebook SDK has already loaded; the loader works around that. If your page loads both the SDK and Instagram's script itself, load Instagram's first.
- A removed post shows Facebook's "no longer available" notice.

### TikTok

- Every input renders TikTok's [Embed Player](https://developers.tiktok.com/doc/embed-player) iframe at 9:16, the replacement TikTok recommends for its deprecated blockquote embed. Old `blockquote.tiktok-embed` code is still recognised and renders the player; its caption is not shown.
- No script and no fallback content.

### YouTube

- Videos are 16:9 and Shorts URLs 9:16, unless embed code gives a `width` and `height`.
- Privacy-enhanced embed code (youtube-nocookie.com) stays on that host; `nocookie` sets it for other input.

### Not supported

- Redirecting short links: `fb.watch/…`, Facebook share links (`/share/p/…`, `/share/v/…`), `vm.tiktok.com/…` and `vt.tiktok.com/…`. A redirect cannot be followed without a network request, and the package makes none. `matchUrl` returns `null`.
- Facebook group posts.
- Fetching embed code from oEmbed endpoints, consent gating and HTML sanitising: these stay with the host.

## Next.js

The `social-embeds` entry starts with `'use client'`, so its components can be rendered straight from a Server Component, with props that can be serialised:

```tsx
// app/posts/[slug]/page.tsx: a Server Component
import { SocialEmbed } from 'social-embeds';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPost((await params).slug);
  return <SocialEmbed html={post.embedCode} />;
}
```

Functions cannot cross the server/client boundary, so `onLoad`, `onError` and `fallback` need a Client Component of your own:

```tsx
'use client';
import { SocialEmbed } from 'social-embeds';

export function Embed({ html }: { html: string }) {
  return (
    <SocialEmbed html={html} onError={(error) => console.warn(error.message)} />
  );
}
```

`social-embeds/parser` has no directive. Use it in Server Components, route handlers or when content is saved, and pass the `ParsedEmbed` to a platform component as `embed`.

Client navigation needs nothing extra: each platform script loads once per page, and an embed that mounts after navigation renders without loading it again. With `lazy` (the default), a page with five embeds loads no platform script until the first embed comes near the viewport, and each embed then renders only when it comes near.

## Server-side fallback content

- **Embed code with fallback content** (X, Instagram, Threads, Facebook SDK code with a blockquote): the server HTML contains the platform's blockquote with its whitelisted content, such as the post text, author and link. No placeholder is shown. On the client, the platform script turns it into the post.
- **URLs and embed code without fallback content**: the server HTML contains the sized wrapper and the placeholder.
- **Iframe embeds** (YouTube, TikTok, Facebook video embed code): the iframe is added on the client, so `onLoad` can never be missed. Without JavaScript only the placeholder shows.
- The server HTML never contains a platform `<script>`.

The platform's class (`twitter-tweet`, `instagram-media`, `text-post-media`) is added only when the embed renders, so the platform scripts, which render every element with that class on the page, cannot render embeds that have not come near the viewport yet. CSS that targets those classes does not apply to the fallback content before then.

## Responsiveness

The host does nothing to make embeds responsive:

- **Script-based embeds** (X, Instagram, Threads, Facebook SDK) get a wrapper of `width: 100%` (or `width`) and `max-width: {maxWidth}px`, and the platform widget fills it. Their height is the platform's own.
- **Iframe embeds** get a wrapper with `aspect-ratio` taken from the embed code's `width` and `height` (16:9 without them; 9:16 for TikTok and YouTube Shorts URLs), and the iframe fills it. `height` replaces the aspect ratio with a fixed height.

## License

[MIT](./LICENSE.md)
