import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };

export const Card: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`glass-card rounded-xl border border-brand-border ${className}`} {...props} />
);

export const CardHeader: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`p-4 border-b border-brand-border ${className}`} {...props} />
);

export const CardTitle: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`text-xl font-semibold text-brand-text-primary ${className}`} {...props} />
);

export const CardDescription: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`text-xs text-brand-text-secondary ${className}`} {...props} />
);

export const CardContent: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props} />
);

export const CardFooter: React.FC<DivProps> = ({ className = '', ...props }) => (
  <div className={`p-4 border-t border-brand-border ${className}`} {...props} />
);
