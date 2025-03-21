
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        className={cn("whitespace-nowrap", 
          selectedCategory === null 
            ? "border-none shadow-none bg-primary text-primary-foreground" 
            : "border-border text-muted-foreground"
        )}
        onClick={() => onSelectCategory(null)}
      >
        All Categories
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          className={cn("whitespace-nowrap",
            selectedCategory === category 
              ? "border-none shadow-none bg-primary text-primary-foreground" 
              : "border-border text-muted-foreground"
          )}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
