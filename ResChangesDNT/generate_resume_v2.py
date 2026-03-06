#!/usr/bin/env python3
"""
ATS-Optimized Resume Generator - Compact Format
Matches industry-standard format for maximum readability and ATS compatibility
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.colors import HexColor
from datetime import datetime

def create_resume():
    # Setup document with tighter margins
    filename = f"Shekhar_Sharma_Resume_{datetime.now().strftime('%Y%m%d')}.pdf"
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=0.6*inch,
        leftMargin=0.6*inch,
        topMargin=0.6*inch,
        bottomMargin=0.6*inch
    )
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Name style - Bold, Large
    name_style = ParagraphStyle(
        'NameStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=HexColor('#000000'),
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=22
    )
    
    # Title/Specialization style
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#000000'),
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica',
        leading=12
    )
    
    # Contact info style
    contact_style = ParagraphStyle(
        'ContactStyle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#000000'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    # Section heading style
    section_heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=HexColor('#000000'),
        spaceAfter=6,
        spaceBefore=8,
        fontName='Helvetica-Bold',
        leftIndent=0
    )
    
    # Company/Role style
    job_header_style = ParagraphStyle(
        'JobHeader',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#000000'),
        spaceAfter=4,
        fontName='Helvetica-Bold',
        leading=12
    )
    
    # Bullet style - compact
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#000000'),
        leftIndent=15,
        spaceAfter=3,
        fontName='Helvetica',
        leading=11,
        alignment=TA_JUSTIFY
    )
    
    # Profile/body style
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#000000'),
        spaceAfter=6,
        fontName='Helvetica',
        leading=11,
        alignment=TA_JUSTIFY
    )
    
    # Skills category style
    skills_category_style = ParagraphStyle(
        'SkillsCategory',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#000000'),
        spaceAfter=3,
        fontName='Helvetica-Bold',
        leading=11
    )
    
    # Skills content style
    skills_content_style = ParagraphStyle(
        'SkillsContent',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#000000'),
        spaceAfter=4,
        fontName='Helvetica',
        leading=11,
        alignment=TA_JUSTIFY
    )
    
    # Build content
    story = []
    
    # Header
    story.append(Paragraph("Shekhar Sharma", name_style))
    story.append(Paragraph("Product Manager | GenAI | SaaS | Healthcare SAMD | Enterprise Platforms | Digital Transformation", title_style))
    story.append(Paragraph('+91-9930825652 | sharmashekhar992@gmail.com | <a href="https://www.linkedin.com/in/sheksharma" color="blue">linkedin.com/in/sheksharma</a> | <a href="https://shekhar-sharma-portfolio.vercel.app/" color="blue">Portfolio</a> | Mumbai, India', contact_style))
    
    # Profile Section
    story.append(Paragraph("Profile", section_heading_style))
    profile_text = """Senior Product Manager with 9+ years of experience delivering scalable digital products across GenAI platforms, regulated healthcare (SAMD Class II), enterprise SaaS, and mobile ecosystems. Proven track record of driving end-to-end product lifecycle from strategy and roadmap definition to execution within complex, global environments at Deloitte and Fortune 500 clients (Pfizer, Kroger, Eli Lilly). Skilled in leading cross-functional teams, PI planning, and stakeholder alignment to deliver API-driven, compliant solutions that drive measurable business outcomes. Expertise in accelerating product velocity, improving platform adoption, and securing incremental funding through rapid prototyping and data-driven decision making."""
    story.append(Paragraph(profile_text, body_style))
    story.append(Spacer(1, 0.08*inch))
    
    # Experience Section
    story.append(Paragraph("Experience", section_heading_style))
    
    # Deloitte - Pfizer
    story.append(Paragraph("Deloitte Studios (Pfizer GenAI), Senior Product Manager, 2023 - Present", job_header_style))
    story.append(Paragraph("• Led GenAI knowledge mining platform serving 500+ medical researchers across US/EU markets, reducing researcher query-to-insight time from 12 hours to 6 hours (50% improvement) and driving 40% increase in daily active users.", bullet_style))
    story.append(Paragraph("• Secured $200K incremental client funding by building 3 rapid MVP prototypes in 2 weeks using AI-powered no-code tools (Figma Make, Bolt.new), accelerating requirements validation by 60% and enabling $1.2M contract expansion.", bullet_style))
    story.append(Paragraph("• Delivered 10+ major features across 4 quarterly releases, maintaining 95% on-time delivery rate and improving sprint predictability from 65% to 90% through structured PI planning and backlog governance.", bullet_style))
    story.append(Paragraph("• Launched advanced search with semantic filtering and citation tracking, increasing platform retention from 60% to 85% and unlocking multi-million-dollar recurring revenue through strategic integrations.", bullet_style))
    story.append(Paragraph("• Orchestrated cross-functional collaboration across 15-person engineering team, data science, UX, and medical SMEs, ensuring seamless product delivery across 3 time zones.", bullet_style))
    story.append(Spacer(1, 0.05*inch))
    
    # Deloitte - Kroger
    story.append(Paragraph("Deloitte Studios (Kroger Mobile Platform), Platform Product Manager, 2022 - 2023", job_header_style))
    story.append(Paragraph("• Owned Android enterprise mobile platform roadmap supporting frontline retail operations across 15,000 devices, enabling 12 new capabilities in 8 months and accelerating feature rollout by 30% through modular API architecture.", bullet_style))
    story.append(Paragraph("• Reduced mobile app crash rate from 4.2% to 1.1% through API stability improvements, preventing ~$500K in annual lost productivity and maintaining 98% uptime across retail operations.", bullet_style))
    story.append(Paragraph("• Improved frontline task efficiency by 20% (saving 45 minutes per worker per week) through workflow optimization and UX collaboration on inventory scanning flows, driving measurable operational savings.", bullet_style))
    story.append(Paragraph("• Transformed release cadence from monthly to bi-weekly sprints, doubling deployment velocity while ensuring zero-downtime releases and maintaining platform reliability.", bullet_style))
    story.append(Spacer(1, 0.05*inch))
    
    # Deloitte - Eli Lilly
    story.append(Paragraph("Deloitte Studios (Eli Lilly SAMD), Product Owner, 2019 - 2022", job_header_style))
    story.append(Paragraph("• Managed 3 regulated patient-facing mobile applications (1 SAMD Class II diabetes product, 2 onboarding apps), scaling patient onboarding to 3,000 users in 8 weeks vs 24-week target (3x faster) and preventing $2M delay penalty.", bullet_style))
    story.append(Paragraph("• Redesigned onboarding journey from 24 steps to 12 steps (50% reduction) while maintaining FDA 21 CFR Part 11 compliance, improving completion rate from 72% to 94% and achieving zero compliance violations across 8 FDA audits.", bullet_style))
    story.append(Paragraph("• Spearheaded cross-functional PI planning and quarterly releases with clinical, regulatory, and engineering teams across 3 time zones, maintaining 92% sprint velocity consistency and delivering compliant digital solutions.", bullet_style))
    story.append(Paragraph("• Translated complex medical workflows into compliant digital solutions through 30+ requirement workshops with clinical SMEs and regulatory affairs, ensuring seamless integration with existing healthcare systems.", bullet_style))
    story.append(Spacer(1, 0.05*inch))
    
    # CRMNEXT
    story.append(Paragraph("CRMNEXT, Product Manager, 2017 - 2019", job_header_style))
    story.append(Paragraph("• Managed enterprise CRM modules across 8 banking and retail clients, increasing platform adoption by 35% through structured onboarding program and configuration optimization.", bullet_style))
    story.append(Paragraph("• Led 20+ client requirement workshops translating business needs into CRM configurations, reducing customization time by 40% and accelerating client onboarding timelines.", bullet_style))
    story.append(Spacer(1, 0.05*inch))
    
    # BSE
    story.append(Paragraph("Bombay Stock Exchange, Associate Product Owner, 2016 - 2017", job_header_style))
    story.append(Paragraph("• Coordinated UAT across 5 internal digital platform releases, ensuring 98% defect-free deployment rate and maintaining high stakeholder satisfaction.", bullet_style))
    story.append(Paragraph("• Documented workflows for 15+ business processes, improving cross-team collaboration and reducing requirement clarification time by 30%.", bullet_style))
    story.append(Spacer(1, 0.08*inch))
    
    # Product Project
    story.append(Paragraph("Product Project", section_heading_style))
    story.append(Paragraph('<b>Smart Release Planner</b> - <a href="https://smart-release-planner1.vercel.app/" color="blue">Live Demo</a>, 2026', job_header_style))
    story.append(Paragraph("• Built and deployed full-stack release planning SaaS tool in 3 weeks using React, TypeScript, and AI-assisted development (GitHub Copilot), achieving 500+ hours of simulated team capacity analysis and demonstrating vibecoding capabilities.", bullet_style))
    story.append(Paragraph("• Engineered release confidence scoring algorithm integrating team capacity, PTO, holidays, and velocity trends to predict delivery feasibility with 85% accuracy, eliminating manual Excel-based planning.", bullet_style))
    story.append(Paragraph("• Designed and prototyped complete UX using Figma Make and vibecoding techniques, eliminating need for separate dev team and reducing time-to-market by 70%.", bullet_style))
    story.append(Spacer(1, 0.08*inch))
    
    # Key Skills
    story.append(Paragraph("Key Skills", section_heading_style))
    
    story.append(Paragraph("Core Product Skills", skills_category_style))
    skills_core = "Product Strategy & Roadmapping • End-to-End SDLC • PI Planning & Agile/Scrum • Backlog Prioritization & User Stories • API & SaaS Product Development • GTM & Monetization Strategy • Stakeholder Alignment • OKRs & Metrics • Cross-Functional Leadership • P&L • BRD/PRD • Risk & Compliance (SAMD, FDA 21 CFR Part 11)"
    story.append(Paragraph(skills_core, skills_content_style))
    
    story.append(Paragraph("Platforms & Domains", skills_category_style))
    skills_platforms = "GenAI/LLMs (RAG, Semantic Search) • Enterprise SaaS • Mobile Applications (iOS/Android) • Regulated Healthcare (SAMD Class II) • Retail Operations • Digital Banking • API-Driven Platforms"
    story.append(Paragraph(skills_platforms, skills_content_style))
    
    story.append(Paragraph("Analytics & Growth", skills_category_style))
    skills_analytics = "Data-Driven Decision Making • Product Analytics (Mixpanel, Google Analytics, Power BI) • A/B Testing & Experimentation • Customer Engagement & UI/UX • Conversion Funnel Optimization • Market Research & Competitive Analysis"
    story.append(Paragraph(skills_analytics, skills_content_style))
    
    story.append(Paragraph("Technical & Tools", skills_category_style))
    skills_technical = "SQL (Basic) • Python • React • TypeScript • Figma (Prototyping) • JIRA • Confluence • AWS (Cost Optimization) • API Design Principles • AI-Powered Prototyping (Figma Make, Lovable, Bolt.new, GitHub Copilot) • DevOps Collaboration"
    story.append(Paragraph(skills_technical, skills_content_style))
    story.append(Spacer(1, 0.08*inch))
    
    # Achievement
    story.append(Paragraph("Achievement", section_heading_style))
    story.append(Paragraph("• Certified SAFe® 6 Agilist (2025) | Certified Scrum Product Owner - CSPO (2025)", body_style))
    story.append(Spacer(1, 0.05*inch))
    
    # Education
    story.append(Paragraph("Education", section_heading_style))
    story.append(Paragraph("Bachelor of Engineering (Information Technology), Atharva College of Engineering, Mumbai University, 2016", body_style))
    
    # Build PDF
    doc.build(story)
    print(f"✓ Resume generated successfully: {filename}")
    print("✓ Location: current working directory")
    print(f"✓ Format: ATS-optimized, compact, metric-dense")
    return filename

if __name__ == "__main__":
    create_resume()
