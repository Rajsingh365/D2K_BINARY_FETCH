import { BarChart, FileSearch, FileText, Scroll, Search,LucideIcon  } from "lucide-react";

export interface Agent {
  id: number;
  name: string;
  title: string;
  description: string;
  category: string;
  type: string;
  features: string[];
  icon: LucideIcon | string; // Can be a Lucide icon or a string from the backend
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
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  output_schema: {
    type: string;
    properties: Record<string, any>;
  };
  config_schema: {
    type: string;
    properties: Record<string, any>;
  };
  implementation_path: string;
}



export const categories = [
  'Marketing',
  'Analytics', 
  'Productivity', 
  'Legal', 
  'Research', 
  'Customer Support'
];