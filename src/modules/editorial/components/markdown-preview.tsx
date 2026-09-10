import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownPreview({ content }: { content: string }) {
  const t = useTranslations("Content");
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground/50 italic">
        {t("noPreview")}
      </p>
    );
  }
  return (
    <div className="prose prose-tfl max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
