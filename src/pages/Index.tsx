import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AgentCard from '@/components/marketplace/AgentCard';
import WorkflowBuilder from '@/components/marketplace/WorkflowBuilder';
import WorkflowPreview from '@/components/marketplace/WorkflowPreview';
import CategoryFilter from '@/components/marketplace/CategoryFilter';
import SearchBar from '@/components/ui/SearchBar';
import Transition from '@/components/animations/Transition';
import { Button } from '@/components/ui/button';
import { Agent, agents, categories, workflowTemplates } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ArrowDown, Cpu, Layers, Zap, PlusCircle, ChevronRight } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>(agents);
  const [selectedSection, setSelectedSection] = useState<'marketplace' | 'templates'>('marketplace');

  useEffect(() => {
    let filtered = agents;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        agent => 
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query) ||
          agent.category.toLowerCase().includes(query) ||
          agent.type.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(agent => agent.category === selectedCategory);
    }
    
    setFilteredAgents(filtered);
  }, [searchQuery, selectedCategory]);

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgents(prev => {
      if (prev.some(a => a.id === agent.id)) {
        return prev.filter(a => a.id !== agent.id);
      }
      return [...prev, agent];
    });
  };

  const handleAgentRemove = (agentId: string) => {
    setSelectedAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const clearWorkflow = () => {
    setSelectedAgents([]);
  };

  const applyTemplate = (templateId: string) => {
    const template = workflowTemplates.find(t => t.id === templateId);
    if (template) {
      const templateAgents = template.agentIds
        .map(id => agents.find(a => a.id === id))
        .filter(a => a) as Agent[];
      
      setSelectedAgents(templateAgents);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24">
        <section className="py-16 md:py-24">
          <div className="container">
            <Transition>
              <div className="max-w-2xl mx-auto text-center mb-16">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
                  <Cpu size={14} className="mr-1.5" />
                  AI Agent Marketplace
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Build Your Own AI Workflows
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Connect specialized AI agents to create powerful custom workflows that automate and enhance your specific tasks.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button className="h-12 px-6 gap-2">
                    <Layers size={18} />
                    Explore Marketplace
                  </Button>
                  <Button variant="outline" className="h-12 px-6 gap-2">
                    <PlusCircle size={18} />
                    Create Custom Flow
                  </Button>
                </div>
              </div>
            </Transition>

            <Transition delay={200}>
              <div className="flex justify-center">
                <div className="animate-bounce rounded-full bg-primary/10 p-2">
                  <ArrowDown size={24} className="text-primary" />
                </div>
              </div>
            </Transition>
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container">
            <Transition>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Zap size={24} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Modular AI Agents</h3>
                  <p className="text-muted-foreground">
                    Specialized AI agents that excel at specific tasks, ready to be combined into powerful workflows.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Layers size={24} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Customizable Workflows</h3>
                  <p className="text-muted-foreground">
                    Drag and drop AI agents to create custom workflows tailored to your specific needs.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Cpu size={24} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Industry Optimized</h3>
                  <p className="text-muted-foreground">
                    Pre-configured workflow templates for different industries and use cases.
                  </p>
                </div>
              </div>
            </Transition>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <Transition>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1">AI Agent Marketplace</h2>
                  <p className="text-muted-foreground max-w-2xl">
                    Browse our collection of specialized AI agents and combine them to create your custom workflow.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant={selectedSection === 'marketplace' ? "default" : "outline"}
                    onClick={() => setSelectedSection('marketplace')}
                    className="gap-1.5"
                  >
                    <Layers size={16} />
                    Agents
                  </Button>
                  <Button 
                    variant={selectedSection === 'templates' ? "default" : "outline"}
                    onClick={() => setSelectedSection('templates')}
                    className="gap-1.5"
                  >
                    <Zap size={16} />
                    Templates
                  </Button>
                </div>
              </div>
            </Transition>

            {selectedSection === 'marketplace' ? (
              <div className="space-y-8">
                <Transition delay={100}>
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <CategoryFilter 
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                    />
                    <div className="w-full md:w-1/3">
                      <SearchBar onSearch={setSearchQuery} />
                    </div>
                  </div>
                </Transition>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAgents.map((agent, index) => (
                    <Transition key={agent.id} delay={150 + index * 50}>
                      <AgentCard 
                        agent={agent} 
                        onClick={handleAgentSelect}
                        selected={selectedAgents.some(a => a.id === agent.id)}
                      />
                    </Transition>
                  ))}
                  
                  {filteredAgents.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                      <h3 className="text-lg font-medium mb-2">No agents found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or filters to find what you're looking for.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {workflowTemplates.map((template, index) => (
                  <Transition key={template.id} delay={100 + index * 50}>
                    <div className="p-6 border rounded-xl bg-white hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-medium mb-1">{template.name}</h3>
                          <p className="text-muted-foreground mb-4">{template.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {template.agentIds.map(id => {
                              const agent = agents.find(a => a.id === id);
                              return agent ? (
                                <div key={id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary">
                                  {agent.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Button onClick={() => applyTemplate(template.id)} className="gap-1.5">
                            <Zap size={16} />
                            Use Template
                            <ChevronRight size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Transition>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container">
            <Transition>
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-1">Build Your Workflow</h2>
                <p className="text-muted-foreground">
                  Select agents from the marketplace above and connect them to create your custom AI workflow.
                </p>
              </div>
            </Transition>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Transition delay={100} className="md:col-span-2">
                <WorkflowBuilder 
                  selectedAgents={selectedAgents}
                  onRemove={handleAgentRemove}
                  onClear={clearWorkflow}
                />
              </Transition>

              <Transition delay={200}>
                <WorkflowPreview selectedAgents={selectedAgents} />
              </Transition>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <Transition>
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to supercharge your workflows with AI?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join our community of innovators creating custom AI solutions for every industry and use case.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="h-12 px-8">
                    Get Started
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Learn More
                  </Button>
                </div>
              </div>
            </Transition>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
