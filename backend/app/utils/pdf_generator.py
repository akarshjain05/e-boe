from io import BytesIO
from typing import Any

import qrcode
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


class BillPDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        self.styles.add(ParagraphStyle(
            name='CompanyName',
            parent=self.styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#1e1b4b'),
            spaceAfter=4,
        ))
        self.styles.add(ParagraphStyle(
            name='BillTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#4338ca'),
            alignment=TA_CENTER,
            spaceAfter=12,
        ))
        self.styles.add(ParagraphStyle(
            name='SectionLabel',
            parent=self.styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#6b7280'),
            spaceBefore=6,
        ))
        self.styles.add(ParagraphStyle(
            name='FieldValue',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#111827'),
        ))
        self.styles.add(ParagraphStyle(
            name='AmountLarge',
            parent=self.styles['Normal'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1e1b4b'),
            alignment=TA_RIGHT,
        ))

    def _generate_qr_code(self, data: str) -> BytesIO:
        qr = qrcode.QRCode(version=1, box_size=4, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

    def generate(self, bill_data: dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=15*mm, bottomMargin=20*mm
        )
        
        elements = []
        
        # Header
        elements.append(Paragraph(bill_data.get("company_name", "Company"), self.styles['CompanyName']))
        elements.append(Paragraph(bill_data.get("company_address", ""), self.styles['FieldValue']))
        elements.append(Spacer(1, 8*mm))
        
        # Bill Title
        elements.append(Paragraph("BILL OF EXCHANGE", self.styles['BillTitle']))
        elements.append(Spacer(1, 4*mm))
        
        # Bill Details Table
        bill_info = [
            [
                Paragraph("<b>Bill Number:</b>", self.styles['SectionLabel']),
                Paragraph(bill_data.get("bill_number", ""), self.styles['FieldValue']),
                Paragraph("<b>Issue Date:</b>", self.styles['SectionLabel']),
                Paragraph(str(bill_data.get("issue_date", "")), self.styles['FieldValue']),
            ],
            [
                Paragraph("<b>Currency:</b>", self.styles['SectionLabel']),
                Paragraph(bill_data.get("currency_code", "INR"), self.styles['FieldValue']),
                Paragraph("<b>Due Date:</b>", self.styles['SectionLabel']),
                Paragraph(str(bill_data.get("due_date", "")), self.styles['FieldValue']),
            ],
        ]
        
        bill_table = Table(bill_info, colWidths=[30*mm, 55*mm, 30*mm, 55*mm])
        bill_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(bill_table)
        elements.append(Spacer(1, 6*mm))
        
        # Parties Section
        parties = [
            ["DRAWER", bill_data.get("drawer_name", ""), bill_data.get("drawer_address", "")],
            ["DRAWEE", bill_data.get("drawee_name", ""), bill_data.get("drawee_address", "")],
            ["PAYEE", bill_data.get("payee_name", ""), bill_data.get("payee_address", "")],
        ]
        
        party_data = []
        for party_type, name, address in parties:
            party_data.append([
                Paragraph(f"<b>{party_type}</b>", self.styles['SectionLabel']),
                Paragraph(name, self.styles['FieldValue']),
                Paragraph(address or "", self.styles['SectionLabel']),
            ])
        
        party_table = Table(party_data, colWidths=[30*mm, 65*mm, 75*mm])
        party_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        elements.append(party_table)
        elements.append(Spacer(1, 6*mm))
        
        # Items Table
        items = bill_data.get("items", [])
        if items:
            item_header = [
                Paragraph("<b>#</b>", self.styles['SectionLabel']),
                Paragraph("<b>Description</b>", self.styles['SectionLabel']),
                Paragraph("<b>HSN</b>", self.styles['SectionLabel']),
                Paragraph("<b>Qty</b>", self.styles['SectionLabel']),
                Paragraph("<b>Unit Price</b>", self.styles['SectionLabel']),
                Paragraph("<b>Tax %</b>", self.styles['SectionLabel']),
                Paragraph("<b>Amount</b>", self.styles['SectionLabel']),
            ]
            
            item_rows = [item_header]
            for idx, item in enumerate(items, 1):
                item_rows.append([
                    Paragraph(str(idx), self.styles['FieldValue']),
                    Paragraph(item.get("description", ""), self.styles['FieldValue']),
                    Paragraph(item.get("hsn_code", ""), self.styles['FieldValue']),
                    Paragraph(str(item.get("quantity", 0)), self.styles['FieldValue']),
                    Paragraph(f"₹{item.get('unit_price', 0):,.2f}", self.styles['FieldValue']),
                    Paragraph(f"{item.get('tax_rate', 0)}%", self.styles['FieldValue']),
                    Paragraph(f"₹{item.get('amount', 0):,.2f}", self.styles['FieldValue']),
                ])
            
            items_table = Table(item_rows, colWidths=[10*mm, 55*mm, 18*mm, 15*mm, 25*mm, 17*mm, 30*mm])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(items_table)
        
        elements.append(Spacer(1, 6*mm))
        
        # Totals
        total_data = [
            ["Subtotal:", f"₹{bill_data.get('amount', 0):,.2f}"],
            ["Tax:", f"₹{bill_data.get('tax_amount', 0):,.2f}"],
            ["Discount:", f"-₹{bill_data.get('discount_amount', 0):,.2f}"],
        ]
        total_data.append(["TOTAL:", f"₹{bill_data.get('total_amount', 0):,.2f}"])
        
        total_rows = []
        for label, value in total_data:
            total_rows.append([
                "",
                Paragraph(f"<b>{label}</b>" if "TOTAL" in label else label, self.styles['FieldValue']),
                Paragraph(f"<b>{value}</b>" if "TOTAL" in label else value, self.styles['FieldValue']),
            ])
        
        totals_table = Table(total_rows, colWidths=[100*mm, 35*mm, 35*mm])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('LINEABOVE', (1, -1), (-1, -1), 1, colors.HexColor('#1e1b4b')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 8*mm))
        
        # Terms
        if bill_data.get("terms_and_conditions"):
            elements.append(Paragraph("<b>Terms & Conditions:</b>", self.styles['SectionLabel']))
            elements.append(Spacer(1, 2*mm))
            elements.append(Paragraph(bill_data["terms_and_conditions"], self.styles['FieldValue']))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
