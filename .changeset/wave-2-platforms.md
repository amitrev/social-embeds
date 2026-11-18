---
'social-embeds': minor
---

Add Telegram, Snapchat, LinkedIn, Reddit and Pinterest: `TelegramEmbed`, `SnapchatEmbed`, `LinkedInEmbed`, `RedditEmbed` and `PinterestEmbed`, routed by `<SocialEmbed>` and recognised by `parseEmbed` and `matchUrl`. `ParsedEmbed['platform']` has five new values, so a `switch` over every platform needs the new cases.
