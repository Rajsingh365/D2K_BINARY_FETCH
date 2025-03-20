
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const Transition: React.FC<TransitionProps> = ({ 
  children, 
  className,
  delay = 0
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-700 ease-out',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Transition;
