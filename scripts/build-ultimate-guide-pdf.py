#!/usr/bin/env python3
"""Build the downloadable DollWow guide from the web guide Markdown source."""

from __future__ import annotations

import html
import importlib.util
import re
import shutil
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import portrait
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    LongTable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content/learn/drafts/sex-doll-guide.md"
SAMPLE_BUILDER = ROOT / "tmp/pdfs/build_guide_visual_sample.py"
TMP = ROOT / "tmp/pdfs/ultimate-guide-production"
OUTPUT_DIR = ROOT / "output/pdf"
PUBLIC_DIR = ROOT / "public/guides"
OUTPUT = OUTPUT_DIR / "dollwow-complete-sex-doll-guide-2026.pdf"
PUBLIC_OUTPUT = PUBLIC_DIR / OUTPUT.name
DESKTOP_OUTPUT = Path.home() / "Desktop/DollWOW Complete Sex Doll Guide 2026.pdf"

PAGE_W, PAGE_H = portrait((7.5 * inch, 10 * inch))
INK = colors.HexColor("#291F1A")
MUTED = colors.HexColor("#74635A")
ACCENT = colors.HexColor("#B5471F")
PEACH = colors.HexColor("#EAB48F")
PAPER = colors.HexColor("#FAF6F2")
SOFT = colors.HexColor("#F1E6DE")
LINE = colors.HexColor("#D9CCC2")
GREEN = colors.HexColor("#285148")
WHITE = colors.white


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
    if url.startswith("/"):
        return f"https://dollwow.com{url}"
    return url


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


def read_source() -> tuple[dict[str, str], list[str]]:
    text = SOURCE.read_text(encoding="utf-8")
    _, raw_frontmatter, body = text.split("---", 2)
    metadata: dict[str, str] = {}
    for line in raw_frontmatter.strip().splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"')
    return metadata, body.strip().splitlines()


def make_styles():
    base = getSampleStyleSheet()
    return {
        "cover": ParagraphStyle(
            "Cover", parent=base["Title"], fontName="DollWow-Bold", fontSize=30,
            leading=34, textColor=INK, alignment=TA_LEFT, spaceAfter=14,
        ),
        "kicker": ParagraphStyle(
            "Kicker", parent=base["Normal"], fontName="DollWow-Bold", fontSize=8.5,
            leading=11, textColor=ACCENT, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontName="DollWow-Bold", fontSize=20,
            leading=24, textColor=INK, spaceBefore=18, spaceAfter=9, keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3", parent=base["Heading3"], fontName="DollWow-Bold", fontSize=14,
            leading=18, textColor=GREEN, spaceBefore=13, spaceAfter=6, keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["BodyText"], fontName="DollWow", fontSize=10.2,
            leading=15.2, textColor=INK, spaceAfter=8,
        ),
        "small": ParagraphStyle(
            "Small", parent=base["BodyText"], fontName="DollWow", fontSize=8.2,
            leading=11.2, textColor=MUTED, spaceAfter=5,
        ),
        "toc": ParagraphStyle(
            "Toc", parent=base["BodyText"], fontName="DollWow", fontSize=10.2,
            leading=14, textColor=INK, leftIndent=12, firstLineIndent=-12, spaceAfter=4,
        ),
        "table": ParagraphStyle(
            "Table", parent=base["BodyText"], fontName="DollWow", fontSize=7.6,
            leading=10.2, textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "TableHead", parent=base["BodyText"], fontName="DollWow-Bold", fontSize=7.8,
            leading=10.2, textColor=WHITE,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["BodyText"], fontName="DollWow", fontSize=10,
            leading=14.5, textColor=INK, leftIndent=4,
        ),
    }


