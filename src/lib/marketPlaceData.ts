import { BarChart, FileSearch, FileText, Scroll, Search } from "lucide-react";

export interface MarketplaceItem {
  id: string;
  name: string;
  title: string;
  description: string;
  type: string;
  category: string;
  features: string[];
  icon: any;
  color: string;
  price: number;
  rating: number;
  image: string;
  featured: boolean;
  tags: string[];
  seller: {
    name: string;
    rating: number;
    verified: boolean;
  };
}

export const marketplaceItems  = [
  {
    id: '1',
    name: 'SEO Optimizer',
    title: 'SEO Optimizer Pro',
    description: 'Analyzes and enhances content to maximize search engine visibility and ranking.',
    type: 'Content Enhancement',
    category: 'Marketing',
    features: ['Keyword optimization', 'SEO score analysis', 'Competitor content insights', 'Readability improvements'],
    icon: Search,
    color: 'blue',
    price: 49.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
    featured: true,
    tags: ['SEO', 'Marketing', 'Optimization'],
    seller: { name: 'AI Solutions Inc', rating: 4.8, verified: true }
  },
  {
    id: '2',
    name: 'Meeting Summarizer',
    title: 'AI Meeting Assistant',
    description: 'Converts lengthy meetings into concise, actionable summaries with key points and follow-ups.',
    type: 'Summarization',
    category: 'Productivity',
    features: ['Automated meeting notes', 'Action item extraction', 'Decision highlighting', 'Searchable transcripts'],
    icon: FileText,
    color: 'indigo',
    price: 39.99,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    featured: false,
    tags: ['Meetings', 'Transcription', 'Notes'],
    seller: { name: 'Productivity Tools Co', rating: 4.4, verified: true }
  },
  {
    id: '3',
    name: 'Contract Summarizer',
    title: 'Legal Document Scanner',
    description: 'Extracts key terms, obligations, and risks from legal contracts and agreements.',
    type: 'Document Analysis',
    category: 'Legal',
    features: ['Clause extraction', 'Risk identification', 'Term comparison', 'Obligation tracking'],
    icon: Scroll,
    color: 'blue',
    price: 89.99,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    featured: false,
    tags: ['Legal', 'Documents', 'Compliance'],
    seller: { name: 'LegalTech Solutions', rating: 4.7, verified: true }
  },
  {
    id: '4',
    name: 'Research Assistant',
    title: 'Research Assistant AI',
    description: 'Conducts legal research across cases, statutes, and regulations to support legal analyses.',
    type: 'Information Retrieval',
    category: 'Research',
    features: ['Case law research', 'Regulatory compliance checks', 'Precedent identification', 'Citation generation'],
    icon: FileSearch,
    color: 'violet',
    price: 59.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    featured: true,
    tags: ['Research', 'Academic', 'Citations'],
    seller: { name: 'Academic AI Tools', rating: 4.9, verified: true }
  },
  {
    id: '5',
    name: 'Customer Feedback Analyzer',
    title: 'Customer Service AI',
    description: 'Processes customer feedback to identify patterns, sentiment, and actionable insights.',
    type: 'Data Analysis',
    category: 'Customer Support',
    features: ['Sentiment analysis', 'Trend identification', 'Priority issue flagging', 'Improvement recommendations'],
    icon: BarChart,
    color: 'cyan',
    price: 69.99,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    featured: false,
    tags: ['Support', 'Customer Service', 'Automation'],
    seller: { name: 'Support Solutions', rating: 4.5, verified: true }
  }
];


export const categories = [
  'Marketing',
  'Analytics', 
  'Productivity', 
  'Legal', 
  'Research', 
  'Customer Support'
];