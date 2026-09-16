import './Skeleton.css'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  const classes = className ? `skeleton ${className}` : 'skeleton'
  return <span aria-hidden="true" className={classes} />
}

interface SkeletonRowsProps {
  rows?: number
  columns?: number
}

export function SkeletonRows({ rows = 5, columns = 5 }: SkeletonRowsProps) {
  return (
    <div className="skeleton-rows">
      {Array.from({ length: rows }, (_, row) => (
        <div className="skeleton-rows__row" key={row}>
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton className="skeleton-rows__cell" key={column} />
          ))}
        </div>
      ))}
    </div>
  )
}
