import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { homeFor, useAuth } from './auth/auth.js'
import './Loginpage.css'

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const phoneOk = (v) => /^(09\d{9}|\+639\d{9})$/.test(v.replace(/[\s-]/g, ''))

// Which box to jump to first when there are mistakes
const FIELD_ORDER = ['firstName', 'lastName', 'phone', 'email', 'password', 'confirm']

// A label with its box and (when needed) a red message right under the box
function Field({ label, error, children }) {
  return (
    <label>
      {label}
      {children}
      {error && (
        <small className="lg-field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  )
}

function LoginPage() {
  const { user, login, signup } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('') // errors that are not about one box (like a wrong password)
  const [errors, setErrors] = useState({}) // one message per box
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })

  // Already logged in: go to where they were headed, or their home page
  if (user) {
    return <Navigate to={location.state?.from || homeFor(user.role)} replace />
  }

  const isLogin = mode === 'login'

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: '' }) // clear that box's message when typing
  }

  const switchMode = (next) => {
    setMode(next)
    setErrors({})
    setFormError('')

    setForm({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirm: '',
      })
  }

  const validate = () => {
    const found = {}

    if (!isLogin) {
      if (!form.firstName.trim()) found.firstName = 'Please enter your first name.'
      if (!form.lastName.trim()) found.lastName = 'Please enter your last name.'
      if (!phoneOk(form.phone)) found.phone = 'Please enter a valid mobile number.'
    }

    if (!form.email.trim()) found.email = 'Please enter your email address.'
    else if (!emailOk(form.email.trim())) found.email = 'Please enter a valid email address.'

    if (!form.password) found.password = 'Please enter your password.'
    else if (!isLogin && form.password.length < 8) found.password = 'Password must be at least 8 characters.'

    if (!isLogin && form.password !== form.confirm) found.confirm = 'Passwords do not match.'

    return found
  }

  const submit = (e) => {
    e.preventDefault()
    setFormError('')

    const found = validate()
    setErrors(found)

    const first = FIELD_ORDER.find((key) => found[key])
    if (first) {
      document.getElementById('lg-' + first)?.focus()
      return
    }

    if (isLogin) {
      const result = login(form.email, form.password)
      if (!result.ok) setFormError(result.error)
      return
    }

    const result = signup(form)
    if (!result.ok) {
      setErrors({ email: result.error })
      document.getElementById('lg-email')?.focus()
    }
  }

  const bad = (field) => (errors[field] ? 'true' : undefined)

  return (
    <div className="lg">
      <aside className="lg-panel">
        <Link className="lg-brand" to="/browse">BHLR<span>Ride</span></Link>
        <div className="lg-hero">
          <p className="lg-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h1>Great roads.<br /><em>Better rides.</em></h1>
          <p>Four wheels or two. Find your freedom with a ride that makes every journey around Bohol feel extraordinary.</p>
        </div>
      </aside>

      <main className="lg-side">
        <Link className="lg-back" to="/browse">← Back to our fleet</Link>

        <form className="lg-form" onSubmit={submit} noValidate>
          <h2>{isLogin ? 'Welcome back.' : 'Create your account.'}</h2>
          <p className="lg-sub">
            {isLogin
              ? 'Log in to manage your bookings and get ready for your next ride.'
              : 'Sign up as a customer to book cars and motorcycles.'}
          </p>

          {formError && <div className="lg-error" role="alert">{formError}</div>}

          {!isLogin && (
            <>
              <div className="lg-row">
                <Field label="First name" error={errors.firstName}>
                  <input
                    id="lg-firstName"
                    value={form.firstName}
                    onChange={set('firstName')}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    aria-invalid={bad('firstName')}
                  />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input
                    id="lg-lastName"
                    value={form.lastName}
                    onChange={set('lastName')}
                    autoComplete="family-name"
                    autoCapitalize="words"
                    aria-invalid={bad('lastName')}
                  />
                </Field>
              </div>
              <Field label="Middle name (optional)">
                <input
                  value={form.middleName}
                  onChange={set('middleName')}
                  autoComplete="additional-name"
                  autoCapitalize="words"
                />
              </Field>
              <Field label="Phone number" error={errors.phone}>
                <input
                  id="lg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                  aria-invalid={bad('phone')}
                  maxLength={16}
                  inputMode="tel"
                />
              </Field>
            </>
          )}

          <Field label="Email address" error={errors.email}>
            <input
              id="lg-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              autoCapitalize="none"
              placeholder="Enter your email address"
              aria-invalid={bad('email')}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <span className="lg-pass">
              <input
                id="lg-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
                aria-invalid={bad('password')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </Field>

          {!isLogin && (
            <Field label="Confirm password" error={errors.confirm}>
              <input
                id="lg-confirm"
                type={showPassword ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                aria-invalid={bad('confirm')}
              />
            </Field>
          )}

          <button className="lg-submit" type="submit">
            {isLogin ? 'Log in' : 'Create account'} →
          </button>

          <p className="lg-switch">
            {isLogin ? 'New to BHLRRide? ' : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')}>
              {isLogin ? 'Create an account' : 'Log in'}
            </button>
          </p>

          <p className="lg-switch">
            Own a rental shop? <Link to="/become-a-vendor">Become a vendor</Link>
          </p>
        </form>

        <p className="lg-foot">© 2026 BHLRRide</p>
      </main>
    </div>
  )
}

export default LoginPage