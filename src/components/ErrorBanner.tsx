import './ErrorBanner.css'

interface ErrorBannerProps {
  title: string
  message: string
  onRetry: () => void
}

export function ErrorBanner({ title, message, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon" aria-hidden="true">
        !!
      </span>
      <div className="error-banner__body">
        <p className="error-banner__title">{title}</p>
        <p className="error-banner__message">{message}</p>
      </div>
      <button className="button error-banner__retry" type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
