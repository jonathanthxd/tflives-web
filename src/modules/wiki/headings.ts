import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";

/** Parse the same Markdown grammar used by the renderer, including setext headings. */
export function headingId(index: number) {
  return `section-${index + 1}`;
}
export function articleHeadings(content: string) {
  const headings: { id: string; text: string; level: number }[] = [];
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  function text(node: RootContent): string {
    if ("value" in node) return node.value;
    if ("children" in node)
      return node.children.map((child) => text(child as RootContent)).join("");
    return "";
  }
  function walk(node: Root | RootContent) {
    if (node.type === "heading")
      headings.push({
        id: headingId(headings.length),
        text: text(node),
        level: node.depth,
      });
    if ("children" in node)
      node.children.forEach((child) => walk(child as RootContent));
  }
  walk(tree);
  return headings;
}
