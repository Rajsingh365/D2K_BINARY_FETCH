import {
  BarChart,
  FileSearch,
  FileText,
  Scroll,
  Search,
  LucideIcon,
} from "lucide-react";

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

// Add this fallback if needed elsewhere
export const createFallbackAgent = (
  id: number | string,
  name: string = "Unknown Agent"
): Agent => {
  return {
    id: typeof id === "string" ? parseInt(id) : id,
    name,
    description: "A dragged agent",
    type: "Custom",
    color: "gray",
  };
};

export const categories = [
  "marketing",         // SEO Optimizer
  "productivity",      // Meeting Summarizer, Smart Email Manager, Zoom Meeting Scheduler
  "content",           // Grammar and Style Checker
  "automation",        // Smart Email Manager
  "scheduling",        // Zoom Meeting Scheduler
  "writing"            // Grammar and Style Checker
];