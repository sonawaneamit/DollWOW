#!/usr/bin/env python3
"""Build the editorial DollWow Ultimate Guide PDF from the canonical web manuscript."""

from __future__ import annotations

import html
import json
import re
import shutil
import urllib.request
from pathlib import Path

from PIL import Image as PILImage
from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import portrait
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    LongTable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content/learn/drafts/sex-doll-guide.md"
PRODUCT_GROUPS = ROOT / "content/learn/sex-doll-guide-products.json"
ASSET_DIR = ROOT / "public/images/learn/sex-doll-guide"
HERO = ROOT / "public/images/learn/sex-doll-guide.webp"
LOGO = ROOT / "public/images/brand/dollwow-black-gold-lockup.png"
TMP = ROOT / "tmp/pdfs/ultimate-guide-production-v3"
OUTPUT_DIR = ROOT / "output/pdf"
PUBLIC_DIR = ROOT / "public/guides"
OUTPUT = OUTPUT_DIR / "dollwow-complete-sex-doll-guide-2026.pdf"
PUBLIC_OUTPUT = PUBLIC_DIR / OUTPUT.name
DESKTOP_OUTPUT = Path.home() / "Desktop/DollWOW Complete Sex Doll Guide 2026.pdf"

PAGE_W, PAGE_H = portrait((7.5 * inch, 10 * inch))
MARGIN_X = 46
MARGIN_TOP = 46
MARGIN_BOTTOM = 48
CONTENT_W = PAGE_W - (MARGIN_X * 2)
CONTENT_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM

INK = colors.HexColor("#291F1A")
CHARCOAL = colors.HexColor("#171311")
MUTED = colors.HexColor("#74635A")
ACCENT = colors.HexColor("#B5471F")
PEACH = colors.HexColor("#EAB48F")
PAPER = colors.HexColor("#FAF6F2")
SOFT = colors.HexColor("#F1E6DE")
LINE = colors.HexColor("#D9CCC2")
GREEN = colors.HexColor("#285148")
BLUE = colors.HexColor("#38536B")
WHITE = colors.white

VISUALS = {
    "TPE, Silicone, and Hybrid Construction": "material-comparison.webp",
    "Size and Weight Matter More Than Buyers Expect": "size-and-handling.webp",
    "What Creates a Realistic Appearance": "realism-layers.webp",
    "Customization Starts With the Exact Product": "customization-order.webp",
    "Ready-to-Ship vs Custom Order": "ready-vs-custom.webp",
    "Which Doll Brand Is Right for You?": "se-doll-brand-spotlight.webp",
    "How to Evaluate a Listing": "listing-audit.webp",
}

VISUAL_CAPTIONS = {
    "TPE, Silicone, and Hybrid Construction": "Use material as the start of the comparison, then verify formulation, weight, care, and configuration for the exact product.",
    "Size and Weight Matter More Than Buyers Expect": "Height alone does not predict handling weight. Recheck current product measurements before ordering.",
    "What Creates a Realistic Appearance": "Evaluate realism in layers: sculpt, finish, styling, and evidence from the exact product gallery.",
    "Customization Starts With the Exact Product": "Choose the core body and head first, then verify compatibility for styling, structural upgrades, and optional functions.",
    "Ready-to-Ship vs Custom Order": "Ready-to-ship and custom orders solve different priorities. Confirm configuration and timing before checkout.",
    "Which Doll Brand Is Right for You?": "A brand profile is a starting point. Compare the exact body, material, measurements, options, and current catalog evidence.",
    "How to Evaluate a Listing": "A useful listing audit separates verified product facts from styling, optional upgrades, and details that still need confirmation.",
}

# These are supporting answer, worksheet, or reference sections inside the
# editorial sequence. They receive a strong section page without a separate
# full-page chapter opener so the finished edition stays dense and useful.
SECONDARY_SECTIONS = {
    "Quick Answer",
    "What This Guide Covers",
    "Product Comparison Worksheet",
    "Questions to Ask Before Checkout",
    "Pre-Purchase Checklist",
    "FAQs",
    "Glossary",
    "Next Steps",
}


