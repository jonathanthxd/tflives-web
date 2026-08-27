import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-muted-foreground/50 italic">Nada para previsualizar todavía.</p>;
  }
  return (
    <div className="prose prose-tfl max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