def make_table(rows: list[list[str]], styles) -> LongTable:
    rendered = []
    for row_index, row in enumerate(rows):
        style = styles["table_head"] if row_index == 0 else styles["table"]
        rendered.append([Paragraph(inline_markup(cell), style) for cell in row])
    available = PAGE_W - 92
    col_widths = [available / len(rendered[0])] * len(rendered[0])
    table = LongTable(rendered, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def parse_story(lines: list[str], styles):
    story = []
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
                                      bulletColor=ACCENT, leftIndent=18, bulletFontSize=8, spaceAfter=8))
            bullets = []

    def flush_table():
        nonlocal table_rows
        if table_rows:
            cleaned = [row for row in table_rows if not all(re.fullmatch(r"\s*:?-{3,}:?\s*", cell) for cell in row)]
            story.append(Spacer(1, 4))
            story.append(make_table(cleaned, styles))
            story.append(Spacer(1, 10))
            table_rows = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# "):
            continue
        if stripped.startswith("## "):
            flush_paragraphs(); flush_bullets(); flush_table()
            title = stripped[3:].strip()
            anchor = slugify(title)
            story.append(Paragraph(f'<a name="{anchor}"/>{inline_markup(title)}', styles["h2"]))
            continue
        if stripped.startswith("### "):
            flush_paragraphs(); flush_bullets(); flush_table()
            title = stripped[4:].strip()
            anchor = slugify(title)
            story.append(Paragraph(f'<a name="{anchor}"/>{inline_markup(title)}', styles["h3"]))
            continue
        if stripped.startswith("| ") and stripped.endswith(" |"):
            flush_paragraphs(); flush_bullets()
            table_rows.append([cell.strip() for cell in stripped.strip("|").split("|")])
            continue
        if stripped.startswith("- "):
            flush_paragraphs(); flush_table()
            bullets.append(stripped[2:].strip())
            continue
        if not stripped:
            flush_paragraphs(); flush_bullets(); flush_table()
            continue
        flush_bullets(); flush_table()
        paragraphs.append(stripped)

    flush_paragraphs(); flush_bullets(); flush_table()
    return story


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(46, 48, PAGE_W - 92, PAGE_H - 92, id="content")
        self.addPageTemplates(PageTemplate(id="guide", frames=[frame], onPage=self.draw_page))

    @staticmethod
    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.line(46, PAGE_H - 34, PAGE_W - 46, PAGE_H - 34)
        canvas.setFont("DollWow-Bold", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(46, PAGE_H - 25, "DOLLWOW  /  COMPLETE BUYER'S GUIDE")
        canvas.line(46, 34, PAGE_W - 46, 34)
        canvas.drawString(46, 22, "DOLLWOW.COM")
        canvas.drawRightString(PAGE_W - 46, 22, f"{doc.page + 4:02d}")
        canvas.restoreState()


def generate_visual_pages() -> list[Path]:
    TMP.mkdir(parents=True, exist_ok=True)
    spec = importlib.util.spec_from_file_location("guide_sample", SAMPLE_BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)

    def production_footer(draw, page_no, dark=False):
        color = "#CBBFB7" if dark else module.MUTED
        line = "#4E433D" if dark else module.LINE
        draw.line((100, module.H - 112, module.W - 100, module.H - 112), fill=line, width=2)
        draw.text((100, module.H - 82), "DOLLWOW.COM", font=module.font(24, "demi"), fill=color)
        label = f"COMPLETE BUYER'S GUIDE  /  {page_no:02d}"
        width = draw.textlength(label, font=module.font(22, "medium"))
        draw.text((module.W - 100 - width, module.H - 82), label,
                  font=module.font(22, "medium"), fill=color)

    module.page_footer = production_footer
    pages = [module.build_cover(), module.build_material_page(), module.build_size_page(), module.build_care_page()]
    paths = []
    for index, page in enumerate(pages, start=1):
        path = TMP / f"visual-{index:02d}.png"
        page.save(path, optimize=True)
        paths.append(path)
    return paths


def image_pdf(image_paths: list[Path], destination: Path) -> None:
    from reportlab.pdfgen.canvas import Canvas

    canvas = Canvas(str(destination), pagesize=(PAGE_W, PAGE_H))
    for path in image_paths:
        canvas.drawImage(str(path), 0, 0, width=PAGE_W, height=PAGE_H)
        canvas.showPage()
    canvas.save()


def make_toc(lines: list[str], styles):
    headings = [line[3:].strip() for line in lines if line.startswith("## ")]
    midpoint = (len(headings) + 1) // 2
    columns = []
    for column_index, subset in enumerate((headings[:midpoint], headings[midpoint:])):
        column = []
        start = 1 if column_index == 0 else midpoint + 1
        for index, heading in enumerate(subset, start=start):
            anchor = slugify(heading)
            column.append(Paragraph(
                f'<link href="#{anchor}" color="#291F1A"><font name="DollWow-Bold" '
                f'color="#B5471F">{index:02d}</font>&nbsp;&nbsp;{html.escape(heading)}</link>',
                styles["toc"],
            ))
        columns.append(column)
    return LongTable([columns], colWidths=[(PAGE_W - 104) / 2] * 2,
                     style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                                       ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                       ("RIGHTPADDING", (0, 0), (-1, -1), 14)]))