def register_fonts() -> None:
    font_dir = Path("/System/Library/Fonts/Supplemental")
    pdfmetrics.registerFont(TTFont("DollWow", str(font_dir / "Arial.ttf")))
    pdfmetrics.registerFont(TTFont("DollWow-Bold", str(font_dir / "Arial Bold.ttf")))
    pdfmetrics.registerFont(TTFont("DollWow-Italic", str(font_dir / "Arial Italic.ttf")))
    pdfmetrics.registerFontFamily(
        "DollWow", normal="DollWow", bold="DollWow-Bold",
        italic="DollWow-Italic", boldItalic="DollWow-Bold",
    )


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def absolute_url(url: str) -> str:
    return f"https://dollwow.com{url}" if url.startswith("/") else url


def inline_markup(value: str) -> str:
    placeholders: list[str] = []

    def remember(fragment: str) -> str:
        placeholders.append(fragment)
        return f"@@HTML{len(placeholders) - 1}@@"

    value = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda match: remember(
            f'<link href="{html.escape(absolute_url(match.group(2)), quote=True)}" '
            f'color="#B5471F"><u>{html.escape(match.group(1))}</u></link>'
        ),
        value,
    )
    value = html.escape(value)
    value = re.sub(r"`([^`]+)`", r"<b>\1</b>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", value)
    for index, fragment in enumerate(placeholders):
        value = value.replace(f"@@HTML{index}@@", fragment)
    return value


def read_source() -> tuple[dict[str, str], str]:
    text = SOURCE.read_text(encoding="utf-8")
    _, raw_frontmatter, body = text.split("---", 2)
    metadata: dict[str, str] = {}
    for line in raw_frontmatter.strip().splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"')
    return metadata, body.strip()


def split_sections(body: str) -> list[tuple[str, list[str]]]:
    sections: list[tuple[str, list[str]]] = []
    current_title = "Introduction"
    current_lines: list[str] = []
    for line in body.splitlines():
        if line.startswith("# "):
            continue
        if line.startswith("## "):
            if current_lines:
                sections.append((current_title, current_lines))
            current_title = line[3:].strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        sections.append((current_title, current_lines))
    return [(title, lines) for title, lines in sections if title != "Introduction" or any(line.strip() for line in lines)]


def first_plain_paragraph(lines: list[str]) -> str:
    paragraph: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if paragraph:
                break
            continue
        if stripped.startswith(("### ", "- ", "| ")):
            if paragraph:
                break
            continue
        paragraph.append(re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", stripped))
    text = " ".join(paragraph)
    return text[:430].rsplit(" ", 1)[0] + "..." if len(text) > 430 else text


def make_styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle", parent=base["Title"], fontName="DollWow-Bold", fontSize=31,
            leading=34, textColor=INK, alignment=TA_LEFT, spaceAfter=12,
        ),
        "kicker": ParagraphStyle(
            "Kicker", parent=base["Normal"], fontName="DollWow-Bold", fontSize=8.5,
            leading=11, textColor=ACCENT, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontName="DollWow-Bold", fontSize=20,
            leading=24, textColor=INK, spaceBefore=5, spaceAfter=9, keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3", parent=base["Heading3"], fontName="DollWow-Bold", fontSize=13,
            leading=16, textColor=GREEN, spaceBefore=12, spaceAfter=5, keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["BodyText"], fontName="DollWow", fontSize=9.65,
            leading=14.1, textColor=INK, spaceAfter=7.2,
        ),
        "small": ParagraphStyle(
            "Small", parent=base["BodyText"], fontName="DollWow", fontSize=8,
            leading=11, textColor=MUTED, spaceAfter=5,
        ),
        "toc": ParagraphStyle(
            "Toc", parent=base["BodyText"], fontName="DollWow", fontSize=9.3,
            leading=12.2, textColor=INK, leftIndent=12, firstLineIndent=-12, spaceAfter=3,
        ),
        "table": ParagraphStyle(
            "Table", parent=base["BodyText"], fontName="DollWow", fontSize=7.1,
            leading=9.4, textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "TableHead", parent=base["BodyText"], fontName="DollWow-Bold", fontSize=7.2,
            leading=9.4, textColor=WHITE,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["BodyText"], fontName="DollWow", fontSize=9.5,
            leading=13.6, textColor=INK,
        ),
        "card_title": ParagraphStyle(
            "CardTitle", parent=base["BodyText"], fontName="DollWow-Bold", fontSize=10,
            leading=12, textColor=INK, spaceAfter=4,
        ),
        "card": ParagraphStyle(
            "Card", parent=base["BodyText"], fontName="DollWow", fontSize=7.6,
            leading=10, textColor=MUTED, spaceAfter=3,
        ),
    }


