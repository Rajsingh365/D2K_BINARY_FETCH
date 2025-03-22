import express from 'express'
import dotenv from 'dotenv'
import paymentRoutes from './routes/payment.route.js'
import cors from 'cors'

dotenv.config()

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get('/', (req, res) => {
  res.send("Hello")
});

app.use('/api/payment', paymentRoutes)
app.get('/api/marketplace/agents', (req, res) => {
  res.json(agents)
})
app.listen(process.env.PORT, () => {
  console.log('Node BK Working on localhost:5000');
});

const agents= [
  {
    "id": 1,
    "name": "SEO Optimizer",
    "title": "SEO Optimizer Pro",
    "description": "Analyzes and enhances content to maximize search engine visibility and ranking.",
    "category": "Marketing",
    "type": "Content Enhancement",
    "features": [
      "Keyword optimization",
      "SEO score analysis",
      "Competitor content insights",
      "Readability improvements"
    ],
    "icon": "Search",
    "color": "blue",
    "price": 49.99,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    "featured": true,
    "tags": ["SEO", "Marketing", "Optimization"],
    "seller": {
      "name": "AI Solutions Inc",
      "rating": 4.8,
      "verified": true
    },
    "input_schema": {
      "type": "object",
      "properties": {
        "content": { "type": "string" },
        "keywords": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["content"]
    },
    "output_schema": {
      "type": "object",
      "properties": {
        "keyword_analysis": { "type": "object" },
        "recommendations": {
          "type": "array",
          "items": { "type": "string" }
        },
        "seo_score": { "type": "number" }
      }
    },
    "config_schema": {
      "type": "object",
      "properties": {
        "collection_name": { "type": "string" }
      }
    },
    "implementation_path": "app.agents.seo_optimizer.SEOOptimizer"
  },
  {
    "id": 2,
    "name": "Meeting Summarizer",
    "title": "AI Meeting Assistant",
    "description": "Converts lengthy meetings into concise, actionable summaries with key points and follow-ups.",
    "category": "Productivity",
    "type": "Summarization",
    "features": [
      "Automated meeting notes",
      "Action item extraction",
      "Decision highlighting",
      "Searchable transcripts"
    ],
    "icon": "FileText",
    "color": "indigo",
    "price": 39.99,
    "rating": 4.6,
    "image": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    "featured": false,
    "tags": ["Meetings", "Transcription", "Notes"],
    "seller": {
      "name": "Productivity Tools Co",
      "rating": 4.4,
      "verified": true
    },
    "input_schema": {
      "type": "object",
      "properties": {
        "transcript": { "type": "string" }
      },
      "required": ["transcript"]
    },
    "output_schema": {
      "type": "object",
      "properties": {
        "summary": { "type": "string" },
        "action_items": { "type": "array" },
        "participants": { "type": "array" },
        "duration_minutes": { "type": "integer" }
      }
    },
    "config_schema": {
      "type": "object",
      "properties": {
        "summary_length": {
          "type": "string",
          "enum": ["short", "medium", "long"]
        },
        "extract_actions": { "type": "boolean" }
      }
    },
    "implementation_path": "app.agents.meeting_summarizer.MeetingSummarizer"
  },
  {
    "id": 3,
    "name": "Smart Email Manager",
    "title": "Smart Email Manager AI",
    "description": "Categorizes, prioritizes, and drafts responses to emails.",
    "category": "Productivity",
    "type": "Automation",
    "features": [
      "Email categorization",
      "Priority sorting",
      "AI-generated responses",
      "Spam filtering"
    ],
    "icon": "Scroll",
    "color": "blue",
    "price": 59.99,
    "rating": 4.5,
    "image": "https://images.unsplash.com/photo-1518770660439-4636190af475",
    "featured": true,
    "tags": ["Email", "Automation", "Inbox Management"],
    "seller": {
      "name": "Inbox Solutions Inc",
      "rating": 4.6,
      "verified": true
    },
    "input_schema": {
      "type": "object",
      "properties": {
        "email": { "type": "object" }
      },
      "required": ["email"]
    },
    "output_schema": {
      "type": "object"
    },
    "config_schema": {
      "type": "object",
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["categorize", "prioritize", "draft_response"]
        },
        "response_tone": {
          "type": "string",
          "enum": ["professional", "friendly", "concise"]
        }
      }
    },
    "implementation_path": "app.agents.smart_email_manager.SmartEmailManager"
  }
]