def build_content_pdf(metadata: dict[str, str], lines: list[str], destination: Path) -> None:
    styles = make_styles()
    doc = GuideDocTemplate(
        str(destination), pagesize=(PAGE_W, PAGE_H), leftMargin=46, rightMargin=46,
        topMargin=46, bottomMargin=46, title=metadata.get("title", "DollWow Complete Guide"),
        author="Alex, DollWow Product Educator", subject=metadata.get("description", ""),
        creator="DollWow",
    )
    story = [
        Paragraph("THE COMPLETE 2026 BUYER'S EDITION", styles["kicker"]),
        Paragraph("Contents", styles["cover"]),
        Paragraph(
            "Use this guide as a decision framework, then verify current product specifications, "
            "options, pricing, stock, and delivery details on DollWow before ordering.", styles["body"],
        ),
        Spacer(1, 6),
        make_toc(lines, styles),
        Spacer(1, 14),
        Paragraph(
            "Written by <b>Alex</b>, Doll Collector and DollWow Product Educator with 20+ years "
            "of experience. Care and intimacy education reviewed by <b>Jesse</b>, Licensed "
            "Sexologist and DollWow Intimacy Education Editor. Last reviewed August 10, 2026.",
            styles["small"],
        ),
        PageBreak(),
        Paragraph("HOW TO USE THIS GUIDE", styles["kicker"]),
        Paragraph("Start with constraints. Then compare preferences.", styles["cover"]),
        Paragraph(
            "The most useful buying sequence is material, weight, size, storage, cleaning, order "
            "type, budget, and support. Appearance and customization come next. This order keeps "
            "a compelling product photo from hiding an impractical ownership routine.", styles["body"],
        ),
        Paragraph(
            "All measurements use US and metric units where source data is available. Product "
            "examples are snapshots, not promises of current price or stock. Links in this PDF "
            "open the current DollWow page so readers can verify live details.", styles["body"],
        ),
        KeepTogether([
            Paragraph("Quick paths", styles["h3"]),
            Paragraph(
                '<link href="https://dollwow.com/shop/sex-dolls" color="#B5471F"><u>Browse all dolls</u></link>'
                '&nbsp;&nbsp;&nbsp; <link href="https://dollwow.com/learn" color="#B5471F"><u>Open the Learning Center</u></link>'
                '&nbsp;&nbsp;&nbsp; <link href="https://dollwow.com/support" color="#B5471F"><u>Ask DollWow support</u></link>',
                styles["body"],
            ),
        ]),
        PageBreak(),
    ]
    story.extend(parse_story(lines, styles))
    story.extend([
        Spacer(1, 14),
        Paragraph("KEEP THIS GUIDE CURRENT", styles["kicker"]),
        Paragraph("A useful guide should improve with the catalog.", styles["h2"]),
        Paragraph(
            "DollWow reviews this edition as materials, brands, product options, care instructions, "
            "and buyer questions change. For the latest version, visit "
            '<link href="https://dollwow.com/learn/sex-doll-guide" color="#B5471F">'
            "<u>dollwow.com/learn/sex-doll-guide</u></link>.", styles["body"],
        ),
    ])
    doc.build(story)


def merge_pdfs(visual_pdf: Path, content_pdf: Path, destination: Path) -> None:
    visual_reader = PdfReader(str(visual_pdf))
    content_reader = PdfReader(str(content_pdf))
    writer = PdfWriter()
    for page in visual_reader.pages:
        writer.add_page(page)
    writer.append(content_reader, import_outline=True)
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
    metadata, lines = read_source()
    TMP.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    visual_paths = generate_visual_pages()
    visual_pdf = TMP / "visual-pages.pdf"
    content_pdf = TMP / "content.pdf"
    image_pdf(visual_paths, visual_pdf)
    build_content_pdf(metadata, lines, content_pdf)
    merge_pdfs(visual_pdf, content_pdf, OUTPUT)
    shutil.copy2(OUTPUT, PUBLIC_OUTPUT)
    shutil.copy2(OUTPUT, DESKTOP_OUTPUT)
    print(OUTPUT)
    print(PUBLIC_OUTPUT)
    print(DESKTOP_OUTPUT)


if __name__ == "__main__":
    main()