class ChapterOpener(Flowable):
    def __init__(self, number: int | None, title: str, summary: str):
        super().__init__()
        self.number = number
        self.title = title
        self.summary = summary
        self.width = CONTENT_W
        self.height = CONTENT_H

    def draw(self):
        canvas = self.canv
        canvas.saveState()
        canvas.setFillColor(CHARCOAL)
        canvas.roundRect(0, 0, self.width, self.height, 8, fill=1, stroke=0)
        canvas.setFillColor(ACCENT)
        canvas.rect(0, self.height - 10, self.width, 10, fill=1, stroke=0)
        canvas.setFillColor(PEACH)
        canvas.setFont("DollWow-Bold", 10)
        label = f"CHAPTER {self.number:02d}" if self.number is not None else "EDITORIAL NOTE"
        canvas.drawString(28, self.height - 54, label)
        canvas.setStrokeColor(colors.HexColor("#5A4439"))
        canvas.line(28, self.height - 72, self.width - 28, self.height - 72)
        title = Paragraph(
            html.escape(self.title),
            ParagraphStyle("OpenerTitle", fontName="DollWow-Bold", fontSize=29,
                           leading=32, textColor=PAPER),
        )
        _, title_height = title.wrap(self.width - 56, 210)
        title.drawOn(canvas, 28, self.height - 124 - title_height)
        summary = Paragraph(
            html.escape(self.summary),
            ParagraphStyle("OpenerSummary", fontName="DollWow", fontSize=12,
                           leading=18, textColor=colors.HexColor("#D8CCC4")),
        )
        _, summary_height = summary.wrap(self.width - 80, 220)
        summary.drawOn(canvas, 28, self.height - 185 - title_height - summary_height)
        canvas.setFillColor(ACCENT)
        canvas.circle(self.width - 54, 50, 20, fill=1, stroke=0)
        canvas.setFillColor(PAPER)
        canvas.setFont("DollWow-Bold", 9)
        canvas.drawCentredString(self.width - 54, 47, str(self.number) if self.number is not None else "DW")
        canvas.restoreState()


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            MARGIN_X,
            MARGIN_BOTTOM,
            CONTENT_W,
            CONTENT_H,
            id="content",
            showBoundary=0,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="guide", frames=[frame], onPage=self.draw_page))

    @staticmethod
    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.line(MARGIN_X, PAGE_H - 34, PAGE_W - MARGIN_X, PAGE_H - 34)
        canvas.setFont("DollWow-Bold", 7.3)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN_X, PAGE_H - 25, "DOLLWOW  /  COMPLETE BUYER'S GUIDE")
        canvas.line(MARGIN_X, 34, PAGE_W - MARGIN_X, 34)
        canvas.drawString(MARGIN_X, 22, "DOLLWOW.COM")
        canvas.drawRightString(PAGE_W - MARGIN_X, 22, f"{doc.page + 1:03d}")
        canvas.restoreState()


