import { agents } from './data';

export interface Template {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  agentIds: number[]; // References to agents in the agents array
  featured: boolean;
  features?: string[];
}

// Create workflows using the three agents: SEO Optimizer (1), Meeting Summarizer (2), and Smart Email Manager (3)
export const templates = [
  {
    id: 'workflow-seo-analysis',
    title: 'SEO & Content Strategy',
    description: 'Optimize content for SEO, summarize competitor research, and manage email outreach.',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786',
    category: 'Marketing',
    tags: ['SEO', 'Content', 'Marketing', 'Email'],
    agentIds: [1, 2, 3], // SEO Optimizer, Meeting Summarizer, Smart Email Manager
    featured: true,
    features: [
      'Keyword and competitor analysis',
      'SEO-friendly content recommendations',
      'Automated email follow-ups'
    ]
  },
  {
    id: 'workflow-meeting-content',
    title: 'Meeting & Content Optimization',
    description: 'Summarize meetings, extract key insights, and structure content for better SEO.',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786',
    category: 'Productivity',
    tags: ['Meetings', 'Summarization', 'SEO'],
    agentIds: [2, 1], // Meeting Summarizer, SEO Optimizer
    featured: false,
    features: [
      'Summarize key meeting points',
      'Generate SEO-friendly meeting reports',
      'Identify action items and follow-ups'
    ]
  },
  {
    id: 'workflow-intelligent-emailing',
    title: 'AI Email & Content Optimization',
    description: 'Manage email communication efficiently while ensuring content remains SEO-optimized.',
    image: 'https://images.unsplash.com/photo-1504270997636-07ddfbd48945',
    category: 'Automation',
    tags: ['Email', 'SEO', 'Automation'],
    agentIds: [3, 1], // Smart Email Manager, SEO Optimizer
    featured: true,
    features: [
      'Prioritize and categorize emails',
      'Draft AI-generated responses',
      'Ensure content aligns with SEO goals'
    ]
  },
  {
    id: 'workflow-business-summaries',
    title: 'Business Intelligence & Summarization',
    description: 'Generate smart business reports by summarizing emails and meetings.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    category: 'Business',
    tags: ['Business', 'Summarization', 'Automation'],
    agentIds: [2, 3], // Meeting Summarizer, Smart Email Manager
    featured: false,
    features: [
      'Summarize important business emails',
      'Generate concise reports from meetings',
      'Extract key insights for decision-making'
    ]
  }
];
