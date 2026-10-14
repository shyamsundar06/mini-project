import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, Shield, User, KeyRound, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('operator@tourism.com');
  const [password, setPassword] = useState('Password123!');
  const [roleTab, setRoleTab] = useState('operator');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'operator') {
        navigate('/operator');
      } else {
        navigate('/tourist');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role) => {
    switchRoleDemo(role);
    if (role === 'operator') {
      navigate('/operator');
    } else {
      navigate('/tourist');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-800">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            TrailSync Platform
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            AI Multi-Agent Intelligent Tourism Management Platform
          </p>
        </div>

        {/* Quick Demo Login Preset Buttons */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Instant 1-Click Demo Access</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('operator')}
              className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Tour Operator Demo</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('tourist')}
              className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>Tourist App Demo</span>
            </button>
          </div>
        </div>

        {/* Main Login Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-5 shadow-md">
          {/* Role selector tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setRoleTab('operator');
                setEmail('operator@tourism.com');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                roleTab === 'operator' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Tour Operator
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('tourist');
                setEmail('rahul.kumar@gmail.com');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                roleTab === 'tourist' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Tourist
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold">
              Create one here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
