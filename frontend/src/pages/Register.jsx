import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else if (data?.session) {
      localStorage.setItem('supabase.auth.token', data.session.access_token);
      navigate('/');
    } else {
      setError('Registration successful! Please check your email to verify your account.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light px-4 py-5">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center justify-center gap-2 p-8 sm:p-10 rounded-xl bg-white border border-border-color shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2 pb-4">
            <span className="material-symbols-outlined text-primary text-3xl">translate</span>
            <span className="text-2xl font-bold text-text-primary">Lexicon</span>
          </div>

          {/* Headline */}
          <h1 className="text-text-primary tracking-light text-[32px] font-bold leading-tight text-center pb-4">
            Create Account
          </h1>

          {error && (
            <div className={`mb-4 w-full p-3 rounded-lg text-sm ${
              error.includes('successful')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="flex w-full flex-col items-stretch gap-4">
            <div className="flex flex-wrap items-end w-full">
              <label className="flex flex-col w-full flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Email
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input h-14"
                  placeholder="Enter your email"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-end w-full">
              <label className="flex flex-col w-full flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Password
                </p>
                <div className="flex w-full flex-1 items-stretch">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input h-14 rounded-r-none border-r-0"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-secondary flex border border-border-color bg-white items-center justify-center px-4 rounded-r-lg border-l-0 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-umber"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>
            </div>

            <div className="w-full pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-base font-bold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-umber focus:ring-offset-2"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="pt-6 text-center">
            <p className="text-text-secondary text-sm font-normal">
              Already have an account?{' '}
              <Link to="/login" className="font-bold hover:underline text-text-secondary">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
