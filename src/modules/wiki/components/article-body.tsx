import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { headingId } from "../headings";
export default function ArticleBody({ content }: { content: string }) {
  let index = 0;
  const heading = (level: 1 | 2 | 3 | 4 | 5 | 6) =>
    function Heading({ children }: { children?: ReactNode }) {
      const Tag = `h${level}` as const;
      return (
        <Tag id={headingId(index++)} className="scroll-mt-28">
          {children}
        </Tag>
      );
    };
  return (
    <div className="prose prose-tfl max-w-none break-words [&_pre]:overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: heading(1),
          h2: heading(2),
          h3: heading(3),
          h4: heading(4),
          h5: heading(5),
          h6: heading(6),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
