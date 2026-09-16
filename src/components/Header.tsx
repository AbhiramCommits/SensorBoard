import { Link } from 'react-router-dom'
import './Header.css'

export function Header() {
  return (
    <header className="header">
      <Link className="header__brand" to="/sensors">
        <span className="header__logo" aria-hidden="true" />
        <span>SensorBoard</span>
      </Link>
    </header>
  )
}
