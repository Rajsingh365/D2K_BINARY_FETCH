
import { 
  Search, 
  Zap, 
  Mail, 
  FileText, 
  TrendingUp, 
  Users, 
  Paperclip, 
  Sparkles, 
  Shield, 
  MessageSquare, 
  LineChart, 
  Pencil,
  AlertCircle,
  BarChart,
  FileSearch,
  Copy,
  Scale,
  Crosshair,
  Scroll,
  VideoIcon,
  Megaphone,
  Code,
  Building
} from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string; // e.g., Text Generation, Data Analysis, Summarization
  category: string; // e.g., Marketing, Legal, Productivity
  features: string[];
  icon: any; // Lucide React component
  color: string;
}

export const agents: Agent[] = [
  // Marketing Agents
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Analyzes and enhances content to maximize search engine visibility and ranking.',
    type: 'Content Enhancement',
    category: 'Marketing',
    features: [
      'Keyword optimization',
      'SEO score analysis',
      'Competitor content insights', 
      'Readability improvements'
    ],
    icon: Search,
    color: 'blue'
  },
  {
    id: 'competitor-watchdog',
    name: 'Competitor Watchdog',
    description: 'Monitors competitor activities and provides strategic insights for market positioning.',
    type: 'Market Analysis',
    category: 'Marketing',
    features: [
      'Real-time competitor monitoring',
      'Strategy comparison',
      'Market trend analysis',
      'Pricing intelligence'
    ],
    icon: Crosshair,
    color: 'orange'
  },
  {
    id: 'product-recommender',
    name: 'Product Recommender',
    description: 'Suggests personalized products based on customer behavior, preferences, and market trends.',
    type: 'Recommendation System',
    category: 'Marketing',
    features: [
      'Personalized recommendations',
      'Purchase pattern analysis',
      'Cross-selling opportunities',
      'Conversion optimization'
    ],
    icon: TrendingUp,
    color: 'green'
  },
  {
    id: 'post-creator',
    name: 'Post Creator',
    description: 'Generates engaging social media content tailored to your brand voice and audience.',
    type: 'Content Generation',
    category: 'Marketing',
    features: [
      'Multi-platform content creation',
      'Brand voice consistency',
      'Engagement optimization',
      'Trending topic integration'
    ],
    icon: Pencil,
    color: 'purple'
  },
  {
    id: 'video-script-generator',
    name: 'Video Script Generator',
    description: 'Creates compelling video scripts optimized for engagement and conversion.',
    type: 'Content Generation',
    category: 'Marketing',
    features: [
      'Script structure templates',
      'Hook creation',
      'Call-to-action optimization',
      'Platform-specific formatting'
    ],
    icon: VideoIcon,
    color: 'red'
  },
  {
    id: 'social-campaign-planner',
    name: 'Campaign Planner',
    description: 'Strategic campaign planning with timeline, content, and performance projections.',
    type: 'Marketing Strategy',
    category: 'Marketing',
    features: [
      'Campaign timeline creation',
      'Content calendar management',
      'Budget allocation assistance',
      'Performance benchmarking'
    ],
    icon: Megaphone,
    color: 'pink'
  },

  // Productivity Agents
  {
    id: 'meeting-summarizer',
    name: 'Meeting Summarizer',
    description: 'Converts lengthy meetings into concise, actionable summaries with key points and follow-ups.',
    type: 'Summarization',
    category: 'Productivity',
    features: [
      'Automated meeting notes',
      'Action item extraction',
      'Decision highlighting',
      'Searchable transcripts'
    ],
    icon: FileText,
    color: 'indigo'
  },
  {
    id: 'smart-email-manager',
    name: 'Smart Email Manager',
    description: 'Handles email communications with smart filtering, prioritization, and response suggestions.',
    type: 'Communication',
    category: 'Productivity',
    features: [
      'Email classification',
      'Response drafting',
      'Follow-up reminders',
      'Priority inbox management'
    ],
    icon: Mail,
    color: 'sky'
  },
  {
    id: 'customer-feedback-analyzer',
    name: 'Feedback Analyzer',
    description: 'Processes customer feedback to identify patterns, sentiment, and actionable insights.',
    type: 'Data Analysis',
    category: 'Productivity',
    features: [
      'Sentiment analysis',
      'Trend identification',
      'Priority issue flagging',
      'Improvement recommendations'
    ],
    icon: BarChart,
    color: 'cyan'
  },
  {
    id: 'document-formatter',
    name: 'Document Formatter',
    description: 'Automatically formats and standardizes documents according to specified templates and styles.',
    type: 'Document Processing',
    category: 'Productivity',
    features: [
      'Template enforcement',
      'Style consistency checking',
      'Citation formatting',
      'Layout optimization'
    ],
    icon: Copy,
    color: 'teal'
  },
  {
    id: 'task-prioritizer',
    name: 'Task Prioritizer',
    description: 'Organizes and prioritizes tasks based on deadlines, importance, and dependencies.',
    type: 'Project Management',
    category: 'Productivity',
    features: [
      'Deadline tracking',
      'Priority calculation',
      'Dependency management',
      'Time allocation suggestions'
    ],
    icon: Zap,
    color: 'amber'
  },

  // Legal & Compliance Agents
  {
    id: 'contract-summarizer',
    name: 'Contract Summarizer',
    description: 'Extracts key terms, obligations, and risks from legal contracts and agreements.',
    type: 'Document Analysis',
    category: 'Legal',
    features: [
      'Clause extraction',
      'Risk identification',
      'Term comparison',
      'Obligation tracking'
    ],
    icon: Scroll,
    color: 'blue'
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Conducts legal research across cases, statutes, and regulations to support legal analyses.',
    type: 'Information Retrieval',
    category: 'Legal',
    features: [
      'Case law research',
      'Regulatory compliance checks',
      'Precedent identification',
      'Citation generation'
    ],
    icon: FileSearch,
    color: 'violet'
  },
  {
    id: 'compliance-watchdog',
    name: 'Compliance Watchdog',
    description: 'Monitors regulatory changes and assesses compliance impact on business operations.',
    type: 'Regulatory Monitoring',
    category: 'Legal',
    features: [
      'Regulatory update alerts',
      'Compliance gap analysis',
      'Risk assessment',
      'Remediation suggestions'
    ],
    icon: Shield,
    color: 'rose'
  },
  {
    id: 'legal-document-drafter',
    name: 'Document Drafter',
    description: 'Creates customized legal documents based on specific requirements and jurisdictions.',
    type: 'Document Generation',
    category: 'Legal',
    features: [
      'Template customization',
      'Jurisdiction-specific clauses',
      'Legal term standardization',
      'Document version control'
    ],
    icon: Paperclip,
    color: 'slate'
  },
  {
    id: 'dispute-analyzer',
    name: 'Dispute Analyzer',
    description: 'Analyzes legal disputes, assesses strengths and weaknesses, and suggests strategies.',
    type: 'Legal Analysis',
    category: 'Legal',
    features: [
      'Case strength assessment',
      'Precedent comparison',
      'Settlement value estimation',
      'Strategy recommendation'
    ],
    icon: Scale,
    color: 'emerald'
  },

  // Corporate Agents
  {
    id: 'financial-analyzer',
    name: 'Financial Analyzer',
    description: 'Analyzes financial data to identify trends, anomalies, and opportunities for optimization.',
    type: 'Financial Analysis',
    category: 'Corporate',
    features: [
      'Financial trend detection',
      'Anomaly identification',
      'Cost optimization suggestions',
      'Performance benchmarking'
    ],
    icon: LineChart,
    color: 'green'
  },
  {
    id: 'team-performance-tracker',
    name: 'Team Performance Tracker',
    description: 'Monitors and analyzes team performance metrics to identify improvement opportunities.',
    type: 'HR Analytics',
    category: 'Corporate',
    features: [
      'Performance metric tracking',
      'Team dynamics analysis',
      'Productivity optimization',
      'Training recommendation'
    ],
    icon: Users,
    color: 'indigo'
  },
  {
    id: 'corporate-communicator',
    name: 'Corporate Communicator',
    description: 'Crafts professional internal and external communications aligned with corporate voice and goals.',
    type: 'Communication',
    category: 'Corporate',
    features: [
      'Brand voice consistency',
      'Stakeholder-specific messaging',
      'Communication strategy alignment',
      'Message effectiveness analytics'
    ],
    icon: MessageSquare,
    color: 'sky'
  },
  {
    id: 'innovation-catalyst',
    name: 'Innovation Catalyst',
    description: 'Stimulates innovation by connecting trends, technologies, and business opportunities.',
    type: 'Strategic Planning',
    category: 'Corporate',
    features: [
      'Technology trend analysis',
      'Innovation opportunity identification',
      'Cross-industry insight generation',
      'Implementation roadmapping'
    ],
    icon: Sparkles,
    color: 'purple'
  },
  {
    id: 'risk-assessor',
    name: 'Risk Assessor',
    description: 'Identifies, analyzes, and prioritizes business risks across operations and strategy.',
    type: 'Risk Management',
    category: 'Corporate',
    features: [
      'Risk identification',
      'Impact assessment',
      'Mitigation strategy suggestion',
      'Contingency planning'
    ],
    icon: AlertCircle,
    color: 'red'
  },
  {
    id: 'developer-assistant',
    name: 'Developer Assistant',
    description: 'Helps with code review, debugging, and documentation for software development.',
    type: 'Development',
    category: 'Corporate',
    features: [
      'Code review automation',
      'Bug detection',
      'Documentation generation',
      'Best practice enforcement'
    ],
    icon: Code,
    color: 'slate'
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'Analyzes business processes and data to provide insights and recommendations.',
    type: 'Business Analysis',
    category: 'Corporate',
    features: [
      'Process optimization',
      'Data-driven decision support',
      'Requirements engineering',
      'Solution evaluation'
    ],
    icon: Building,
    color: 'amber'
  }
];

export const categories = [...new Set(agents.map(agent => agent.category))];

export const workflowTemplates = [
  {
    id: 'marketing-agency',
    name: 'Marketing Agency',
    description: 'Complete marketing workflow from SEO to content creation and campaign management',
    agentIds: ['seo-optimizer', 'competitor-watchdog', 'product-recommender', 'post-creator', 'smart-email-manager']
  },
  {
    id: 'corporate-productivity',
    name: 'Corporate Productivity',
    description: 'Streamline meetings, communications, and competitive analysis',
    agentIds: ['meeting-summarizer', 'smart-email-manager', 'competitor-watchdog', 'customer-feedback-analyzer']
  },
  {
    id: 'legal-compliance',
    name: 'Legal & Compliance',
    description: 'Comprehensive legal document processing and compliance monitoring',
    agentIds: ['contract-summarizer', 'research-assistant', 'compliance-watchdog', 'smart-email-manager']
  }
];
