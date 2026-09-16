import { PAGE_SIZES } from '../constants'
import './Pagination.css'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

function getPageNumbers(current: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const start = Math.max(1, Math.min(current - 2, totalPages - 4))
  return Array.from({ length: 5 }, (_, index) => start + index)
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination__summary" aria-live="polite">
        {total === 0 ? 'No sensors' : `Showing ${firstItem}–${lastItem} of ${total}`}
      </p>
      <div className="pagination__controls">
        <div className="pagination__field">
          <label htmlFor="page-size">Page size</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number.parseInt(event.target.value, 10))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <button
          className="button button--ghost"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <div className="pagination__numbers" aria-label="Page numbers">
          {pageNumbers.map((number) => (
            <button
              key={number}
              className={
                number === page
                  ? 'pagination__number pagination__number--current'
                  : 'pagination__number'
              }
              type="button"
              aria-current={number === page ? 'page' : undefined}
              onClick={() => onPageChange(number)}
            >
              {number}
            </button>
          ))}
        </div>
        <button
          className="button button--ghost"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  )
}
