"""Render a validated, private order summary. Never sends or changes an order."""
import argparse
import json
import os
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

parser = argparse.ArgumentParser()
parser.add_argument("input")
parser.add_argument("output")
parser.add_argument("--notes", help="Private JSON list of unresolved review notes, not approved specifications")
args = parser.parse_args()
data = json.loads(Path(args.input).read_text())
if data.get("status") != "REVIEW_REQUIRED_NOT_FACTORY_APPROVAL":
    raise ValueError("Expected a validated, review-required summary")
notes = json.loads(Path(args.notes).read_text()) if args.notes else []
if not isinstance(notes, list) or any(not isinstance(n, str) for n in notes):
    raise ValueError("Review notes must be a list of text")
out = Path(args.output)
out.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Brand", fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#23654e"), spaceAfter=8))
styles.add(ParagraphStyle(name="TitleOrder", fontName="Helvetica-Bold", fontSize=23, leading=27, spaceAfter=5))
styles.add(ParagraphStyle(name="SectionOrder", fontName="Helvetica-Bold", fontSize=11, leading=15, spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle(name="CellOrder", fontName="Helvetica", fontSize=9, leading=13))
styles.add(ParagraphStyle(name="SmallOrder", fontName="Helvetica", fontSize=8, leading=11, textColor=colors.HexColor("#50575b")))
styles.add(ParagraphStyle(name="MoneyOrder", parent=styles["CellOrder"], alignment=TA_RIGHT))
styles.add(ParagraphStyle(name="HoldOrder", parent=styles["CellOrder"], textColor=colors.HexColor("#9b2530")))

def p(text, style="CellOrder"):
    return Paragraph(escape(str(text)), styles[style])

def money(cents):
    return f'{data["currency"]} {Decimal(cents) / 100:,.2f}'

def table(rows, widths=(63 * mm, 111 * mm), header=False):
    t = Table([[p(a), p(b)] for a, b in rows], colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#d9dedc")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f2f5f3"))
    ]))
    return t

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#50575b"))
    canvas.drawString(18 * mm, 12 * mm, f'DollWOW | {data["orderName"]} | Review copy - not production approval')
    canvas.drawRightString(192 * mm, 12 * mm, str(doc.page))
    canvas.restoreState()

story = [p("DollWOW / FACTORY ORDER REVIEW", "Brand"), p(data["orderName"], "TitleOrder"),
         p("Recorded selections and customer-paid amounts", "SmallOrder"), Spacer(1, 9),
         p("HOLD FOR REVIEW - confirm the configuration and open factory questions before processing.", "HoldOrder"),
         p("No customer name, address, email or payment credentials are included. This is not a supplier invoice.", "SmallOrder")]
for index, build in enumerate(data["builds"], 1):
    story += [p(f'Product {index} / quantity {build["quantity"]}', "SectionOrder"), p(build["productTitle"]),
              p("Product title is the order snapshot, not an independently verified factory specification or stock promise.", "SmallOrder"),
              p("Customer choices recorded on the order", "SectionOrder")]
    story.append(table([(c["label"], c["value"]) for c in build["choices"]] or [("Configuration", "No explicit choices recorded - review required")]))
    rows = [("Base product", money(build["basePaidCents"]))]
    for upgrade in build["upgrades"]:
        label = upgrade["label"] if upgrade["paymentComponents"] else f'{upgrade["label"]} / quantity {upgrade["quantity"]}'
        rows.append((label, money(upgrade["paidCents"])))
        rows += [(c["label"], c["value"]) for c in upgrade["choices"]]
    story += [p("What the customer paid", "SectionOrder"), table(rows),
              p("Choice labels may contain a displayed surcharge; it is not added a second time to the amounts above.", "SmallOrder")]
    for upgrade in build["upgrades"]:
        if upgrade["paymentComponents"] and len(upgrade["parts"]) > 1:
            amounts = " + ".join(money(part["paidCents"]) for part in upgrade["parts"])
            story.append(p(f'{upgrade["label"]}: {amounts} = {money(upgrade["paidCents"])}. These are payment components, not separate heads or factory units.', "SmallOrder"))
for line in data["unmatchedCharges"]:
    story.append(p(f'Unassigned paid option: {line["label"]} / {money(line["paidCents"])}. Assignment requires review.', "HoldOrder"))
t = data["totals"]
story += [p("Payment reconciliation", "SectionOrder"), table([
    ("Merchandise after discounts", money(t["subtotalCents"])),
    ("Discount already included above", money(t["discountCents"])),
    ("Shipping / tax", f'{money(t["shippingCents"])} / {money(t["taxCents"])}'),
    ("Total paid", money(t["paidCents"]))]), p(data["priceBasis"], "SmallOrder")]
checks = data["holds"] + notes
if checks:
    story.append(p("Confirm before factory release", "SectionOrder"))
    for n, note in enumerate(checks, 1):
        story.append(p(f"{n}. {note}", "CellOrder"))
        story.append(Spacer(1, 4))
stamp = datetime.fromisoformat(data["capturedAt"].replace("Z", "+00:00")).strftime("%d %b %Y %H:%M UTC")
story += [Spacer(1, 10), p(f"Source: authenticated Shopify order snapshot captured {stamp}. Prices, menu defaults and availability were not filled from the current catalog.", "SmallOrder")]
doc = SimpleDocTemplate(str(out), pagesize=(210 * mm, 297 * mm), rightMargin=18 * mm, leftMargin=18 * mm,
                        topMargin=14 * mm, bottomMargin=18 * mm, title=f'DollWOW {data["orderName"]} factory order review', author="DollWOW")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
os.chmod(out, 0o600)
print(json.dumps({"created": str(out), "status": data["status"], "reviewChecks": len(checks)}))
