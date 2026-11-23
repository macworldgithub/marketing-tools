import React from 'react';

interface MarkdownContentProps {
  html: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ html, className = '' }) => {
  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed 
        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:dark:text-white [&>h2]:mt-8 [&>h2]:mb-4
        [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-slate-900 [&>h3]:dark:text-white [&>h3]:mt-6 [&>h3]:mb-3
        [&>p]:mb-4 [&>p]:leading-relaxed
        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-1
        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:mb-1
        [&>blockquote]:border-l-4 [&>blockquote]:border-slate-300 [&>blockquote]:dark:border-slate-700 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4
        [&>code]:bg-slate-100 [&>code]:dark:bg-slate-800 [&>code]:text-slate-900 [&>code]:dark:text-slate-200 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm
        [&>a]:text-accent-primary [&>a]:underline [&>a]:underline-offset-2 hover:[&>a]:opacity-80 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

