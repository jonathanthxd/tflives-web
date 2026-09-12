export type ContentKind =
  "posts" | "modalities" | "wiki" | "categories" | "team" | "timeline";
export type Field = {
  key: string;
  type?:
    | "text"
    | "textarea"
    | "markdown"
    | "number"
    | "url"
    | "select"
    | "checkbox"
    | "tags"
    | "links"
    | "datetime-local";
  required?: boolean;
  options?: string[];
  translated?: boolean;
};
const title: Field = { key: "title", required: true, translated: true };
const slug: Field = { key: "slug", required: true };
const content: Field = {
  key: "content",
  type: "markdown",
  required: true,
  translated: true,
};
const order: Field = { key: "order", type: "number" };
const published: Field = { key: "published", type: "checkbox" };
const translations = true;
export const CONTENT_FIELDS: Record<ContentKind, Field[]> = {
  posts: [
    title,
    slug,
    { key: "locale", type: "select", options: ["es", "en"] },
    {
      key: "type",
      type: "select",
      options: ["NEWS", "UPDATE", "CHANGELOG", "EVENT", "MAINTENANCE", "PATCH"],
    },
    { key: "modalityId", type: "select" },
    { key: "excerpt", type: "textarea", translated: translations },
    content,
    { key: "image", type: "url" },
    { key: "tags", type: "tags" },
    published,
    { key: "scheduledFor", type: "datetime-local" },
    { key: "archived", type: "checkbox" },
  ],
  wiki: [
    title,
    slug,
    { key: "locale", type: "select", options: ["es", "en"] },
    { key: "categoryId", type: "select" },
    { key: "modalityId", type: "select" },
    { key: "excerpt", type: "textarea", translated: true },
    content,
    { key: "tags", type: "tags" },
    {
      key: "state",
      type: "select",
      options: ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"],
    },
    { key: "scheduledFor", type: "datetime-local" },
  ],
  categories: [{ key: "name", required: true, translated: true }, slug, order],
  modalities: [
    { key: "name", required: true, translated: true },
    slug,
    { key: "description", type: "textarea", translated: true },
    { ...content, required: false },
    {
      key: "status",
      type: "select",
      options: ["ONLINE", "MAINTENANCE", "COMING_SOON", "OFFLINE", "ARCHIVED"],
    },
    { key: "minecraftVersion" },
    { key: "icon" },
    { key: "banner", type: "url" },
    order,
    published,
  ],
  team: [
    { key: "username", required: true },
    { key: "roleTitle", required: true, translated: true },
    { key: "bio", type: "textarea", translated: true },
    { key: "socialLinks", type: "links" },
    order,
    { key: "active", type: "checkbox" },
  ],
  timeline: [
    title,
    { key: "dateLabel", required: true, translated: true },
    { key: "description", type: "textarea", required: true, translated: true },
    { key: "category" },
    { key: "image", type: "url" },
    order,
    published,
    { key: "archived", type: "checkbox" },
  ],
};
export const CONTENT_ENDPOINTS: Record<ContentKind, string> = {
  posts: "/api/posts",
  modalities: "/api/modalities",
  wiki: "/api/admin/wiki",
  categories: "/api/admin/wiki/categories",
  team: "/api/admin/team",
  timeline: "/api/admin/timeline",
};
