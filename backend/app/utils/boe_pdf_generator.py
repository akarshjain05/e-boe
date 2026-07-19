from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

class BOEPDFGenerator:
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
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#4338ca'),
            alignment=TA_CENTER,
            spaceAfter=12,
        ))
        self.styles.add(ParagraphStyle(
            name='LegalText',
            parent=self.styles['Normal'],
            fontSize=12,
            leading=18,
            textColor=colors.HexColor('#111827'),
            alignment=TA_JUSTIFY,
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

    def generate(self, boe_data: dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=15*mm, bottomMargin=20*mm
        )
        
        elements = []
        
        # Header
        elements.append(Paragraph(boe_data.get("drawer_name", "Drawer Company"), self.styles['CompanyName']))
        elements.append(Paragraph(boe_data.get("drawer_address", "") or "", self.styles['FieldValue']))
        elements.append(Spacer(1, 8*mm))
        
        # Bill Title
        elements.append(Paragraph("BILL OF EXCHANGE", self.styles['BillTitle']))
        elements.append(Spacer(1, 4*mm))
        
        # Meta Info
        meta_info = [
            [
                Paragraph("<b>Place of Issue:</b>", self.styles['SectionLabel']),
                Paragraph(boe_data.get("place_of_issue", "") or "", self.styles['FieldValue']),
                Paragraph("<b>Date of Issue:</b>", self.styles['SectionLabel']),
                Paragraph(str(boe_data.get("issue_date", "") or ""), self.styles['FieldValue']),
            ],
            [
                Paragraph("<b>Amount:</b>", self.styles['SectionLabel']),
                Paragraph(f"INR {boe_data.get('amount', 0):,.2f}", self.styles['FieldValue']),
                Paragraph("<b>Due Date:</b>", self.styles['SectionLabel']),
                Paragraph(str(boe_data.get("due_date", "") or ""), self.styles['FieldValue']),
            ]
        ]
        meta_table = Table(meta_info, colWidths=[30*mm, 55*mm, 30*mm, 55*mm])
        meta_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 10*mm))
        
        # Legal Instrument Text (NIA 1881 standard phrasing)
        amount_val = f"INR {boe_data.get('amount', 0):,.2f}"
        drawee_name = boe_data.get('drawee_name', '')
        endorsee_name = boe_data.get('endorsee_name', 'ourselves')
        
        legal_text = (
            f"On the {boe_data.get('due_date', '')}, pay to the order of {endorsee_name}, "
            f"the sum of {amount_val} for value received, and charge the same to the account of {drawee_name}."
        )
        elements.append(Paragraph(legal_text, self.styles['LegalText']))
        elements.append(Spacer(1, 10*mm))
        
        # Parties Section
        status = boe_data.get("status", "")
        accepted = "PENDING"
        if status in ["accepted", "endorsed", "discounted", "paid"]:
            accepted = boe_data.get("drawee_name", "")
            
        parties = [
            ["TO (DRAWEE)", boe_data.get("drawee_name", ""), boe_data.get("drawee_address", "") or ""],
            ["ACCEPTED BY", accepted, str(boe_data.get("accepted_at", "")) if accepted != "PENDING" else ""],
        ]
        
        party_data = []
        for party_type, name, details in parties:
            party_data.append([
                Paragraph(f"<b>{party_type}</b>", self.styles['SectionLabel']),
                Paragraph(name or "", self.styles['FieldValue']),
                Paragraph(str(details) or "", self.styles['SectionLabel']),
            ])
        
        party_table = Table(party_data, colWidths=[35*mm, 65*mm, 70*mm])
        party_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        elements.append(party_table)
        elements.append(Spacer(1, 8*mm))
        
        # Description
        if boe_data.get("description"):
            elements.append(Paragraph("<b>Description:</b>", self.styles['SectionLabel']))
            elements.append(Spacer(1, 2*mm))
            elements.append(Paragraph(boe_data["description"], self.styles['FieldValue']))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
