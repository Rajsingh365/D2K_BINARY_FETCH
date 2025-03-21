
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileCode, Search } from 'lucide-react';
import { marketplaceItems } from '@/lib/marketPlaceData';
import Transition from '@/components/animations/Transition';

const Templates = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState(marketplaceItems);

  // Filter templates based on search query
  React.useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = marketplaceItems.filter(
        template => 
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(marketplaceItems);
    }
  }, [searchQuery]);

  const handleUseTemplate = (templateId: string) => {
    // Navigate to workflow editor with the template ID
    navigate(`/workflow-editor?template=${templateId}`);
  };

  return (
    <main className="flex-grow pt-24 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <Transition>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="px-3 py-1 mb-4 bg-background">
                <FileCode className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Workflow Templates
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Ready-to-Use Workflow Templates
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Get started quickly with pre-built workflows designed for common use cases.
                Customize them to suit your specific needs.
              </p>
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Input 
                    type="search" 
                    placeholder="Search for templates..."
                    className="pr-10 h-12 text-base"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                  />
                  <Search className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Transition>
            <div className="mb-8">
              <h2 className="text-2xl font-bold">Browse Templates</h2>
              <p className="text-muted-foreground">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} available
              </p>
            </div>
          </Transition>

          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template, index) => (
                <Transition key={template.id} delay={index * 100}>
                  <Card className="h-full flex flex-col hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="relative h-40 overflow-hidden rounded-t-lg">
                      <img 
                        src={template.image} 
                        alt={template.title} 
                        className="w-full h-full object-cover"
                      />
                      {template.featured && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="font-medium">
                            Featured
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 h-10">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 flex-grow">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="bg-secondary/30 hover:bg-secondary/40">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 space-y-2">
                        {template.features?.slice(0, 2).map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                              <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-xs text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-2 mt-auto">
                      <Button 
                        variant="default"
                        className="w-full justify-center gap-2"
                        onClick={() => handleUseTemplate(template.id)}
                      >
                        Use Template
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Transition>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any templates that match your search criteria. 
                Try adjusting your search or browse all templates.
              </p>
              <Button 
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                View All Templates
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Templates;
