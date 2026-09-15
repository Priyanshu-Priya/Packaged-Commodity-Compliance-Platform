import io
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm

from app.models.scan import Scan
from app.schemas.compliance import ComplianceFinding, ComplianceSummary, ComplianceStatus

class PDFReportGenerator:
    """
    Generates official Legal Metrology Compliance Inspection Certificates (PDF)
    under the Legal Metrology (Packaged Commodities) Rules, 2011.
    """

    @staticmethod
    def generate(
        scan: Scan,
        summary: ComplianceSummary,
        findings: List[ComplianceFinding],
        annotated_image_path: Optional[str] = None
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom typography styles
        header_title_style = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            alignment=1, # Center
            textColor=colors.HexColor('#0F172A')
        )
        
        sub_title_style = ParagraphStyle(
            'SubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            alignment=1,
            textColor=colors.HexColor('#475569')
        )

        cert_heading_style = ParagraphStyle(
            'CertHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            alignment=1,
            textColor=colors.HexColor('#B45309')
        )

        section_heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#1E293B')
        )

        cell_text_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#334155')
        )

        cell_bold_style = ParagraphStyle(
            'CellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#1E293B')
        )

        elements = []

        # 1. Header & Emblem banner
        elements.append(Paragraph("GOVERNMENT OF INDIA &bull; MINISTRY OF CONSUMER AFFAIRS", header_title_style))
        elements.append(Paragraph("DEPARTMENT OF LEGAL METROLOGY &bull; PACKAGED COMMODITIES ENFORCEMENT DIVISION", sub_title_style))
        elements.append(Spacer(1, 6))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceAfter=8))

        elements.append(Paragraph("STATUTORY COMPLIANCE INSPECTION CERTIFICATE", cert_heading_style))
        elements.append(Paragraph("Issued under Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011", sub_title_style))
        elements.append(Spacer(1, 10))

        # 2. Case Details & Verdict Matrix
        verdict_color = colors.HexColor('#16A34A') # Green
        if summary.overall_verdict == ComplianceStatus.FAIL:
            verdict_color = colors.HexColor('#DC2626') # Red
        elif summary.overall_verdict == ComplianceStatus.REVIEW_REQUIRED:
            verdict_color = colors.HexColor('#D97706') # Amber

        case_info = [
            [
                Paragraph("<b>Inspection ID:</b>", cell_bold_style),
                Paragraph(scan.scan_number, cell_text_style),
                Paragraph("<b>Inspection Date:</b>", cell_bold_style),
                Paragraph(scan.created_at.strftime("%Y-%m-%d %H:%M UTC") if scan.created_at else "N/A", cell_text_style),
            ],
            [
                Paragraph("<b>Commodity Type:</b>", cell_bold_style),
                Paragraph(scan.commodity_type.replace('_', ' '), cell_text_style),
                Paragraph("<b>Ruleset Version:</b>", cell_bold_style),
                Paragraph(summary.ruleset_version, cell_text_style),
            ],
            [
                Paragraph("<b>Overall Verdict:</b>", cell_bold_style),
                Paragraph(f"<b><font color='{verdict_color.hexval()}'>{summary.overall_verdict.value}</font></b>", cell_bold_style),
                Paragraph("<b>Compliance Score:</b>", cell_bold_style),
                Paragraph(f"<b>{summary.compliance_score:.1f}%</b> ({summary.pass_count} Pass, {summary.fail_count} Fail, {summary.review_count} Review)", cell_text_style),
            ]
        ]

        t_case = Table(case_info, colWidths=[90, 170, 95, 165])
        t_case.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_case)
        elements.append(Spacer(1, 12))

        # 3. Annotated Evidence Preview (if available)
        img_to_embed = annotated_image_path or scan.annotated_image_path or scan.image_path
        if img_to_embed and os.path.exists(img_to_embed):
            try:
                elements.append(Paragraph("Visual Evidence & Bounding Box Overlays", section_heading_style))
                elements.append(Spacer(1, 4))
                
                # Constrain dimensions to fit neatly on page
                max_w = 400
                max_h = 170
                img = RLImage(img_to_embed, width=max_w, height=max_h)
                img.hAlign = 'CENTER'
                elements.append(img)
                elements.append(Spacer(1, 10))
            except Exception:
                pass # Proceed without image if corrupt or unreadable

        # 4. Statutory Rule-by-Rule Audit Matrix
        elements.append(Paragraph("Statutory Rule Verification Matrix", section_heading_style))
        elements.append(Spacer(1, 4))

        headers = [
            Paragraph("<b>Rule</b>", cell_bold_style),
            Paragraph("<b>Requirement & Title</b>", cell_bold_style),
            Paragraph("<b>Detected Fact / Observation</b>", cell_bold_style),
            Paragraph("<b>Status</b>", cell_bold_style),
            Paragraph("<b>Statutory Reason & Citations</b>", cell_bold_style)
        ]

        table_rows = [headers]
        for f in findings:
            st_color = "#16A34A" if f.status == ComplianceStatus.PASS else ("#DC2626" if f.status == ComplianceStatus.FAIL else "#D97706")
            status_para = Paragraph(f"<b><font color='{st_color}'>{f.status.value}</font></b>", cell_bold_style)

            table_rows.append([
                Paragraph(f.source_rule, cell_bold_style),
                Paragraph(f.title, cell_text_style),
                Paragraph(f.detected or "Not detected", cell_text_style),
                status_para,
                Paragraph(f.reasoning, cell_text_style)
            ])

        t_findings = Table(table_rows, colWidths=[65, 115, 125, 65, 150])
        t_findings.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94A3B8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        # Style header row text to white
        for col_idx in range(len(headers)):
            headers[col_idx].style.textColor = colors.white

        elements.append(t_findings)
        elements.append(Spacer(1, 14))

        # 5. Legal Enforcement Disclaimer & Officer Sign-off Block
        footer_text = (
            "<b>STATUTORY NOTICE:</b> This verification certificate is generated by the AI-assisted Legal Metrology "
            "Enforcement Engine in compliance with the Legal Metrology (Packaged Commodities) Rules, 2011. "
            "Any compounding of offences under Section 49 or prosecution under Section 36 of the Legal Metrology Act, 2009 "
            "shall be executed pursuant to physical verification by an authorized Legal Metrology Officer."
        )
        elements.append(Paragraph(footer_text, sub_title_style))
        elements.append(Spacer(1, 14))

        sign_table = [
            [
                Paragraph("<b>Inspected & Verified By:</b><br/>Enforcement Officer / Inspector<br/>Legal Metrology Department", cell_text_style),
                Paragraph("<b>Official Seal & Verification Date:</b><br/>" + datetime.now(timezone.utc).strftime('%d-%b-%Y') + "<br/>[Authenticated Digital Hash]", cell_text_style)
            ]
        ]
        t_sign = Table(sign_table, colWidths=[260, 260])
        t_sign.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,0), 0.5, colors.HexColor('#94A3B8')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_sign)

        doc.build(elements)
        return buffer.getvalue()

pdf_generator = PDFReportGenerator()
