#!/usr/bin/env python3
"""
ATS-Friendly Resume Generator
Converts markdown resume to clean, parseable PDF format
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.colors import HexColor
from datetime import datetime

def create_resume():
    # Setup document
    filename = f"Shekhar_Sharma_Resume_{datetime.now().strftime('%Y%m%d')}.pdf"
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles for ATS-friendly formatting
    name_style = ParagraphStyle(
        'NameStyle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=HexColor('#000000'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=HexColor('#333333'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    contact_style = ParagraphStyle(
        'ContactStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#333333'),
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    section_heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=HexColor('#000000'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold',
        borderWidth=1,
        borderColor=HexColor('#000000'),
        borderPadding=3,
        leftIndent=0
    )
    
    job_title_style = ParagraphStyle(
        'JobTitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=HexColor('#000000'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    company_style = ParagraphStyle(
        'Company',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#333333'),
        spaceAfter=2,
        fontName='Helvetica-Oblique'
    )
    
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#555555'),
        spaceAfter=6,
        fontName='Helvetica'
    )
    
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#000000'),
        leftIndent=20,
        spaceAfter=4,
        fontName='Helvetica',
        leading=14
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#000000'),
        spaceAfter=6,
        fontName='Helvetica',
        leading=14
    )
    
    # Build content
    story = []
    
    # Header
    story.append(Paragraph("SHEKHAR SHARMA", name_style))
    story.append(Paragraph("Senior Digital Product Manager | GenAI | SaaS | Mobile Platforms", title_style))
    story.append(Paragraph("Mumbai, India", contact_style))
    story.append(Paragraph("+91-9930825652 | sharmashekhar992@gmail.com", contact_style))
    story.append(Paragraph("https://www.linkedin.com/in/sheksharma", contact_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Professional Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", section_heading_style))
    summary_text = """Senior Digital Product Manager with 9+ years of experience owning end-to-end digital product lifecycle across GenAI platforms, regulated healthcare (SAMD), and enterprise SaaS ecosystems. Proven track record of leading product strategy, PI planning, backlog governance, and quarterly releases while delivering measurable impact across adoption, efficiency, and scale. Strong collaborator across engineering, UX, business, and regulatory stakeholders."""
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Professional Experience
    story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_heading_style))
    
    # Deloitte
    story.append(Paragraph("Deloitte Studios -- Deloitte USI", company_style))
    story.append(Paragraph("<b>April 2019 -- Present</b>", date_style))
    
    # Senior PM - Pfizer
    story.append(Paragraph("Senior Product Manager -- Pfizer GenAI Knowledge Mining Platform", job_title_style))
    story.append(Paragraph("<i>2023 -- Present</i>", date_style))
    story.append(Paragraph("• Own end-to-end product lifecycle from discovery, requirement gathering, backlog management, PI planning, quarterly release execution, to production deployment.", bullet_style))
    story.append(Paragraph("• Define and drive product roadmap aligned with business OKRs, delivering 10+ major features across multiple releases.", bullet_style))
    story.append(Paragraph("• Reduced researcher query-to-insight time by ~50%, driving 40% increase in feature adoption and 25% improvement in retention.", bullet_style))
    story.append(Paragraph("• Lead cross-functional collaboration across engineering, data science, UX, and medical SMEs, ensuring release governance and stakeholder alignment.", bullet_style))
    story.append(Paragraph("• Built rapid MVP prototypes using Figma Make, Lovable, and Bolt.new, securing USD 200K in incremental client funding.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Platform PM - Kroger
    story.append(Paragraph("Platform Product Manager -- Kroger Mobile Platform", job_title_style))
    story.append(Paragraph("<i>2022 -- 2023</i>", date_style))
    story.append(Paragraph("• Owned Android enterprise mobile platform roadmap supporting frontline retail operations (inventory, scanning, replenishment).", bullet_style))
    story.append(Paragraph("• Managed backlog prioritization, sprint planning, and release cadence improvement (monthly to bi-weekly).", bullet_style))
    story.append(Paragraph("• Accelerated feature rollout by 30% through modular APIs and reusable platform components.", bullet_style))
    story.append(Paragraph("• Improved frontline task efficiency by 20% through workflow optimization and UX collaboration.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Product Owner - Eli Lilly
    story.append(Paragraph("Product Owner -- Eli Lilly SAMD Applications", job_title_style))
    story.append(Paragraph("<i>2019 -- 2022</i>", date_style))
    story.append(Paragraph("• Owned end-to-end SDLC for 3 regulated patient-facing mobile applications, including 1 SAMD Class II diabetes product and 2 onboarding applications.", bullet_style))
    story.append(Paragraph("• Led requirement workshops with clinical, regulatory, and business stakeholders to translate medical workflows into compliant digital solutions.", bullet_style))
    story.append(Paragraph("• Managed PI planning, backlog governance, quarterly releases, and cross-functional delivery across distributed teams.", bullet_style))
    story.append(Paragraph("• Redesigned onboarding journey, reducing steps by 50% while maintaining regulatory compliance.", bullet_style))
    story.append(Paragraph("• Scaled onboarding to ~3,000 patients in ~2 months against a 6-month target, accelerating program rollout.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # CRMNEXT
    story.append(Paragraph("Product Manager -- CRMNEXT", company_style))
    story.append(Paragraph("<b>2017 -- 2019</b>", date_style))
    story.append(Paragraph("• Managed enterprise CRM modules across banking and retail clients.", bullet_style))
    story.append(Paragraph("• Led client requirement workshops, configuration planning, and feature prioritization based on customer feedback.", bullet_style))
    story.append(Paragraph("• Increased platform adoption through structured onboarding and enablement initiatives.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # BSE
    story.append(Paragraph("Associate Product Owner -- Bombay Stock Exchange", company_style))
    story.append(Paragraph("<b>2016 -- 2017</b>", date_style))
    story.append(Paragraph("• Supported internal digital platform rollouts through requirement gathering, UAT coordination, and stakeholder reporting.", bullet_style))
    story.append(Paragraph("• Collaborated with business teams to document workflows and improve usability across internal systems.", bullet_style))
    story.append(Paragraph("• Assisted in sprint tracking and release coordination to ensure timely feature deployment.", bullet_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Product Project
    story.append(Paragraph("PRODUCT PROJECT", section_heading_style))
    story.append(Paragraph("PI Planner -- Agile Capacity Intelligence Tool", job_title_style))
    story.append(Paragraph("<i>2026</i>", date_style))
    story.append(Paragraph("• Conceptualized and built a release planning tool addressing fragmented Excel-based team capacity management.", bullet_style))
    story.append(Paragraph("• Designed UX prototype using Figma Make and developed end-to-end solution using Visual Studio Code; deployed live on <a href=\"https://smart-release-planner1.vercel.app/\"><u>Vercel</u></a>.", bullet_style))
    story.append(Paragraph("• Built release confidence scoring engine integrating team capacity, PTO, and holiday data to predict delivery feasibility and improve quarterly planning accuracy.", bullet_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Skills
    story.append(Paragraph("SKILLS", section_heading_style))
    skills_text = """Product Strategy | End-to-End SDLC | PI Planning | Quarterly Release Management | Backlog Management | Stakeholder Alignment | GenAI | SaaS Platforms | Mobile Applications | Agile / Kanban | Regulatory (SAMD) | UX Collaboration | OKRs & Metrics"""
    story.append(Paragraph(skills_text, body_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Education
    story.append(Paragraph("EDUCATION", section_heading_style))
    story.append(Paragraph("Bachelor of Engineering -- Information Technology", job_title_style))
    story.append(Paragraph("Atharva College of Engineering, Mumbai", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Certifications
    story.append(Paragraph("CERTIFICATIONS", section_heading_style))
    story.append(Paragraph("• Certified SAFe® 6 Agilist (2025)", bullet_style))
    story.append(Paragraph("• Certified Scrum Product Owner (CSPO) (2025)", bullet_style))
    
    # Build PDF
    doc.build(story)
    print(f"✓ Resume generated successfully: {filename}")
    print("✓ Location: current working directory")
    return filename

if __name__ == "__main__":
    create_resume()
