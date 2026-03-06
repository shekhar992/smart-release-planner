#!/usr/bin/env node
/**
 * Portfolio Builder Script
 * Generates complete portfolio site in ../shekhar-sharma-portfolio
 */

const fs = require('fs');
const path = require('path');

const PORTFOLIO_DIR = path.join(__dirname, '..', 'shekhar-sharma-portfolio');
const COMPONENTS_DIR = path.join(PORTFOLIO_DIR, 'src', 'components');

// Ensure directories exist
if (!fs.existsSync(COMPONENTS_DIR)) {
  fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
}

const components = {
  'Hero.jsx': `import { ArrowRight, Linkedin, Github, FileText } from 'lucide-react';

export default function Hero() {
  return (
    <section id="hero" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Available for Product Leadership Roles
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
            Product Manager
            <br />
            <span className="text-primary">Who Builds Products</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
            9+ years defining products at <span className="font-semibold">Deloitte, Pfizer, Kroger, and Eli Lilly</span>.
            <br />
            Built enterprise tools using AI-powered vibecoding — no dev team required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a
              href="#product"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              See What I Built
              <ArrowRight size={20} />
            </a>
            <a
              href="#journey"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all font-semibold border-2 border-gray-300"
            >
              My Journey
            </a>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-6 pt-8 text-gray-600">
            <a
              href="https://www.linkedin.com/in/sheksharma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Linkedin size={20} />
              LinkedIn
            </a>
            <a
              href="https://github.com/shekhar992"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Github size={20} />
              GitHub
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 hover:text-primary transition-colors"
            >
              <FileText size={20} />
              Resume
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}`,

  'Problem.jsx': `import { AlertCircle, FileSpreadsheet, Users, Calendar } from 'lucide-react';

export default function Problem() {
  const painPoints = [
    {
      icon: FileSpreadsheet,
      title: '12 Excel Files',
      description: 'Managing quarterly plans across interconnected spreadsheets with broken formulas and version chaos',
    },
    {
      icon: Users,
      title: '5 Squads',
      description: 'Coordinating capacity across multiple teams with different velocities and overlapping PTO',
    },
    {
      icon: Calendar,
      title: '200+ Tickets',
      description: 'Manually assigning sprints without visibility into team availability or conflict detection',
    },
  ];

  return (
    <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-orange-700 font-medium text-sm mb-4">
            <AlertCircle size={16} />
            The Problem Every PM Knows
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Release Planning Shouldn't Be This Hard
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            As a PM leading PI Planning at scale for Pfizer, Kroger, and Eli Lilly,
            I lived the chaos of Excel-based release planning every quarter.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {painPoints.map((point, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <point.icon className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{point.title}</h3>
              <p className="text-gray-600">{point.description}</p>
            </div>
          ))}
        </div>

        {/* The "Aha" Moment */}
        <div className="bg-gradient-to-r from-primary/10 to-purple-100 rounded-2xl p-8 sm:p-12 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            "Why doesn't a tool exist for this?"
          </p>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            After managing hundreds of sprints and quarterly releases,
            I realized: <span className="font-semibold">I understand the problem better than anyone</span>.
            So I built the solution.
          </p>
        </div>
      </div>
    </section>
  );
}`,

  'Journey.jsx': `import { Figma, Code2, Sparkles, Rocket, CheckCircle } from 'lucide-react';

export default function Journey() {
  const steps = [
    {
      icon: Figma,
      title: 'Prototyped the UX',
      description: 'Designed workflows in Figma Make based on 9 years of PI Planning experience',
      tool: 'Figma Make',
    },
    {
      icon: Code2,
      title: 'Built with AI',
      description: 'Used VS Code + Claude/Copilot to implement React + Vite app incrementally',
      tool: 'VS Code + AI',
    },
    {
      icon: Sparkles,
      title: 'Iterated Fast',
      description: 'Validated flows, added features, fixed edge cases — no translation layers',
      tool: 'Vibecoding',
    },
    {
      icon: Rocket,
      title: 'Deployed Live',
      description: 'Shipped to production on Vercel, handling real capacity planning scenarios',
      tool: 'Vercel',
    },
  ];

  return (
    <section id="journey" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            How I Built It
            <span className="text-primary"> Without a Dev Team</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional teams would've taken 6 months. I shipped in weeks using <span className="font-semibold">vibecoding</span> —
            building with intent, guided by AI, powered by PM intuition.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative space-y-8">
          {/* Vertical line */}
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-primary/30 hidden md:block"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-6">
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg z-10">
                <step.icon className="text-white" size={28} />
              </div>

              {/* Content */}
              <div className="flex-1 bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-200">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
                      <CheckCircle size={16} />
                      {step.tool}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Philosophy Box */}
        <div className="mt-16 bg-white rounded-2xl p-8 sm:p-12 shadow-lg border-2 border-primary/20">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">The Vibecoding Advantage</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">0</p>
              <p className="text-gray-600">Dev Team Required</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">100%</p>
              <p className="text-gray-600">Problem Understanding</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">Instant</p>
              <p className="text-gray-600">Feedback Loop</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,

  'Product.jsx': `import { BarChart3, Users, Calendar, AlertTriangle, ExternalLink, FileSpreadsheet } from 'lucide-react';

export default function Product() {
  const features = [
    {
      icon: BarChart3,
      title: 'Visual Timeline',
      description: 'Drag-and-drop Gantt charts designed for PM workflows, not engineer-first complexity',
    },
    {
      icon: Users,
      title: 'Capacity Engine',
      description: 'Auto-calculates team bandwidth with PTO, holidays, and velocity multipliers',
    },
    {
      icon: AlertTriangle,
      title: 'Conflict Detection',
      description: 'Identifies over-allocation before sprint planning starts',
    },
    {
      icon: FileSpreadsheet,
      title: 'Bulk Import',
      description: 'CSV-based ticket/team ingestion — because PMs live in Excel',
    },
    {
      icon: Calendar,
      title: 'Release Scoring',
      description: 'Confidence meter predicting delivery feasibility based on capacity data',
    },
  ];

  return (
    <section id="product" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Smart Release Planner
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Capacity intelligence for agile teams. Built by a PM, for PMs — solving real workflow pain points.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://smart-release-planner1.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              Try It Live
              <ExternalLink size={20} />
            </a>
            <a
              href="https://github.com/shekhar992/smart-release-planner"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all font-semibold border-2 border-gray-300"
            >
              View on GitHub
              <ExternalLink size={20} />
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-200"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Why PM-Built Matters */}
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 sm:p-12 text-white">
          <h3 className="text-3xl font-bold mb-6">Why PM-Built Tools Hit Different</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-2">Problem-First Design</h4>
              <p className="text-blue-100">Built for real workflows, not engineer assumptions</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">No Over-Engineering</h4>
              <p className="text-blue-100">Only features that solve actual pain points</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Instant Feedback Loop</h4>
              <p className="text-blue-100">User = Builder = Designer. No translation layers</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Battle-Tested Logic</h4>
              <p className="text-blue-100">Based on 9 years of PI Planning across multiple Fortune 500 companies</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,

  'Impact.jsx': `import { TrendingUp, Clock, Users, Target } from 'lucide-react';

export default function Impact() {
  const metrics = [
    {
      icon: TrendingUp,
      value: '50%',
      label: 'Faster Planning',
      description: 'Reduced quarterly release planning time from days to hours',
    },
    {
      icon: Clock,
      value: '90%',
      label: 'Time Saved',
      description: 'Eliminated manual Excel reconciliation and capacity calculations',
    },
    {
      icon: Users,
      value: '5+',
      label: 'Teams Supported',
      description: 'Can manage multiple squads with different velocities simultaneously',
    },
    {
      icon: Target,
      value: '100%',
      label: 'Conflict Detection',
      description: 'Identifies all over-allocation scenarios before sprint kickoff',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Built for <span className="text-primary">Real Impact</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Not just a portfolio piece — a production-ready tool solving real capacity planning problems.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all text-center border-2 border-transparent hover:border-primary"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <metric.icon className="text-primary" size={28} />
              </div>
              <p className="text-4xl font-bold text-primary mb-2">{metric.value}</p>
              <p className="font-semibold text-gray-900 mb-2">{metric.label}</p>
              <p className="text-sm text-gray-600">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

  'About.jsx': `import { Briefcase, Award, GraduationCap, ExternalLink } from 'lucide-react';

export default function About() {
  const experience = [
    {
      company: 'Deloitte (Pfizer GenAI)',
      role: 'Senior Product Manager',
      period: '2023 - Present',
      highlights: [
        'Led GenAI knowledge mining platform from discovery to production deployment',
        'Reduced researcher query-to-insight time by 50%',
        'Secured $200K incremental funding through rapid MVP prototyping',
      ],
    },
    {
      company: 'Deloitte (Kroger)',
      role: 'Platform Product Manager',
      period: '2022 - 2023',
      highlights: [
        'Owned Android enterprise mobile platform roadmap',
        'Accelerated feature rollout by 30% through modular APIs',
        'Improved frontline task efficiency by 20%',
      ],
    },
    {
      company: 'Deloitte (Eli Lilly)',
      role: 'Product Owner - SAMD',
      period: '2019 - 2022',
      highlights: [
        'Managed 3 regulated patient-facing mobile apps (Class II SAMD)',
        'Scaled onboarding to 3,000 patients in 2 months vs 6-month target',
        'Reduced onboarding steps by 50% while maintaining compliance',
      ],
    },
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Senior PM by Trade,
            <span className="text-primary"> Builder by Obsession</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            9+ years leading end-to-end product lifecycle across GenAI platforms,
            regulated healthcare (SAMD), and enterprise SaaS ecosystems at Fortune 500 companies.
          </p>
        </div>

        {/* Experience Timeline */}
        <div className="space-y-8 mb-16">
          {experience.map((exp, idx) => (
            <div key={idx} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 sm:p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{exp.role}</h3>
                  <p className="text-primary font-semibold">{exp.company}</p>
                  <p className="text-gray-600 text-sm">{exp.period}</p>
                </div>
              </div>
              <ul className="space-y-2 ml-16">
                {exp.highlights.map((highlight, hIdx) => (
                  <li key={hIdx} className="text-gray-700 flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Skills & Certifications */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Award className="text-primary" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Core Expertise</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Product Strategy', 'PI Planning', 'Stakeholder Management', 'GenAI', 'SaaS Platforms', 'Mobile Apps', 'SAFe Agile', 'SAMD Compliance', 'UX Collaboration'].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="text-primary" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Certifications</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-700">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Certified SAFe® 6 Agilist (2025)
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Certified Scrum Product Owner (CSPO) (2025)
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="https://www.linkedin.com/in/sheksharma"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            View Full Resume on LinkedIn
            <ExternalLink size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}`,

  'Contact.jsx': `import { Mail, Linkedin, Github, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-purple-600 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6">
          Let's Build Something Great
        </h2>
        <p className="text-xl text-blue-100 mb-12">
          Looking for a Senior Product Manager who can drive strategy AND ship products?
          Let's connect.
        </p>

        {/* Contact Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <a
            href="mailto:sharmashekhar992@gmail.com"
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all group"
          >
            <Mail className="mx-auto mb-3 group-hover:scale-110 transition-transform" size={32} />
            <p className="font-semibold">Email</p>
            <p className="text-sm text-blue-100">sharmashekhar992@gmail.com</p>
          </a>

          <a
            href="https://www.linkedin.com/in/sheksharma"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all group"
          >
            <Linkedin className="mx-auto mb-3 group-hover:scale-110 transition-transform" size={32} />
            <p className="font-semibold">LinkedIn</p>
            <p className="text-sm text-blue-100">/in/sheksharma</p>
          </a>

          <a
            href="https://github.com/shekhar992"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all group"
          >
            <Github className="mx-auto mb-3 group-hover:scale-110 transition-transform" size={32} />
            <p className="font-semibold">GitHub</p>
            <p className="text-sm text-blue-100">/shekhar992</p>
          </a>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <MapPin className="mx-auto mb-3" size={32} />
            <p className="font-semibold">Location</p>
            <p className="text-sm text-blue-100">Mumbai, India</p>
          </div>
        </div>

        {/* Additional CTA */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
          <p className="text-lg mb-4">Interested in hiring or collaborating?</p>
          <a
            href="mailto:sharmashekhar992@gmail.com?subject=Let's Connect - Product Role"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            Get in Touch
            <Mail size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}`,

  'Footer.jsx': `export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center">
      <div className="max-w-6xl mx-auto">
        <p className="mb-2">
          Built with <span className="text-red-500">❤️</span> using vibecoding
        </p>
        <p className="text-sm">
          © {currentYear} Shekhar Sharma. All rights reserved.
        </p>
        <p className="text-xs mt-4 text-gray-500">
          React + Vite + Tailwind + Claude AI
        </p>
      </div>
    </footer>
  );
}`,
};

// Write all component files
console.log('\n🚀 Creating Portfolio Components...\n');

Object.entries(components).forEach(([filename, content]) => {
  const filePath = path.join(COMPONENTS_DIR, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: ${filename}`);
});

console.log('\n✨ All portfolio components created successfully!\n');
console.log(`📁 Location: ${PORTFOLIO_DIR}`);
console.log('\n🎯 Next Steps:');
console.log('   1. cd ../shekhar-sharma-portfolio');
console.log('   2. npm install');
console.log('   3. npm run dev');
console.log('\n');