def make_table(rows: list[list[str]], styles) -> LongTable:
    rendered = []
    for row_index, row in enumerate(rows):
        style = styles["table_head"] if row_index == 0 else styles["table"]
        rendered.append([Paragraph(inline_markup(cell), style) for cell in row])
    col_widths = [CONTENT_W / len(rendered[0])] * len(rendered[0])
    table = LongTable(rendered, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def parse_blocks(lines: list[str], styles) -> list:
    story: list = []
    paragraphs: list[str] = []
    bullets: list[str] = []
    table_rows: list[list[str]] = []

    def flush_paragraphs():
        nonlocal paragraphs
        if paragraphs:
            text = " ".join(part.strip() for part in paragraphs)
            if not text.startswith("By Alex,"):
                story.append(Paragraph(inline_markup(text), styles["body"]))
            paragraphs = []

    def flush_bullets():
        nonlocal bullets
        if bullets:
            items = [ListItem(Paragraph(inline_markup(item), styles["bullet"])) for item in bullets]
            story.append(ListFlowable(items, bulletType="bullet", bulletFontName="DollWow-Bold",
                                      bulletColor=ACCENT, leftIndent=18, bulletFontSize=7, spaceAfter=7))
            bullets = []

    def flush_table():
        nonlocal table_rows
        if table_rows:
            cleaned = [row for row in table_rows if not all(re.fullmatch(r"\s*:?-{3,}:?\s*", cell) for cell in row)]
            story.extend([Spacer(1, 3), make_table(cleaned, styles), Spacer(1, 8)])
            table_rows = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("### "):
            flush_paragraphs(); flush_bullets(); flush_table()
            title = stripped[4:].strip()
            story.append(Paragraph(f'<a name="{slugify(title)}"/>{inline_markup(title)}', styles["h3"]))
        elif stripped.startswith("| ") and stripped.endswith(" |"):
            flush_paragraphs(); flush_bullets()
            table_rows.append([cell.strip() for cell in stripped.strip("|").split("|")])
        elif stripped.startswith("- "):
            flush_paragraphs(); flush_table()
            bullets.append(stripped[2:].strip())
        elif not stripped:
            flush_paragraphs(); flush_bullets(); flush_table()
        else:
            flush_bullets(); flush_table()
            paragraphs.append(stripped)
    flush_paragraphs(); flush_bullets(); flush_table()
    return story


def visual_page(path: Path, caption: str, styles) -> list:
    image = Image(str(path))
    image._restrictSize(CONTENT_W, CONTENT_H - 52)
    return [
        Spacer(1, 4),
        image,
        Spacer(1, 8),
        Paragraph(html.escape(caption), styles["small"]),
        PageBreak(),
    ]


def latest_shortlist_snapshot() -> dict:
    matches = sorted(ROOT.glob("data/exports/seo-intelligence/*/ultimate-guide-product-shortlist/shortlist-snapshot.json"))
    return json.loads(matches[-1].read_text(encoding="utf-8")) if matches else {"rows": []}


def fetch_product_image(row: dict) -> Path | None:
    url = row.get("imageUrl")
    if not url:
        return None
    destination = TMP / "product-images" / f"{row['handle']}.jpg"
    if destination.exists():
        try:
            normalize_product_image(destination)
            return destination
        except Exception:
            destination.unlink(missing_ok=True)
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "DollWow-Guide-Builder/1.0"})
        with urllib.request.urlopen(request, timeout=25) as response:
            destination.write_bytes(response.read())
        normalize_product_image(destination)
        ImageReader(str(destination))
        return destination
    except Exception as exc:
        print(f"Image skipped for {row.get('handle')}: {exc}")
        destination.unlink(missing_ok=True)
        return None


def normalize_product_image(path: Path) -> None:
    with PILImage.open(path) as source:
        image = source.convert("RGB")
        image.thumbnail((640, 640), PILImage.Resampling.LANCZOS)
        image.save(path, "JPEG", quality=84, optimize=True, progressive=True)


