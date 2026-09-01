import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "a",
  "abbr",
  "article",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "dd",
  "del",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "s",
  "section",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
];

const ALLOWED_ATTR = [
  "alt",
  "class",
  "colspan",
  "href",
  "id",
  "rel",
  "rowspan",
  "src",
  "srcset",
  "target",
  "title",
  "type",
  "width",
  "height",
  "loading",
  "sizes",
  "decoding",
  // 图片预览触发器的图片地址（后端 ~~[查看图片]url~~ 语法生成）
  "data-preview-url",
];

const config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ["target"],
};

function sanitizeServerHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form|base|meta|link)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|base|meta|link)\b[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(?:href|src|srcset)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|\s*javascript:[^\s>]+)/gi, "");
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return sanitizeServerHtml(html);
  return DOMPurify.sanitize(html, config);
}
