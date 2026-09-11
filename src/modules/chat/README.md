# chat

v0.3 global, floating community chat. It has exactly one immutable global
channel, cursor pagination, replies, curated reactions, official stickers,
mentions, reporting, local block filtering and a Vercel-safe incremental
polling fallback. Persistent data and authorization live in the service/API
layer; this folder's client components do not authorise mutations.