def product_card(row: dict, reason: str, styles) -> Table:
    contents: list = []
    image_path = fetch_product_image(row)
    if image_path:
        image = Image(str(image_path))
        image._restrictSize(2.18 * inch, 1.75 * inch)
        contents.extend([image, Spacer(1, 5)])
    contents.append(Paragraph(html.escape(row.get("title") or row.get("handle", "Product")), styles["card_title"]))
    facts = [row.get("brand"), row.get("material")]
    if row.get("heightCm"):
        facts.append(f"{row.get('heightUs')} / {row.get('heightCm')} cm")
    if row.get("weightLb"):
        facts.append(f"{row.get('weightLb')} lb / {row.get('weightKg')} kg")
    else:
        facts.append("Weight: confirm before purchase")
    contents.append(Paragraph(html.escape(" | ".join(str(value) for value in facts if value)), styles["card"]))
    if row.get("startingPrice") and row.get("currency"):
        contents.append(Paragraph(f"Starting catalog price: {html.escape(str(row['currency']))} {html.escape(str(row['startingPrice']))}", styles["card"]))
    contents.append(Paragraph(f"<b>Why included:</b> {html.escape(reason)}", styles["card"]))
    if row.get("canonicalUrl"):
        contents.append(Paragraph(f'<link href="{html.escape(row["canonicalUrl"], quote=True)}" color="#B5471F"><u>View current product</u></link>', styles["card"]))
    card = Table([[contents]], colWidths=[(CONTENT_W - 14) / 2], hAlign="LEFT")
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.55, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return card


def product_shortlist_story(styles) -> list:
    definitions = json.loads(PRODUCT_GROUPS.read_text(encoding="utf-8"))
    snapshot = latest_shortlist_snapshot()
    by_handle = {row["handle"]: row for row in snapshot.get("rows", [])}
    story: list = []
    for group in definitions:
        cards = []
        for item in group["items"]:
            row = by_handle.get(item["handle"])
            if row:
                cards.append(product_card(row, item["reason"], styles))
        if not cards:
            continue
        story.extend([
            PageBreak(),
            Paragraph("LIVE CATALOG COMPARISON", styles["kicker"]),
            Paragraph(inline_markup(group["title"]), styles["h2"]),
            Paragraph(inline_markup(group["description"]), styles["body"]),
            Paragraph(
                "These examples are not a popularity ranking. Recheck current price, stock, specifications, and options on the linked product page.",
                styles["small"],
            ),
            Spacer(1, 5),
        ])
        rows = [cards[index:index + 2] for index in range(0, len(cards), 2)]
        grid = Table(rows, colWidths=[CONTENT_W / 2] * 2, hAlign="LEFT")
        grid.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(grid)
    return story


def make_toc(sections: list[tuple[str, list[str]]], styles):
    entries = []
    toc_sections = [(heading, lines) for heading, lines in sections if heading != "Introduction"]
    for index, (heading, _) in enumerate(toc_sections, start=1):
        entries.append(Paragraph(
            f'<link href="#{slugify(heading)}" color="#291F1A"><font name="DollWow-Bold" '
            f'color="#B5471F">{index:02d}</font>&nbsp;&nbsp;{html.escape(heading)}</link>',
            styles["toc"],
        ))
    midpoint = (len(entries) + 1) // 2
    return Table([[entries[:midpoint], entries[midpoint:]]], colWidths=[CONTENT_W / 2] * 2,
                 style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                                   ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("RIGHTPADDING", (0, 0), (-1, -1), 13)]))


