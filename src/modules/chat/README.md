# chat

v0.3 global, floating community chat. It has exactly one immutable global
channel, cursor pagination, replies, Unicode reactions, official stickers,
mentions, reporting, local block filtering and a Vercel-safe incremental
polling fallback. Persistent data and authorization live in the service/API
layer; this folder's client components do not authorise mutations.

## Emoji and reaction UX

TFLives renders its own in-app Unicode emoji manager rather than opening the
operating-system emoji picker. The quick reaction row starts with 👍, ❤️ and 😂,
plus a `+` action that opens the full categorized catalogue. Quick slots adapt
locally using a decayed frequency score: repeated recent use can replace a
default, while one accidental use does not immediately reshuffle the bar.

The composer picker unifies Unicode emoji and official stickers. The shared
picker already exposes a `customEmojis` contract so a future admin-backed
custom emoji catalogue can be added without redesigning the picker. Custom
emoji persistence/rendering is intentionally not introduced by this UX patch;
o database migration is required.
