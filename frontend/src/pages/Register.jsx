import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Lock, ArrowRight, Loader2, BusFront, 
  AlertCircle, ShieldCheck, ChevronDown 
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Bus & Routing walata galapena aluth images saha text
const slides = [
  {
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1000&auto=format&fit=crop",
    title: "Join the BusMaster Network.",
    desc: "Create your account to start managing fleets, assigning routes, and monitoring daily operations."
  },
  {
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1000&auto=format&fit=crop",
    title: "Advanced Route Planning.",
    desc: "Optimize travel distances and schedules with our state-of-the-art route management system."
  },
  {
    image: "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?q=80&w=1000&auto=format&fit=crop",
    title: "Empower Your Workforce.",
    desc: "Give your staff and admins the professional tools they need to collaborate and succeed seamlessly."
  }
];

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Image Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Slider Auto-Play Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Password Matching Check
    if (password !== confirmPassword) {
      setError('Passwords do not match! Please verify both password entries. (මුරපද දෙක සමාන නොවේ)');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { username, password, role });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMatch = password && confirmPassword && password === confirmPassword;
  const isPasswordMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      
      {/* Main Container */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row w-full max-w-5xl h-full max-h-[92vh] md:max-h-[660px] overflow-hidden border border-slate-100">
        
        {/* Left Form Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative z-10 bg-white overflow-y-auto no-scrollbar">
          
          <div>
            {/* Logo for mobile */}
            <div className="flex md:hidden items-center gap-2 mb-4 text-blue-600">
              <BusFront className="w-5 h-5" />
              <span className="font-bold text-lg tracking-wide">BusMaster</span>
            </div>

            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 mb-1.5 tracking-tight">
                Create an Account 🚀
              </h2>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">
                Set up your profile with password verification to access the dashboard.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2.5 animate-fade-in">
                <AlertCircle className="text-red-500 w-4 h-4 shrink-0" />
                <p className="text-red-700 text-xs font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Username Input */}
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 chars)"
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  required
                />
              </div>

              {/* Confirm Password Input */}
              <div className="relative group">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  isPasswordMatch ? 'text-emerald-500' : isPasswordMismatch ? 'text-red-500' : 'text-slate-400 group-focus-within:text-blue-600'
                }`} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  minLength={6}
                  className={`w-full pl-10 pr-3.5 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white outline-none transition-all placeholder:text-slate-400 placeholder:font-normal ${
                    isPasswordMatch ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500/20' : 
                    isPasswordMismatch ? 'border-red-400 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                  required
                />
              </div>

              {/* Password Match Status Indicator */}
              {confirmPassword && (
                <div className="text-[11px] font-bold px-1 flex items-center gap-1.5">
                  {isPasswordMatch ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      ✓ Passwords match (මුරපද සමානයි)
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      ✕ Passwords do not match! (මුරපද දෙක සමාන නොවේ)
                    </span>
                  )}
                </div>
              )}

              {/* Role Select Dropdown */}
              <div className="relative group">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all appearance-none cursor-pointer text-slate-700"
                >
                  <option value="staff">Staff Member</option>
                  <option value="driver">Bus Driver</option>
                  <option value="admin">Administrator</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isPasswordMismatch}
                className="group w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Account & Register
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>

        {/* Right Image Slider Section */}
        <div className="hidden md:block w-1/2 p-4">
          <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden group bg-slate-900">
            
            {/* Dark overlay fixed on top */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent z-10 pointer-events-none"></div>
            
            {/* Top Brand Badge */}
            <div className="absolute top-8 left-8 z-20">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl shadow-xl">
                <BusFront className="w-5 h-5" />
                <span className="font-bold tracking-wider text-sm">BusMaster Pro</span>
              </div>
            </div>

            {/* Slides Mapping */}
            {slides.map((slide, index) => (
              <div 
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  currentSlide === index ? "opacity-100 z-0" : "opacity-0 -z-10"
                }`}
              >
                {/* Background Image with slow zoom effect */}
                <img 
                  src={slide.image} 
                  alt={slide.title} 
                  className={`w-full h-full object-cover transform transition-transform duration-[7000ms] ease-out ${
                    currentSlide === index ? "scale-105" : "scale-100"
                  }`}
                />
                
                {/* Dynamic Text */}
                <div className="absolute bottom-20 left-12 right-12 z-20">
                  <h3 className="text-4xl font-bold text-white mb-4 leading-tight transform transition-transform duration-700 translate-y-0">
                    {slide.title}
                  </h3>
                  <p className="text-slate-300 font-medium text-base leading-relaxed max-w-md">
                    {slide.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Slide Indicators (Dots) */}
            <div className="absolute bottom-8 left-12 right-12 z-20 flex gap-2">
              {slides.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === index ? "w-8 bg-blue-500" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;