def build_content_pdf(metadata: dict[str, str], body: str, destination: Path) -> None:
    styles = make_styles()
    sections = split_sections(body)
    doc = GuideDocTemplate(
        str(destination), pagesize=(PAGE_W, PAGE_H), leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM, title=metadata.get("title", "DollWow Complete Guide"),
        author="Alex, DollWow Product Educator", subject=metadata.get("description", ""), creator="DollWow",
    )
    story: list = [
        Paragraph("THE COMPLETE 2026 BUYER'S EDITION", styles["kicker"]),
        Paragraph("Contents", styles["cover_title"]),
        Paragraph(
            "A buyer-first reference to materials, dimensions, handling, customization, brands, fulfillment, care, privacy, and product verification.",
            styles["body"],
        ),
        Spacer(1, 5),
        make_toc(sections, styles),
        Spacer(1, 10),
        Paragraph(
            "Written by <b>Alex</b>, Doll Collector and DollWow Product Educator with 20+ years of experience. "
            "Care and intimacy education reviewed by <b>Jesse</b>, Licensed Sexologist and DollWow Intimacy Education Editor. "
            "Last reviewed August 10, 2026.",
            styles["small"],
        ),
        PageBreak(),
        Paragraph("HOW TO USE THIS GUIDE", styles["kicker"]),
        Paragraph("Start with constraints. Then compare preferences.", styles["cover_title"]),
        Paragraph(
            "The practical sequence is material, weight, size, storage, cleaning, order type, budget, and support. "
            "Appearance and customization come next. This order keeps a compelling photograph from hiding an impractical ownership routine.",
            styles["body"],
        ),
        Paragraph(
            "Measurements use US and metric units where source data is available. Product examples are dated comparison snapshots, not promises of current price or stock. "
            "Every product and collection link opens the current DollWow page for verification.",
            styles["body"],
        ),
        KeepTogether([
            Paragraph("Quick paths", styles["h3"]),
            Paragraph(
                '<link href="https://dollwow.com/shop/sex-dolls" color="#B5471F"><u>Browse all dolls</u></link>'
                '&nbsp;&nbsp;&nbsp; <link href="https://dollwow.com/learn" color="#B5471F"><u>Learning Center</u></link>'
                '&nbsp;&nbsp;&nbsp; <link href="https://dollwow.com/support" color="#B5471F"><u>Ask support</u></link>',
                styles["body"],
            ),
        ]),
    ]

    shortlist_inserted = False
    chapter_number = 0
    for _, (title, lines) in enumerate(sections, start=1):
        summary = first_plain_paragraph(lines) or "A practical reference for comparing current products and making a more informed decision."
        if title == "Introduction":
            story.extend([
                PageBreak(),
                ChapterOpener(
                    None,
                    "About This Guide",
                    "Written by Alex, Doll Collector and DollWow Product Educator with 20+ years of experience. Care and intimacy education is reviewed by Jesse, Licensed Sexologist and DollWow Intimacy Education Editor.",
                ),
            ])
            continue
        if title in SECONDARY_SECTIONS:
            story.extend([
                PageBreak(),
                Paragraph(f'<a name="{slugify(title)}"/>{inline_markup(title)}', styles["h2"]),
            ])
        else:
            chapter_number += 1
            story.extend([
                PageBreak(),
                ChapterOpener(chapter_number, title, summary),
                PageBreak(),
            ])
        if title in VISUALS:
            visual_path = ASSET_DIR / VISUALS[title]
            if visual_path.exists():
                story.extend(visual_page(visual_path, VISUAL_CAPTIONS[title], styles))
        if title not in SECONDARY_SECTIONS:
            story.append(Paragraph(f'<a name="{slugify(title)}"/>{inline_markup(title)}', styles["h2"]))
        story.extend(parse_blocks(lines, styles))
        if title == "Curated Live Product Shortlists" and not shortlist_inserted:
            story.extend(product_shortlist_story(styles))
            shortlist_inserted = True

    story.extend([
        PageBreak(),
        Paragraph("KEEP THIS GUIDE CURRENT", styles["kicker"]),
        Paragraph("A useful guide should improve with the catalog.", styles["cover_title"]),
        Paragraph(
            "DollWow reviews this edition as products, materials, brand options, care instructions, and buyer questions change. "
            "For the latest searchable edition, visit "
            '<link href="https://dollwow.com/learn/sex-doll-guide" color="#B5471F"><u>dollwow.com/learn/sex-doll-guide</u></link>.',
            styles["body"],
        ),
    ])
    doc.build(story)


