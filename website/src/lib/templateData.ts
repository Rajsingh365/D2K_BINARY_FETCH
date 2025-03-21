
import { agents } from './data';

export interface Template {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  agentIds: string[]; // References to agents in the agents array
  featured: boolean;
  features?: string[];
}

// Create templates as combinations of agents
export const templates = [
  {
    id: 'template-seo-research',
    title: 'SEO Content Optimization',
    description: 'Research, optimize, and enhance your content for better search engine rankings',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    category: 'Marketing',
    tags: ['SEO', 'Content', 'Marketing'],
    agentIds: ['1', '4'], // SEO Optimizer + Research Assistant
    featured: true,
    features: [
      'Generate SEO-optimized content',
      'Research keywords and trends',
      'Analyze competitor content'
    ]
  },
  {
    id: 'template-meeting-notes',
    title: 'Meeting Assistant',
    description: 'Record, transcribe, and summarize meetings with action items extraction',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
    category: 'Productivity',
    tags: ['Meetings', 'Notes', 'Transcription'],
    agentIds: ['2', '5'], // Meeting Summarizer + Customer Feedback Analyzer
    featured: true,
    features: [
      'Generate meeting transcripts',
      'Extract action items',
      'Analyze sentiment and feedback'
    ]
  },
  {
    id: 'template-legal-research',
    title: 'Legal Document Assistant',
    description: 'Analyze, summarize, and research legal documents and precedents',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f',
    category: 'Legal',
    tags: ['Legal', 'Documents', 'Research'],
    agentIds: ['3', '4'], // Contract Summarizer + Research Assistant
    featured: false,
    features: [
      'Summarize legal documents',
      'Find relevant precedents',
      'Extract key clauses and terms'
    ]
  },
  {
    id: 'template-customer-support',
    title: 'Customer Support Automation',
    description: 'Analyze customer feedback and automatically generate appropriate responses',
    image: 'https://images.unsplash.com/photo-1552581234-26160f608093',
    category: 'Customer Support',
    tags: ['Support', 'Automation', 'Analysis'],
    agentIds: ['5', '2'], // Customer Feedback Analyzer + Meeting Summarizer
    featured: false,
    features: [
      'Analyze customer sentiment',
      'Generate response templates',
      'Identify common issues'
    ]
  },
  {
    id: 'template-content-creation',
    title: 'Content Creation Pipeline',
    description: 'Research, create, and optimize content for your marketing campaigns',
    image: 'https://images.unsplash.com/photo-1542435503-956c469947f6',
    category: 'Marketing',
    tags: ['Content', 'Creation', 'Marketing'],
    agentIds: ['4', '1', '2'], // Research Assistant + SEO Optimizer + Meeting Summarizer
    featured: true,
    features: [
      'Research trending topics',
      'Generate optimized content',
      'Analyze and improve readability'
    ]
  },
  {
    id: 'template-document-analysis',
    title: 'Document Analysis Suite',
    description: 'Extract insights, summarize, and analyze various document types',
    image: 'https://images.unsplash.com/photo-1568667256549-094345857637',
    category: 'Productivity',
    tags: ['Documents', 'Analysis', 'Summarization'],
    agentIds: ['3', '2', '5'], // Contract Summarizer + Meeting Summarizer + Customer Feedback Analyzer
    featured: false,
    features: [
      'Analyze document structure',
      'Extract key information',
      'Generate comprehensive summaries'
    ]
  }
];
