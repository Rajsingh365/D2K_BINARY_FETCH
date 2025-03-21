import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Transition from '@/components/animations/Transition';
import { Button } from '@/components/ui/button';
import { ArrowDown, Cpu, Layers, Zap, PlusCircle, ChevronRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();


  const goToWorkflowEditor = () => {
    navigate('/workflow-editor');
  };

  return (
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
                  <Button variant="outline" className="h-12 px-6 gap-2" onClick={goToWorkflowEditor}>
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
  );
};

export default Index;