def cover_pdf(destination: Path) -> None:
    from reportlab.pdfgen.canvas import Canvas

    canvas = Canvas(str(destination), pagesize=(PAGE_W, PAGE_H))
    canvas.setFillColor(CHARCOAL)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    if HERO.exists():
        cover_portrait = TMP / "cover-product.jpg"
        with PILImage.open(HERO) as source:
            source = source.convert("RGB")
            left = round(source.width * 0.50)
            crop_width = source.width - left
            panel_height = PAGE_H * 0.54
            target_ratio = PAGE_W / panel_height
            crop_height = min(source.height, round(crop_width / target_ratio))
            top = max(0, min(source.height - crop_height, round((source.height - crop_height) * 0.32)))
            portrait_image = source.crop((left, top, source.width, top + crop_height))
            portrait_image.save(cover_portrait, "JPEG", quality=90, optimize=True, progressive=True)
        image = ImageReader(str(cover_portrait))
        target_h = PAGE_H * 0.54
        canvas.drawImage(image, 0, PAGE_H - target_h, width=PAGE_W, height=target_h, mask="auto")
        canvas.setFillColor(colors.Color(0.09, 0.07, 0.06, alpha=0.16))
        canvas.rect(0, PAGE_H * 0.46, PAGE_W, PAGE_H * 0.54, fill=1, stroke=0)
    canvas.setFillColor(PAPER)
    canvas.setFont("DollWow-Bold", 28)
    canvas.drawString(42, 250, "THE COMPLETE GUIDE")
    canvas.drawString(42, 214, "TO CHOOSING A SEX DOLL")
    canvas.setFillColor(PEACH)
    canvas.setFont("DollWow-Bold", 9)
    canvas.drawString(44, 285, "THE 2026 BUYER'S EDITION")
    canvas.setFillColor(colors.HexColor("#D8CCC4"))
    canvas.setFont("DollWow", 11)
    canvas.drawString(44, 174, "Materials, size, handling, brands, customization, privacy, care, and buyer protection.")
    canvas.setFillColor(ACCENT)
    canvas.rect(44, 142, 110, 5, fill=1, stroke=0)
    canvas.setFillColor(PEACH)
    canvas.setFont("DollWow-Bold", 9)
    canvas.drawString(44, 105, "BY ALEX  /  CARE REVIEW BY JESSE")
    if LOGO.exists():
        canvas.drawImage(str(LOGO), PAGE_W - 190, 45, width=145, height=43, preserveAspectRatio=True, mask="auto")
    canvas.showPage()
    canvas.save()


def merge_pdfs(cover_path: Path, content_path: Path, destination: Path) -> None:
    writer = PdfWriter()
    for source in (cover_path, content_path):
        reader = PdfReader(str(source))
        writer.append(reader, import_outline=True)
    writer.add_metadata({
        "/Title": "The Complete Guide to Choosing a Sex Doll",
        "/Author": "Alex, DollWow Product Educator",
        "/Subject": "DollWow's 2026 guide to materials, size, care, customization, privacy, and buying safely.",
        "/Keywords": "sex doll guide, sex doll buying guide, TPE vs silicone, sex doll care",
        "/Creator": "DollWow",
    })
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as stream:
        writer.write(stream)


def main() -> None:
    register_fonts()
    metadata, body = read_source()
    TMP.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    cover_path = TMP / "cover.pdf"
    content_path = TMP / "content.pdf"
    cover_pdf(cover_path)
    build_content_pdf(metadata, body, content_path)
    merge_pdfs(cover_path, content_path, OUTPUT)
    shutil.copy2(OUTPUT, PUBLIC_OUTPUT)
    shutil.copy2(OUTPUT, DESKTOP_OUTPUT)
    page_count = len(PdfReader(str(OUTPUT)).pages)
    print(f"Built {page_count} pages")
    print(OUTPUT)
    print(PUBLIC_OUTPUT)
    print(DESKTOP_OUTPUT)


if __name__ == "__main__":
    main()
