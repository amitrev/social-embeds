# social-embeds

Turn social media embed code or post URLs into working React components.

Pasting a platform's embed code into `dangerouslySetInnerHTML` does not work in React: the `<script>` tag never runs, every embed adds the same script again, and nothing initialises after client-side navigation. `social-embeds` recognises the platform, reads the post and its options from the embed code, drops the `<script>` tag, loads each platform script once per page and asks the platform to render the post. Iframe-based platforms get a responsive `<iframe>` instead.

**[Live demo](https://amitrev.github.io/social-embeds/)**: every platform from embed code and post URLs, and a box for your own, running the released version.

- X, Instagram, Threads, Facebook, TikTok, YouTube, Telegram, Snapchat, LinkedIn, Reddit, Pinterest, Spotify, Vimeo, Twitch, Dailymotion, Bluesky, SoundCloud, Apple Music, Apple Podcasts, Tumblr, Kick and Giphy
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
- **`url`**: the post's address. A URL has no fallback content, so until the post has loaded the component shows a placeholder. This is a property of the input, not a limitation of the package. A URL carries no options either, except a YouTube start time (`t` or `start`), the privacy-enhanced host, Telegram's `single` and `comment`, a Vimeo start time (`#t=`) and a Twitch video's `t`.

Embed code is matched strictly: it must be one platform's own snippet, as the platform produced it. Extra wrappers, other markup or unknown scripts make it unrecognised (see [`fallback`](#unrecognised-embed-code)). The exceptions are Vimeo's and Dailymotion's own responsive wrappers, which hold the video's aspect ratio.

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

It accepts the [shared props](#shared-props); `height` reaches only the iframe-based platforms. Platform options come from the embed code. To set them with props, use a platform component. `<SocialEmbed>` takes no Dailymotion Player ID, so it renders Dailymotion only from embed code that carries one (see [Dailymotion](#dailymotion)).

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
  AppleMusicEmbed,
  ApplePodcastsEmbed,
  BlueskyEmbed,
  DailymotionEmbed,
  FacebookEmbed,
  GiphyEmbed,
  InstagramEmbed,
  KickEmbed,
  LinkedInEmbed,
  PinterestEmbed,
  RedditEmbed,
  SnapchatEmbed,
  SoundCloudEmbed,
  SpotifyEmbed,
  TelegramEmbed,
  ThreadsEmbed,
  TikTokEmbed,
  TumblrEmbed,
  TwitchEmbed,
  VimeoEmbed,
  XEmbed,
  YouTubeEmbed,
} from 'social-embeds';

<XEmbed url="https://x.com/jack/status/20" theme="dark" cards="hidden" />

<InstagramEmbed url="https://www.instagram.com/p/Df75lxnmIrF/" captioned />

<ThreadsEmbed url="https://www.threads.com/@instagram/post/Df5MmLBm0O7" theme="auto" />

<FacebookEmbed
  url="https://www.facebook.com/facebook/videos/10153231379946729/"
  locale="en_GB"
  showCaptions
/>

<TikTokEmbed
  url="https://www.tiktok.com/@tiktok/video/7704834703446117662"
  musicInfo={false}
  description={false}
/>

<YouTubeEmbed url="https://youtu.be/jNQXAC9IVRw?t=11" nocookie controls={false} />

<TelegramEmbed url="https://t.me/telegram/83" dark userpic={false} />

<SnapchatEmbed url="https://www.snapchat.com/@teamsnapchat" />

<LinkedInEmbed
  url="https://www.linkedin.com/feed/update/urn:li:ugcPost:7528828146767409153/"
  collapsed
  height={560}
/>

<RedditEmbed
  url="https://www.reddit.com/r/reddit/comments/11zso11/"
  theme="dark"
  locale="en-GB"
/>

<PinterestEmbed url="https://www.pinterest.com/pin/424605071145752542/" pinWidth="large" />

<SpotifyEmbed url="https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS" theme={0} />

<VimeoEmbed url="https://vimeo.com/76979871" muted title={false} t="1m2s" />

<TwitchEmbed url="https://www.twitch.tv/videos/1816688726" autoplay={false} time="30s" />

<DailymotionEmbed
  url="https://www.dailymotion.com/video/x84sh87"
  playerId={process.env.NEXT_PUBLIC_DAILYMOTION_PLAYER_ID}
  mute
/>

<BlueskyEmbed
  url="https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3mxu3hsnebc2v"
  colorMode="dark"
/>

<SoundCloudEmbed url="https://soundcloud.com/forss/flickermood" visual={false} height={166} />

<AppleMusicEmbed url="https://music.apple.com/us/album/birds-of-oaks-bottom-piano-solos/1357820591?i=1357820597" />

<ApplePodcastsEmbed url="https://podcasts.apple.com/us/podcast/monument-valley-meet-the-developer/id947965068" />

<TumblrEmbed url="https://staff.tumblr.com/post/828009069026721792" />

<KickEmbed url="https://kick.com/kick" muted />

<GiphyEmbed url="https://giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2" maxWidth={480} />
```

| Component                                                            | Option props                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `XEmbed`                                                             | `theme` (`'light'` \| `'dark'`), `conversation` (`'none'`), `cards` (`'hidden'`), `align` (`'left'` \| `'center'` \| `'right'`), `lang`, `dnt`                                                                                                                                                                                                                      |
| `InstagramEmbed`                                                     | `captioned`                                                                                                                                                                                                                                                                                                                                                         |
| `ThreadsEmbed`                                                       | `theme` (`'light'` \| `'dark'` \| `'auto'`)                                                                                                                                                                                                                                                                                                                         |
| `FacebookEmbed`                                                      | `locale` (SDK locale, default `'en_US'`), `showText`; videos also `allowfullscreen`, `autoplay`, `showCaptions`                                                                                                                                                                                                                                                     |
| `TikTokEmbed`                                                        | the [Embed Player](https://developers.tiktok.com/doc/embed-player) parameters: `controls`, `progressBar`, `playButton`, `volumeControl`, `fullscreenButton`, `timestamp`, `loop`, `autoplay`, `musicInfo`, `description`, `rel`, `nativeContextMenu`, `closedCaption`, `forceMuted`                                                                                 |
| `YouTubeEmbed`                                                       | the [player parameters](https://developers.google.com/youtube/player_parameters): `autoplay`, `ccLangPref`, `ccLoadPolicy`, `color`, `controls`, `disablekb`, `enablejsapi`, `end`, `fs`, `hl`, `ivLoadPolicy`, `list`, `listType`, `loop`, `origin`, `playlist`, `playsinline`, `rel`, `start`, `widgetReferrer`; plus `nocookie` (play from youtube-nocookie.com) |
| `TelegramEmbed`                                                      | the widget configurator's options: `userpic`, `color` (hex, no `#`), `dark`, `darkColor`                                                                                                                                                                                                                                                                            |
| `SnapchatEmbed`                                                      | none                                                                                                                                                                                                                                                                                                                                                                |
| `LinkedInEmbed`                                                      | `collapsed` (the Embed dialog's "less text")                                                                                                                                                                                                                                                                                                                        |
| `RedditEmbed`                                                        | `theme` (`'light'` \| `'dark'`), `showMedia`, `showTitle`, `showUsername`, `locale`, `depth` (replies under a comment)                                                                                                                                                                                                                                              |
| `PinterestEmbed`                                                     | `pinWidth` (`'small'` \| `'medium'` \| `'large'`): `data-pin-width`, since `width` is the wrapper's                                                                                                                                                                                                                                                                 |
| `SpotifyEmbed`                                                       | `theme` (`0`, the dark player)                                                                                                                                                                                                                                                                                                                                      |
| `VimeoEmbed`                                                         | Vimeo's player parameters: `autopause`, `autoplay`, `background`, `byline`, `color` (hex, no `#`), `controls`, `dnt`, `keyboard`, `loop`, `muted`, `pip`, `playsinline`, `portrait`, `quality`, `speed`, `title`, `transparent`; plus `t` (start time, seconds or `1m2s`)                                                                                           |
| `TwitchEmbed`                                                        | `autoplay`, `muted`, `time` (a video's start, `1h2m3s`)                                                                                                                                                                                                                                                                                                             |
| `DailymotionEmbed`                                                   | `playerId` (your Player ID; required unless the embed code has one), `mute`, `startTime` (seconds), `loop`                                                                                                                                                                                                                                                          |
| `BlueskyEmbed`                                                       | `colorMode` (`'light'` \| `'dark'` \| `'system'`)                                                                                                                                                                                                                                                                                                                   |
| `SoundCloudEmbed`                                                    | SoundCloud's player parameters, in camelCase: `visual`, `color` (with `#`), `autoPlay`, `hideRelated`, `showComments`, `showUser`, `showReposts`, `showTeaser`, `showArtwork`                                                                                                                                                                                       |
| `AppleMusicEmbed`, `ApplePodcastsEmbed`, `TumblrEmbed`, `GiphyEmbed` | none                                                                                                                                                                                                                                                                                                                                                                |
| `KickEmbed`                                                          | `autoplay`, `muted`                                                                                                                                                                                                                                                                                                                                                 |

Boolean player parameters are written as `1`/`0`; Telegram's, Reddit's, Twitch's, Dailymotion's, SoundCloud's and Kick's options are written the way their own embed code writes them.

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
  platform:
    | 'x'
    | 'instagram'
    | 'facebook'
    | 'threads'
    | 'tiktok'
    | 'youtube'
    | 'telegram'
    | 'snapchat'
    | 'linkedin'
    | 'reddit'
    | 'pinterest';
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

A component checks an `embed` before using it: its `url` must be the exact URL `matchUrl` returns for it, with the same platform and id, and `fallbackHtml` must be exactly what the parser would produce. Otherwise it calls `onError`, or drops the fallback content.

## Shared props

| Prop          | Type                     | Default      | Notes                                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`         | `string`                 |              | Post URL. Platform components take `url` or `embed`; `<SocialEmbed>` takes `url` or `html`.                                                                                                                                                                                                                       |
| `embed`       | `ParsedEmbed`            |              | Platform components only.                                                                                                                                                                                                                                                                                         |
| `html`        | `string`                 |              | `<SocialEmbed>` only.                                                                                                                                                                                                                                                                                             |
| `width`       | `number \| string`       | `'100%'`     | Wrapper width.                                                                                                                                                                                                                                                                                                    |
| `maxWidth`    | `number`                 | per platform | The embed fills its container up to this width, in pixels. See [Platforms](#platforms).                                                                                                                                                                                                                           |
| `height`      | `number`                 |              | Fixed-size iframe embeds only (YouTube, TikTok, Facebook video embed code, Snapchat, LinkedIn, Spotify, Vimeo, Twitch, Dailymotion, SoundCloud, Apple Music, Apple Podcasts, Kick, Giphy): a fixed height instead of the aspect ratio, or instead of a fixed-height player's default. The others size themselves. |
| `maxHeight`   | `number`                 |              | Fixed-size iframe embeds only: the embed is at most this tall, in pixels. It narrows to keep its aspect ratio, so a vertical video does not fill the column.                                                                                                                                                      |
| `placeholder` | `ReactNode`              | a skeleton   | Shown until the post has loaded. The default skeleton has a per-platform minimum height to limit layout shift.                                                                                                                                                                                                    |
| `lazy`        | `boolean`                | `true`       | Load the embed only when it comes within 200 px of the viewport.                                                                                                                                                                                                                                                  |
| `onLoad`      | `() => void`             |              | Called once the platform has rendered the post (iframe embeds: when the iframe has loaded; Telegram, Reddit, Bluesky and Tumblr: when the frame first reports its height).                                                                                                                                        |
| `onError`     | `(error: Error) => void` |              | Called on invalid input, a script that fails to load, or a post that does not render. Components never throw.                                                                                                                                                                                                     |
| `...rest`     | `ComponentProps<'div'>`  |              | Passed to the wrapper `div` (`className`, `style`, `data-*`, …).                                                                                                                                                                                                                                                  |

Script-based embeds try to render three times, waiting 15 s each time, 1 s and then 2 s apart, before `onError` reports the failure. Telegram, Reddit, Bluesky and Tumblr frames that report no height within 15 s show at their starting height, and `onError` reports it. Frames report their height only once painted, so the 15 s start when the embed comes near the viewport, also with `lazy={false}`.

## Platforms

| Platform       | Mechanism                                                                                | URL formats                                                                                                                                                                            | Options read from embed code                                                                                                                                   | Default `maxWidth`               |
| -------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| X              | script (`widgets.js`), `twttr.widgets.load`                                              | `x.com/{user}/status/{id}`, `twitter.com/…` (also `www.` and `mobile.`)                                                                                                                | `data-theme`, `data-conversation`, `data-cards`, `data-align` or `align`, `data-lang`, `data-dnt`, `data-width`                                                | 550                              |
| Instagram      | script (`embed.js`), `instgrm.Embeds.process`                                            | `instagram.com/p/{code}/`, `/reel/`, `/reels/`, `/tv/`, `/{user}/p/{code}/`, `/{user}/reel/{code}/`                                                                                    | `data-instgrm-captioned`, `data-instgrm-version`                                                                                                               | 540                              |
| Threads        | script (`embed.js`), `instgrm.Embeds.process`                                            | `threads.com/@{user}/post/{code}`, `threads.com/t/{code}` (and `threads.net`)                                                                                                          | `data-theme`, `data-text-post-version`                                                                                                                         | 658                              |
| Facebook       | posts and video URLs: SDK (`sdk.js`), `FB.XFBML.parse`; video embed code: iframe         | see [Facebook](#facebook)                                                                                                                                                              | `data-width`, `data-show-text`, `data-lazy`, `data-allowfullscreen`, `data-autoplay`, `data-show-captions`; iframe query (`show_text`, `width`, …); SDK locale | posts 750, videos none           |
| TikTok         | iframe ([Embed Player](https://developers.tiktok.com/doc/embed-player))                  | `tiktok.com/@{user}/video/{id}`                                                                                                                                                        | every player query parameter                                                                                                                                   | 325                              |
| YouTube        | iframe                                                                                   | `youtube.com/watch?v={id}`, `youtu.be/{id}`, `/shorts/{id}`, `/embed/{id}`, `/live/{id}`, `youtube-nocookie.com/embed/{id}`; `t` and `start` are kept                                  | every player query parameter; the youtube-nocookie.com host                                                                                                    | none                             |
| Telegram       | iframe (`t.me/{post}?embed=1`), height from the frame                                    | `t.me/{channel}/{id}`, `t.me/s/{channel}/{id}`, `telegram.me/…`; `single` and `comment` are kept                                                                                       | `data-width`, `data-userpic`, `data-color`, `data-dark`, `data-dark-color`, `data-comment`, `data-mode`, `data-single`                                         | 500                              |
| Snapchat       | iframe (`{url}/embed`)                                                                   | see [Snapchat](#snapchat)                                                                                                                                                              | `data-snapchat-embed-width`, `data-snapchat-embed-height`, `data-snapchat-embed-title`                                                                         | 416                              |
| LinkedIn       | iframe, fixed height                                                                     | `linkedin.com/feed/update/urn:li:{activity\|share\|ugcPost}:{id}`, `linkedin.com/posts/{slug}-activity-{id}-…` (also country hosts such as `bg.`)                                      | iframe query (`collapsed`), `width`, `height`                                                                                                                  | embed code width, else 504       |
| Reddit         | iframe (`embed.reddit.com`), height from the frame                                       | `reddit.com/r/{sub}/comments/{id}/…`, comments `…/comments/{id}/comment/{commentId}/` (also `old.` and `new.`)                                                                         | `data-embed-height`, `data-embed-theme`, `data-embed-showmedia`, `data-embed-showtitle`, `data-embed-locale`, `data-embed-depth` and the other `data-embed-*`  | 640                              |
| Pinterest      | script (`pinit_main.js`), `PinUtils.build`                                               | `pinterest.com/pin/{id}/`, `/pin/{slug}--{id}/`, country hosts (`bg.pinterest.com`, `pinterest.co.uk`, …)                                                                              | `data-pin-width`, `data-pin-lang`, `data-pin-terse`                                                                                                            | the pin's width: 236, 345 or 600 |
| Spotify        | iframe (`open.spotify.com/embed/…`), fixed height                                        | `open.spotify.com/{track\|album\|playlist\|artist\|episode\|show\|audiobook\|chapter}/{id}`, also with an `intl-{lang}/` prefix                                                        | iframe query (`theme`, …; `utm_source` and `si` dropped), `height`; `/video` for a video show                                                                  | none                             |
| Vimeo          | iframe (`player.vimeo.com/video/{id}`)                                                   | `vimeo.com/{id}`, `vimeo.com/{id}/{hash}` (unlisted), `/channels/{name}/{id}`, `/groups/{name}/videos/{id}`, `/showcase/{id}/video/{id}`, `player.vimeo.com/video/{id}`; `#t=` is kept | every player query parameter (`app_id` and `player_id` dropped); `width` and `height`, or the responsive wrapper's ratio                                       | none                             |
| Twitch         | iframe (`player.twitch.tv`, `clips.twitch.tv/embed`), `parent` set in the browser        | `twitch.tv/{channel}`, `/videos/{id}` (`t` is kept), `/collections/{id}`, `/{channel}/clip/{slug}`, `clips.twitch.tv/{slug}` (also `www.` and `m.`)                                    | `autoplay`, `muted`, `time`, `width`, `height`; `parent` is dropped                                                                                            | none                             |
| Dailymotion    | iframe (`geo.dailymotion.com/player/{playerId}.html`), Player ID required                | `dailymotion.com/video/{id}`, `dailymotion.com/embed/video/{id}`, `dai.ly/{id}`                                                                                                        | the Player ID, every player query parameter; `width` and `height`, or the responsive wrapper's ratio                                                           | none                             |
| Bluesky        | iframe (`embed.bsky.app/embed/…`), height from the frame; `embed.js` is not loaded       | `bsky.app/profile/{did}/post/{rkey}` only: see [Bluesky](#bluesky)                                                                                                                     | `data-bluesky-uri`, `data-bluesky-cid`, `data-bluesky-embed-color-mode`                                                                                        | 600                              |
| SoundCloud     | iframe (`w.soundcloud.com/player`), fixed height                                         | `soundcloud.com/{user}/{track}`, `/{user}/sets/{playlist}`, `/{user}`, a private track's `/s-{token}`, `api.soundcloud.com/{tracks\|playlists\|users}/{id}` (also `www.` and `m.`)     | every player query parameter, `height`; the `url` parameter is the content                                                                                     | none                             |
| Apple Music    | iframe (`embed.music.apple.com`), fixed height                                           | `music.apple.com/{country}/{album\|song\|playlist}/{slug}/{id}`, a song on its album with `?i={id}`                                                                                    | `height`                                                                                                                                                       | 660                              |
| Apple Podcasts | iframe (`embed.podcasts.apple.com`), fixed height                                        | `podcasts.apple.com/{country}/podcast/{slug}/id{id}`, an episode with `?i={id}`                                                                                                        | `width`, `height`                                                                                                                                              | 640                              |
| Tumblr         | iframe (`embed.tumblr.com/embed/post/…`), height from the frame; `post.js` is not loaded | `www.tumblr.com/{blog}/{id}`, `{blog}.tumblr.com/post/{id}`, with or without the slug                                                                                                  | none                                                                                                                                                           | 540                              |
| Kick           | iframe (`player.kick.com/{channel}`)                                                     | `kick.com/{channel}`                                                                                                                                                                   | `autoplay`, `muted`, `width`, `height`                                                                                                                         | none                             |
| Giphy          | iframe (`giphy.com/embed/{id}`)                                                          | `giphy.com/gifs/{slug}-{id}`, `giphy.com/gifs/{id}`, `giphy.com/embed/{id}`, `media.giphy.com/media/{id}/giphy.gif`                                                                    | `width` and `height`, or the responsive wrapper's ratio                                                                                                        | none                             |

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
- **Video embed code that shows the post text** (`show_text=true`, the Embed dialog's "Include full post") renders through the SDK, like a post. The text below the player has its own height at every width, so no aspect ratio fits the iframe, and its own height cuts the text off. `show_text`, `allowfullscreen`, `autoplay` and `show_captions` carry over, `width` and `height` are kept as the player's size, and `t` is dropped.
- **That code without its text**: pass `showText={false}` to `FacebookEmbed`. The player's size is known from the embed code, so it renders as the plain iframe again, in a box of the player's aspect ratio. No script, and `maxHeight` applies:

  ```tsx
  <FacebookEmbed embed={embed} showText={false} maxHeight={640} />
  ```

  A 9:16 reel is then at most 358×638 px, where the same code with its text is 550×1233 px in a 550 px column. Facebook has no option for a shorter text: it is shown in full or not at all.

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

### Telegram

- The embed code is Telegram's widget `<script>` tag itself. It renders as the post's iframe, without the script: the frame reports its own height, and the embed follows it.
- Public channels and groups only: private links (`t.me/c/…`) are not recognised.

### Snapchat

- Every input renders Snapchat's `/embed` page for the content, in a 416:692 box unless the embed code gives another size.
- Recognised: Spotlight videos (`/spotlight/{id}`, `/@{user}/spotlight/{id}`), public profiles (`/@{user}`, `/add/{user}`), Lenses (`/lens/{id}`) and saved stories (`/@{user}/highlight/{id}`). A profile embed shows the account's public stories.
- A single public story (`/@{user}/{story id}`) and publisher stories (`/p/{id}`) have no embed page and are not recognised.
- On snapchat.com, the Embed button of a Spotlight video currently opens an app prompt instead of the code. The URL works.
- `data-snapchat-embed-style` is free-form CSS and is not applied.

### LinkedIn

- LinkedIn's frame neither scales nor reports its height. It keeps the embed code's height; a URL gets 670 px. A shorter post leaves space below it, and a longer one scrolls inside the frame. Pass `height` when you know better.
- In the EU, LinkedIn shows its own cookie banner inside the frame, over the top of the post, until the visitor answers it.

### Reddit

- Posts and single comments. The package builds the `embed.reddit.com` frame itself, without Reddit's script, and follows the height the frame reports.
- The address of the host page is not sent to Reddit (Reddit's script sends it as `embed_host_url`; the embed works without it).
- Reddit may machine-translate the post into the visitor's language; `locale` sets the language.
- No fallback content: Reddit's embed code holds only the title, author and subreddit links.

### Pinterest

- Pins render through Pinterest's widget. The oEmbed iframe code (`assets.pinterest.com/ext/embed.html`) renders through the widget too, because its fixed size fits only one width.
- The pin is drawn into the page, not an iframe, at a fixed width per `pinWidth`. Its classes start with `PIN_`, so host CSS can reach it.
- A host page that already loaded `pinit.js` or `pinit_main.js` is reused.
- Boards and profiles are not supported.

### Spotify

- Every input renders Spotify's player across the column at a fixed height: the embed code's, else 152 px for a track or episode (the compact player) and 352 px for the rest. `height` replaces it.
- Embed code for a video podcast (its iframe address ends in `/video`) renders the video player at its aspect ratio. A URL cannot tell a video show from an audio one, so it renders the audio player.
- The wrapper has Spotify's rounded corners (`border-radius: 12px`); `style` replaces them.

### Vimeo

- Vimeo's responsive embed code (a `div` with `padding:56.25% 0 0 0;position:relative;` around the iframe, then `player.js`) is recognised, and the padding is read as the video's aspect ratio. `player.js` is not loaded: the package sizes the frame itself.
- An unlisted video keeps its hash, from the URL or from the iframe's `h`.

### Twitch

- Twitch plays only when its `parent` parameter names the domain of the embedding page. The package drops every `parent` from the embed code and adds `parent={location.hostname}` when it creates the iframe in the browser, so the same code works on every domain and environment. Twitch's docs require HTTPS for the embedding page; `localhost` works.
- A page that is itself shown in another site's frame also needs that site as a `parent`, which the package cannot know. Render Twitch's iframe yourself there.
- Autoplay is Twitch's default (channels and videos play, clips do not) unless the embed code or `autoplay` says otherwise.
- Twitch's interactive JavaScript embed (`Twitch.Player`) is not supported.

### Dailymotion

- Dailymotion serves embeds only through a publisher's player, identified by a Player ID made in Dailymotion Studio. Its oEmbed code (`geo.dailymotion.com/player.html?video=…`) and the old `www.dailymotion.com/embed/video/{id}` have none, and Dailymotion answers them with 403.
- Embed code from Dailymotion Studio carries the Player ID (`geo.dailymotion.com/player/{playerId}.html?video={id}`) and renders as given, also inside Dailymotion's responsive wrapper `div`.
- URLs, and code without a Player ID, render only through `DailymotionEmbed` with your `playerId`. A `playerId` prop also replaces the one in the embed code. `<SocialEmbed>` takes none: for that input it renders nothing and calls `onError`.
- The package never uses a Player ID you did not give it.
- Playback with a publisher's own Player ID is not yet tested. The sample Player ID from Dailymotion's docs loads the player and plays, but its stream is refused after a few plays (`docs/decisions.md` D69), so the demo's Dailymotion page may show "Playback error".
- Playlists are not supported.

### Bluesky

- Embed code carries the post's permanent address (`at://did:…`), so it renders without a network request. A URL renders only when it names the account by its DID (`bsky.app/profile/did:plc:…/post/…`), as the post link in Bluesky's embed code does.
- A URL with a handle (`bsky.app/profile/alice.bsky.social/post/…`) needs a lookup to find the DID, and the package makes none: it renders nothing, and `onError` reports `social-embeds: a Bluesky URL needs a lookup: use the embed code`. `matchUrl` returns `null`.
- The post text from the embed code is rendered on the server and shown until the frame has loaded.

### SoundCloud

- A URL renders the visual player (large artwork) at 400 px, as SoundCloud's oEmbed does. Embed code keeps its own player and height: 166 px for the classic player, 300 px for the visual one from the Share dialog.
- The artist and track links that the Share dialog adds after the iframe are accepted and not rendered.
- A private track keeps its `secret_token`.

### Apple Music and Apple Podcasts

- Albums, songs and playlists from Apple Music; episodes and shows from Apple Podcasts. Apple's embed code has Apple's own `sandbox` and rounded corners, and so does every embed from a URL; `style` replaces the corners.
- Heights: 175 px for a song, 160 px for an episode, 450 px for an album, playlist or show; `height` replaces them.
- Music videos and artists are not supported: Apple offers no embed code for them.

### Tumblr

- Tumblr's embed code names the post by a token; the package renders it by blog name, which the post link in the same code gives, so URLs work too.

### Kick and Giphy

- Kick has no embed dialog: use a channel URL or Kick's player URL in an iframe. Videos and clips are not supported.
- Giphy's "via GIPHY" credit is accepted and not rendered. A URL carries no size and renders square; `maxWidth` keeps it small.

### Not supported

- Redirecting short links: `fb.watch/…`, Facebook share links (`/share/p/…`, `/share/v/…`), `vm.tiktok.com/…`, `vt.tiktok.com/…`, `redd.it/…`, Reddit share links (`/r/{sub}/s/…`), `pin.it/…`, `lnkd.in/…`, `t.snapchat.com/…`, `spotify.link/…`, `spotify.app.link/…`, `on.soundcloud.com/…` and `gph.is/…`. A redirect cannot be followed without a network request, and the package makes none. `matchUrl` returns `null`.
- Facebook group posts.
- Fetching embed code from oEmbed endpoints, consent gating and HTML sanitising: these stay with the host.

## Without React

`social-embeds/element` defines `<social-embed>`, a custom element for plain HTML, CMS templates, Vue, Svelte and Angular. It is one self-contained file with no React in it, about 28 KB gzipped.

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/social-embeds@0.6.0/dist/element.js"
  integrity="sha384-…"
  crossorigin="anonymous"
></script>

<social-embed url="https://www.youtube.com/watch?v=jNQXAC9IVRw"></social-embed>
```

Copy the real `integrity` hash from the file's page on jsDelivr (the package page's "Copy HTML + SRI" button). From npm, import it once: `import 'social-embeds/element'`. Importing defines the tag where `customElements` exists and does nothing in Node, so it is safe in server-rendered apps. The module exports the class as `SocialEmbedElement`.

Embed code goes in a `<template>`, which keeps the platform's own `<script>` from running:

```html
<social-embed max-width="540">
  <template>
    <!-- the platform's embed code, exactly as given -->
  </template>
</social-embed>
```

| Attribute    | Meaning                                                                         |
| ------------ | ------------------------------------------------------------------------------- |
| `url`        | A post URL.                                                                     |
| `width`      | A number means pixels; otherwise any CSS length.                                |
| `max-width`  | Pixels.                                                                         |
| `height`     | Pixels. Reaches only iframe-based platforms, as in React.                       |
| `max-height` | Pixels. Reaches only iframe-based platforms, as in React.                       |
| `eager`      | Load at once instead of when near the viewport (the inverse of React's `lazy`). |

The `html` property takes embed code from script. When several inputs are set, `html` wins over the `<template>`, and the `<template>` wins over `url`. Options come only from the embed code, as with `<SocialEmbed>`, and the element renders into the light DOM.

Child elements other than `<template>` are the placeholder until the embed loads; without any, a neutral skeleton shows. If the element connects while the document is still loading, it waits for `DOMContentLoaded` before reading its children.

It dispatches `load` (an `Event`) when the platform has rendered, and `error` (an `ErrorEvent`) when it cannot. `error.error` is an `Error` with the same message as React's `onError`. Neither event bubbles, both fire in a microtask, and only while the element is connected.

```js
const embed = document.querySelector('social-embed');
embed.addEventListener('load', () => console.log('rendered'));
embed.addEventListener('error', (event) => console.warn(event.error.message));
embed.html = post.embedCode;
```

Platform defaults (maximum width, height, rounded corners, placeholder) are shared with the React components, so the element looks the same.

Tell Vue and Angular that `social-embed` is a custom element:

```ts
// Vue: in the Vue plugin's template options (or on app.config)
compilerOptions: { isCustomElement: (tag) => tag === 'social-embed' }

// Angular: add CUSTOM_ELEMENTS_SCHEMA to the component's (or module's) schemas
@Component({ schemas: [CUSTOM_ELEMENTS_SCHEMA] /* … */ })
```

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
- **Iframe embeds** (YouTube, TikTok, Facebook video embed code, Telegram, Snapchat, LinkedIn, Reddit, Spotify, Vimeo, Twitch, Dailymotion): the iframe is added on the client, so `onLoad` can never be missed. Without JavaScript only the placeholder shows.
- **Pinterest**: the server HTML contains the pin's empty link and the placeholder.
- The server HTML never contains a platform `<script>`.

The platform's class (`twitter-tweet`, `instagram-media`, `text-post-media`) or Pinterest's `data-pin-do` is added only when the embed renders, so the platform scripts, which render every element with that marker on the page, cannot render embeds that have not come near the viewport yet. CSS that targets those classes does not apply to the fallback content before then.

## Responsiveness

The host does nothing to make embeds responsive:

- **Script-based embeds** (X, Instagram, Threads, Facebook SDK) get a wrapper of `width: 100%` (or `width`) and `max-width: {maxWidth}px`, and the platform widget fills it. Their height is the platform's own.
- **Iframe embeds** get a wrapper with `aspect-ratio` taken from the embed code's `width` and `height` (16:9 without them; 9:16 for TikTok and YouTube Shorts URLs; 416:692 for Snapchat), and the iframe fills it. `height` replaces the aspect ratio with a fixed height. `maxHeight` keeps the aspect ratio and lowers the wrapper's `max-width` to the widest box that is at most that tall.
- **Telegram and Reddit** get a wrapper of `width: 100%` and `max-width: {maxWidth}px` whose height follows the height the frame reports.
- **LinkedIn** and **Spotify** have a fixed height (see [LinkedIn](#linkedin) and [Spotify](#spotify)).
- **Pinterest** pins have a fixed width; the wrapper's `max-width` defaults to it.

## License

[MIT](./LICENSE.md)
