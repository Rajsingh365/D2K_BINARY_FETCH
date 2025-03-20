
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  Plus, 
  Clock, 
  Edit2, 
  Copy, 
  Trash2,
  Filter,
  List,
  ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Dummy data for workflows
const myWorkflows = [
  {
    id: 'wf-001',
    name: 'Content Marketing Pipeline',
    description: 'Generates blog posts and distributes them across channels',
    status: 'Active',
    lastRun: '2 hours ago',
    category: 'Marketing',
    agents: 5,
    thumbnail: 'linear-gradient(to right, #4ade80, #22d3ee)',
    favorite: true
  },
  {
    id: 'wf-002',
    name: 'Customer Support Assistant',
    description: 'Analyzes customer inquiries and suggests responses',
    status: 'Paused',
    lastRun: '2 days ago',
    category: 'Support',
    agents: 3,
    thumbnail: 'linear-gradient(to right, #a78bfa, #f472b6)',
    favorite: false
  },
  {
    id: 'wf-003',
    name: 'Daily Team Updates',
    description: 'Collects team activity and sends daily summaries',
    status: 'Active',
    lastRun: '1 day ago',
    category: 'Productivity',
    agents: 2,
    thumbnail: 'linear-gradient(to right, #fb923c, #f87171)',
    favorite: true
  },
  {
    id: 'wf-004',
    name: 'Competitive Analysis',
    description: 'Monitors competitors and provides weekly reports',
    status: 'Draft',
    lastRun: 'Never run',
    category: 'Marketing',
    agents: 4,
    thumbnail: 'linear-gradient(to right, #38bdf8, #818cf8)',
    favorite: false
  },
  {
    id: 'wf-005',
    name: 'Contract Review Pipeline',
    description: 'Analyzes legal documents and flags potential issues',
    status: 'Active',
    lastRun: '5 hours ago',
    category: 'Legal',
    agents: 3,
    thumbnail: 'linear-gradient(to right, #facc15, #fb923c)',
    favorite: false
  },
  {
    id: 'wf-006',
    name: 'Social Media Content Generator',
    description: 'Creates and schedules posts for multiple platforms',
    status: 'Active',
    lastRun: '3 hours ago',
    category: 'Marketing',
    agents: 4,
    thumbnail: 'linear-gradient(to right, #c084fc, #e879f9)',
    favorite: true
  }
];

// Component for displaying a workflow card
const WorkflowCard = ({ workflow }: { workflow: typeof myWorkflows[0] }) => {
  const navigate = useNavigate();
  
  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Paused: 'bg-amber-100 text-amber-800',
    Draft: 'bg-blue-100 text-blue-800'
  };

  return (
    <Card className="workflow-card h-full flex flex-col overflow-hidden border hover:shadow-md transition-shadow">
      <div 
        className="h-28 flex items-center justify-center" 
        style={{ background: workflow.thumbnail }}
      >
        <div className="flex flex-col gap-1 items-center justify-center text-white p-4">
          <span className="text-sm font-medium">{workflow.agents} Agents</span>
          <span className="text-xs opacity-80">{workflow.category}</span>
        </div>
      </div>
      
      <CardContent className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{workflow.name}</h3>
          <Badge className={statusColors[workflow.status as keyof typeof statusColors]}>
            {workflow.status}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {workflow.description}
        </p>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock size={14} className="mr-1" />
          <span>Last run: {workflow.lastRun}</span>
        </div>
      </CardContent>
      
      <CardFooter className="px-5 py-4 bg-muted/20 flex justify-between border-t">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/workflow-editor?id=${workflow.id}`)}
        >
          <Edit2 size={14} className="mr-1" />
          Edit
        </Button>
        
        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <List size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem className="cursor-pointer">
                <Copy size={14} className="mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-600">
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm">
            <Play size={14} className="mr-1" />
            Run
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const MyWorkflows = () => {
  const [viewType, setViewType] = useState('all');
  const navigate = useNavigate();
  
  const filteredWorkflows = viewType === 'favorites' 
    ? myWorkflows.filter(wf => wf.favorite)
    : myWorkflows;
  
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="flex-grow pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Workflows</h1>
              <p className="text-muted-foreground">
                Manage and run your automated AI workflow pipelines
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => navigate('/workflow-editor')}
              className="whitespace-nowrap"
            >
              <Plus size={16} className="mr-2" />
              Create Workflow
            </Button>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Tabs defaultValue="all" className="w-full">
                <div className="flex justify-between items-center">
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="all" onClick={() => setViewType('all')}>All Workflows</TabsTrigger>
                    <TabsTrigger value="favorites" onClick={() => setViewType('favorites')}>Favorites</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter size={14} className="mr-1" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white">
                        <DropdownMenuItem className="cursor-pointer">Active</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Paused</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Draft</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ArrowUpDown size={14} className="mr-1" />
                          Sort
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white">
                        <DropdownMenuItem className="cursor-pointer">Newest first</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Oldest first</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Last run</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Alphabetical</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <TabsContent value="all" className="mt-6">
                  {filteredWorkflows.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredWorkflows.map(workflow => (
                        <WorkflowCard key={workflow.id} workflow={workflow} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No workflows found</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="favorites" className="mt-6">
                  {filteredWorkflows.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredWorkflows.map(workflow => (
                        <WorkflowCard key={workflow.id} workflow={workflow} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No favorite workflows found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-primary/10 to-secondary/10 rounded-xl p-8 border">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="max-w-md">
                <h2 className="text-2xl font-bold mb-2">Explore the Marketplace</h2>
                <p className="text-muted-foreground mb-4">
                  Discover pre-built workflow templates and AI agents to get started quickly
                </p>
                <Button 
                  onClick={() => navigate('/marketplace')}
                  className="gap-1"
                >
                  Browse Marketplace
                  <ArrowRight size={16} />
                </Button>
              </div>
              <div className="flex-grow hidden md:flex justify-end">
                <div className="flex gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm w-32 h-32 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Edit2 className="text-primary" size={20} />
                    </div>
                    <span className="text-xs text-center font-medium">Content<br />Generation</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm w-32 h-32 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                      <ArrowRight className="text-orange-500" size={20} />
                    </div>
                    <span className="text-xs text-center font-medium">Sales<br />Automation</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm w-32 h-32 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <List className="text-green-500" size={20} />
                    </div>
                    <span className="text-xs text-center font-medium">Legal<br />Document</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyWorkflows;
