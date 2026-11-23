import { Fragment } from "react";

/** **negrito** dentro de uma linha, sem nunca interpretar HTML. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * O texto de uma resposta da IA: parágrafos, listas com "-" ou "1." e **negrito**. Tudo vira
 * texto do React (nada de HTML), então nada que a IA escreva vira código na página.
 */
export function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`l${blocks.length}`} className={`${list.ordered ? "list-decimal" : "list-disc"} flex flex-col gap-0.5 pl-5`}>
        {list.items.map((it, i) => (
          <li key={i}>{inline(it)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      heading ? (
        <p key={`p${blocks.length}`} className="font-semibold">
          {inline(heading[1])}
        </p>
      ) : (
        <p key={`p${blocks.length}`}>{inline(line)}</p>
      ),
    );
  }
  flush();
  return <div className="flex flex-col gap-2">{blocks}</div>;
}
