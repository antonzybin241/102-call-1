interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-surface-800 p-5 shadow-card dark:shadow-none dark:ring-1 dark:ring-surface-700 ${className}`}>
      {children}
    </div>
  )
}
