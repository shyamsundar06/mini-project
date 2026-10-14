import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('tourist');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const newUser = await register({
        name,
        email,
        password,
        role,
        phone,
        company_name: role === 'operator' ? companyName : undefined
      });
      if (newUser.role === 'operator') {
        navigate('/operator');
      } else {
        navigate('/tourist');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-800">
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create Account</h1>
          <p className="text-xs text-slate-500 font-medium">Join the TrailSync Tourism Management Platform</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-4 shadow-md">
          {/* Role selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setRole('tourist')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                role === 'tourist' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              I am a Tourist
            </button>
            <button
              type="button"
              onClick={() => setRole('operator')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                role === 'operator' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              I am a Tour Operator
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>

            {role === 'operator' && (
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Nilgiri Heritage Travels"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Register'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
