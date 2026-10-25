import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api.js'
import { cleanName } from './utils/text.js'
import './Loginpage.css'
import './Vendorsignup.css'

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const phoneOk = (v) => /^(09\d{9}|\+639\d{9})$/.test(v.replace(/[\s-]/g, ''))

const CITIES = ['Tagbilaran City', 'Panglao', 'Loboc', 'Maribojoc']
const RESERVED_EMAILS = ['customer@bhlrride.test', 'admin@bhlrride.test']

// Which box to jump to first when there are mistakes
const FIELD_ORDER = ['ownerFirst', 'ownerLast', 'email', 'phone', 'password', 'confirm', 'businessName', 'street']

const emptyForm = {
  ownerFirst: '',
  ownerLast: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  businessName: '',
  street: '',
  city: 'Tagbilaran City',
}

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

function VendorSignup() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null)

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: '' }) // clear that box's message when typing
  }

  const bad = (field) => (errors[field] ? 'true' : undefined)

  const validate = () => {
    const found = {}
    const email = form.email.trim().toLowerCase()
    const business = form.businessName.trim()

    if (!form.ownerFirst.trim()) found.ownerFirst = 'Please enter the first name.'
    if (!form.ownerLast.trim()) found.ownerLast = 'Please enter the last name.'

    if (!email) found.email = 'Please enter your email address.'
    else if (!emailOk(email)) found.email = 'Please enter a valid email, like name@example.com.'
    else if (RESERVED_EMAILS.includes(email)) {
      found.email = 'That email is already registered.'
    }

   if (!phoneOk(form.phone)) found.phone = 'Please enter a valid mobile number.'

    if (!form.password) found.password = 'Please enter a password.'
    else if (form.password.length < 8) found.password = 'Password must be at least 8 characters.'

    if (form.password !== form.confirm) found.confirm = 'Passwords do not match.'

    if (!business) found.businessName = 'Please enter your business name.'

    if (!form.street.trim()) found.street = 'Please enter your street address.'

    return found
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return

    const found = validate()
    setErrors(found)

    const first = FIELD_ORDER.find((key) => found[key])
    if (first) {
      document.getElementById('vs-' + first)?.focus()
      return
    }

    setSaving(true)
    try {
      await api('/vendor-applications', {
        method: 'POST',
        body: {
          ownerFirst: cleanName(form.ownerFirst),
          ownerLast: cleanName(form.ownerLast),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          businessName: form.businessName.trim(),
          street: form.street.trim(),
          city: form.city,
        },
      })
      setDone(form.businessName.trim())
    } catch (error) {
      // the server names the box that is wrong (email, businessName...)
      const serverErrors = {}
      Object.entries(error.errors || {}).forEach(([field, messages]) => {
        serverErrors[field] = messages[0]
      })
      if (Object.keys(serverErrors).length === 0) serverErrors.businessName = error.message
      setErrors(serverErrors)
      const firstBad = FIELD_ORDER.find((key) => serverErrors[key])
      if (firstBad) document.getElementById('vs-' + firstBad)?.focus()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="lg">
      <aside className="lg-panel">
        <Link className="lg-brand" to="/browse">BHLR<span>Ride</span></Link>
        <div className="lg-hero">
          <p className="lg-eyebrow">RENT OUT WITH BHLRRIDE</p>
          <h1>Put your fleet <em>on the road.</em></h1>
          <p>Register your rental business, list your cars and motorcycles, and manage bookings in one place. An administrator reviews every application before you can start.</p>
        </div>
      </aside>

      <main className="lg-side">
        <Link className="lg-back" to="/login">← Back to log in</Link>

        {done ? (
          <div className="lg-form vs-done">
            <span className="vs-check">✓</span>
            <h2>Application sent!</h2>
            <p className="lg-sub">
              <strong>{done}</strong> is now waiting for administrator approval. You'll be able to log in
              with your email and password once it's approved.
            </p>
            <Link className="lg-submit vs-link" to="/login">Go to log in</Link>
          </div>
        ) : (
          <form className="lg-form" onSubmit={submit} noValidate>
            <h2>Become a vendor.</h2>
            <p className="lg-sub">Tell us about you and your rental business.</p>

            <p className="lg-group">YOUR ACCOUNT</p>
            <div className="lg-row">
              <Field label="First name" error={errors.ownerFirst}>
                <input
                  id="vs-ownerFirst"
                  value={form.ownerFirst}
                  onChange={set('ownerFirst')}
                  autoComplete="given-name"
                  autoCapitalize="words"
                  aria-invalid={bad('ownerFirst')}
                />
              </Field>
              <Field label="Last name" error={errors.ownerLast}>
                <input
                  id="vs-ownerLast"
                  value={form.ownerLast}
                  onChange={set('ownerLast')}
                  autoComplete="family-name"
                  autoCapitalize="words"
                  aria-invalid={bad('ownerLast')}
                />
              </Field>
            </div>
            <Field label="Email address" error={errors.email}>
              <input
                id="vs-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                autoCapitalize="none"
                aria-invalid={bad('email')}
              />
            </Field>
            <Field label="Contact number" error={errors.phone}>
              <input
                id="vs-phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                autoComplete="tel"
                placeholder="09XX XXX XXXX"
                aria-invalid={bad('phone')}
                maxLength={16}
                inputMode='tel'
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <span className="lg-pass">
                <input
                  id="vs-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  aria-invalid={bad('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </Field>
            <Field label="Confirm password" error={errors.confirm}>
              <input
                id="vs-confirm"
                type={showPassword ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
                aria-invalid={bad('confirm')}
              />
            </Field>

            <p className="lg-group">YOUR BUSINESS</p>
            <Field label="Business name" error={errors.businessName}>
              <input
                id="vs-businessName"
                value={form.businessName}
                onChange={set('businessName')}
                aria-invalid={bad('businessName')}
              />
            </Field>
            <Field label="Street address" error={errors.street}>
              <input
                id="vs-street"
                value={form.street}
                onChange={set('street')}
                autoComplete="street-address"
                aria-invalid={bad('street')}
              />
            </Field>
            <div className="lg-row">
              <Field label="City">
                <select value={form.city} onChange={set('city')}>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Province">
                <input value="Bohol" disabled />
              </Field>
            </div>

            <button className="lg-submit" type="submit" disabled={saving}>{saving ? 'Sending…' : 'Submit application →'}</button>

            <p className="lg-switch">
              Already approved? <Link to="/login">Log in</Link>
            </p>
          </form>
        )}

        <p className="lg-foot">© 2026 BHLRRide</p>
      </main>
    </div>
  )
}

export default VendorSignup