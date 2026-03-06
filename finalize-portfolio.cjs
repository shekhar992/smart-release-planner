#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORTFOLIO_DIR = path.join(__dirname, '..', 'shekhar-sharma-portfolio');

console.log('\n🎯 Finalizing Portfolio Setup...\n');

// 1. Create Navigation.jsx
const navigationContent = `import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#journey', label: 'Journey' },
    { href: '#product', label: 'Product' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#hero" className="text-xl font-bold text-gray-900 hover:text-primary transition-colors">
            Shekhar Sharma
          </a>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://www.linkedin.com/in/sheksharma"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              Connect
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://www.linkedin.com/in/sheksharma"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-center"
            >
              Connect on LinkedIn
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}`;

fs.writeFileSync(path.join(PORTFOLIO_DIR, 'src/components/Navigation.jsx'), navigationContent);
console.log('✅ Created Navigation.jsx');

// 2. Create README.md
const readmeContent = `# Shekhar Sharma - Portfolio

Senior Product Manager & Builder specializing in GenAI, SaaS platforms, and vibecoding.

## About This Portfolio

This portfolio showcases my vibecoding journey - building production-ready applications as a PM without a traditional dev team. It highlights my experience at Deloitte, Pfizer, Kroger, and Eli Lilly, along with the Smart Release Planner I built.

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Lucide React (icons)

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

## Deployment

This site is designed to be deployed on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

## Contact

- LinkedIn: [linkedin.com/in/sheksharma](https://www.linkedin.com/in/sheksharma)
- Email: sharmashekhar992@gmail.com
- GitHub: [github.com/shekhar992](https://github.com/shekhar992)

## License

© 2026 Shekhar Sharma. All rights reserved.
`;

fs.writeFileSync(path.join(PORTFOLIO_DIR, 'README.md'), readmeContent);
console.log('✅ Updated README.md');

// 3. Create .gitignore
const gitignoreContent = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.n tmproj
*.njsproj
*.sln
*.sw?
`;

fs.writeFileSync(path.join(PORTFOLIO_DIR, '.gitignore'), gitignoreContent);
console.log('✅ Created .gitignore');

// 4. Initialize git and connect to remote
try {
  process.chdir(PORTFOLIO_DIR);
  
  console.log('\n📦 Initializing Git Repository...');
  
  // Check if git is already initialized
  if (!fs.existsSync(path.join(PORTFOLIO_DIR, '.git'))) {
    execSync('git init', { stdio: 'inherit' });
    console.log('✅ Git initialized');
  } else {
    console.log('ℹ️  Git already initialized');
  }
  
  // Add remote if not exists
  try {
    execSync('git remote get-url origin', { stdio: 'pipe' });
    console.log('ℹ️  Remote origin already configured');
  } catch {
    execSync('git remote add origin https://github.com/shekhar992/shekhar-sharma-portfolio.git', { stdio: 'inherit' });
    console.log('✅ Added remote origin');
  }
  
  // Stage all files
  execSync('git add .', { stdio: 'inherit' });
  console.log('✅ Staged all files');
  
  // Create initial commit
  try {
    execSync('git commit -m "Initial portfolio setup - V0 complete"', { stdio: 'inherit' });
    console.log('✅ Created initial commit');
  } catch (e) {
    console.log('ℹ️  No changes to commit or commit already exists');
  }
  
  console.log('\n🎉 Portfolio is ready!\n');
  console.log('📋 Next Steps:');
  console.log('   1.  cd ../shekhar-sharma-portfolio');
  console.log('   2. Run: npm run dev');
  console.log('   3. To deploy:');
  console.log('      - git push -u origin main');
  console.log('      - Connect repo to Vercel');
  console.log('\n');
  
} catch (error) {
  console.error('Error during git setup:', error.message);
  console.log('\n⚠️  Manual git setup required:');
  console.log('   cd ../shekhar-sharma-portfolio');
  console.log('   git init');
  console.log('   git remote add origin https://github.com/shekhar992/shekhar-sharma-portfolio.git');
  console.log('   git add .');
  console.log('   git commit -m "Initial portfolio setup"');
  console.log('   git push -u origin main');
}
