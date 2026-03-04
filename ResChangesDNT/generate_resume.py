#!/usr/bin/env python3
"""
ATS-Friendly Resume Generator
Converts markdown resume to clean, parseable PDF format
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
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
        spaceAfter=2,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    contact_right_style = ParagraphStyle(
        'ContactRightStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#333333'),
        spaceAfter=2,
        alignment=TA_RIGHT,
        fontName='Helvetica'
    )
    
    achievement_style = ParagraphStyle(
        'AchievementStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#000000'),
        spaceAfter=3,
        fontName='Helvetica',
        leftIndent=10,
        leading=13
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
    
    # Header - Left-Right Justified Layout
    story.append(Paragraph("SHEKHAR SHARMA", name_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Contact information in table for proper alignment
    contact_data = [
        [
            Paragraph("<b>Email:</b> sharmashekhar992@gmail.com", contact_style),
            Paragraph('<b>LinkedIn:</b> <a href="https://www.linkedin.com/in/sheksharma" color="blue">linkedin.com/in/sheksharma</a>', contact_right_style)
        ],
        [
            Paragraph("<b>Phone:</b> +91-9930825652", contact_style),
            Paragraph('<b>Portfolio:</b> <a href="https://shekhar-sharma-portfolio.vercel.app/" color="blue">shekhar-sharma-portfolio.vercel.app</a>', contact_right_style)
        ],
        [
            Paragraph("<b>Location:</b> Mumbai, India", contact_style),
            Paragraph("", contact_right_style)
        ]
    ]
    
    contact_table = Table(contact_data, colWidths=[3.5*inch, 3.5*inch])
    contact_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    
    story.append(contact_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Key Achievements
    story.append(Paragraph("KEY ACHIEVEMENTS", section_heading_style))
    story.append(Paragraph("• Led GenAI platform serving 500+ medical researchers | Reduced insight time 50% | Secured $200K funding", achievement_style))
    story.append(Paragraph("• Scaled SAMD patient app to 3,000 users in 8 weeks (3x faster than target) | Zero compliance violations", achievement_style))
    story.append(Paragraph("• Built and shipped PI Planner SaaS tool in 3 weeks using AI-powered vibecoding | Live on Vercel", achievement_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Professional Experience
    story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_heading_style))
    
    # Deloitte
    story.append(Paragraph("Deloitte Studios -- Deloitte USI", company_style))
    story.append(Paragraph("<b>April 2019 -- Present</b>", date_style))
    
    # Senior PM - Pfizer
    story.append(Paragraph("Senior Product Manager -- Pfizer GenAI Knowledge Mining Platform", job_title_style))
    story.append(Paragraph("<i>2023 -- Present</i>", date_style))
    story.append(Paragraph("• Delivered 10+ major features across 4 quarterly releases, reducing researcher query-to-insight time from 12 hours to 6 hours and driving 40% increase in daily active users (500+ researchers).", bullet_style))
    story.append(Paragraph("• Secured $200K incremental funding by building 3 rapid MVP prototypes in 2 weeks using AI-powered no-code tools, accelerating requirements validation by 60%.", bullet_style))
    story.append(Paragraph("• Orchestrated cross-functional collaboration across 15-person engineering team, data science, UX, and medical SMEs, maintaining 95% on-time delivery rate across 4 consecutive quarters.", bullet_style))
    story.append(Paragraph("• Launched advanced search with semantic filtering and citation tracking, increasing platform retention from 60% to 85% and enabling $1.2M contract expansion.", bullet_style))
    story.append(Paragraph("• Established quarterly PI planning process and backlog governance framework, improving sprint predictability from 65% to 90%.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Platform PM - Kroger
    story.append(Paragraph("Platform Product Manager -- Kroger Mobile Platform", job_title_style))
    story.append(Paragraph("<i>2022 -- 2023</i>", date_style))
    story.append(Paragraph("• Accelerated feature rollout by 30% through modular API architecture and reusable platform components, enabling 12 new capabilities across 15,000 frontline devices in 8 months.", bullet_style))
    story.append(Paragraph("• Reduced mobile app crash rate from 4.2% to 1.1% through API stability improvements, preventing ~$500K in annual lost productivity across frontline retail operations.", bullet_style))
    story.append(Paragraph("• Improved frontline task efficiency by 20% (saving 45 minutes per worker per week) through workflow optimization and UX collaboration on inventory scanning flows.", bullet_style))
    story.append(Paragraph("• Transformed release cadence from monthly to bi-weekly sprints while maintaining 98% uptime, doubling deployment velocity.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Page Break before Eli Lilly section
    story.append(PageBreak())
    
    # Product Owner - Eli Lilly
    story.append(Paragraph("Product Owner -- Eli Lilly SAMD Applications", job_title_style))
    story.append(Paragraph("<i>2019 -- 2022</i>", date_style))
    story.append(Paragraph("• Scaled patient onboarding to 3,000 users in 8 weeks vs 24-week target (3x faster), enabling early clinical trial start and preventing $2M delay penalty.", bullet_style))
    story.append(Paragraph("• Redesigned onboarding journey from 24 steps to 12 steps (50% reduction) while maintaining FDA 21 CFR Part 11 compliance, improving completion rate from 72% to 94%.", bullet_style))
    story.append(Paragraph("• Delivered 3 regulated patient-facing mobile applications (1 SAMD Class II diabetes product, 2 onboarding apps) with zero compliance violations across 8 FDA audits.", bullet_style))
    story.append(Paragraph("• Spearheaded cross-functional PI planning and quarterly releases with clinical, regulatory, and engineering teams across 3 time zones, maintaining 92% sprint velocity consistency.", bullet_style))
    story.append(Paragraph("• Translated complex medical workflows into compliant digital solutions through 30+ requirement workshops with clinical SMEs and regulatory affairs.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # CRMNEXT
    story.append(Paragraph("Product Manager -- CRMNEXT", company_style))
    story.append(Paragraph("<b>2017 -- 2019</b>", date_style))
    story.append(Paragraph("• Increased platform adoption by 35% across 8 banking clients through structured onboarding program and configuration optimization.", bullet_style))
    story.append(Paragraph("• Led 20+ client requirement workshops translating business needs into CRM configurations, reducing customization time by 40%.", bullet_style))
    story.append(Spacer(1, 0.1*inch))
    
    # BSE
    story.append(Paragraph("Associate Product Owner -- Bombay Stock Exchange", company_style))
    story.append(Paragraph("<b>2016 -- 2017</b>", date_style))
    story.append(Paragraph("• Coordinated UAT across 5 internal digital platform releases, ensuring 98% defect-free deployment rate.", bullet_style))
    story.append(Paragraph("• Documented workflows for 15+ business processes, improving cross-team collaboration and reducing requirement clarification time by 30%.", bullet_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Product Project
    story.append(Paragraph("PRODUCT PROJECT", section_heading_style))
    story.append(Paragraph("Smart Release Planner -- Agile Capacity Intelligence Tool | <a href=\"https://smart-release-planner1.vercel.app/\"><u>Live Demo</u></a>", job_title_style))
    story.append(Paragraph("<i>2026</i>", date_style))
    story.append(Paragraph("• Built and deployed full-stack release planning SaaS tool in 3 weeks using React, TypeScript, and AI-assisted development (GitHub Copilot); achieved 500+ hours of simulated team capacity analysis.", bullet_style))
    story.append(Paragraph("• Engineered release confidence scoring algorithm integrating team capacity, PTO, holidays, and velocity trends to predict delivery feasibility with 85% accuracy.", bullet_style))
    story.append(Paragraph("• Designed and prototyped complete UX using Figma Make and vibecoding techniques, eliminating need for separate dev team.", bullet_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Page Break before Skills section
    story.append(PageBreak())
    
    # Skills
    story.append(Paragraph("SKILLS & COMPETENCIES", section_heading_style))
    story.append(Paragraph("<b>Product Management:</b> Product Strategy, End-to-End SDLC, PI Planning, Quarterly Release Management, Backlog Prioritization, Stakeholder Alignment, OKRs & Metrics, Cross-Functional Leadership", body_style))
    story.append(Paragraph("<b>Platforms & Domains:</b> GenAI/LLMs, Enterprise SaaS, Mobile Applications (iOS/Android), Regulated Healthcare (SAMD Class II, FDA 21 CFR Part 11), Retail Operations", body_style))
    story.append(Paragraph("<b>Methodologies:</b> SAFe Agile, Scrum/Kanban, Design Thinking, Lean Product Development, Continuous Discovery", body_style))
    story.append(Paragraph("<b>Technical:</b> Figma, JIRA, Confluence, SQL (Basic), API Design Principles, UX Collaboration Tools, AI-Powered Prototyping (Figma Make, Lovable, Bolt.new)", body_style))
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
