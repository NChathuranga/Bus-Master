import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, Loader2, BusFront, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Bus / Transport related images from Unsplash
const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop',
    title: 'Streamline Your Fleet Operations',
    subtitle: 'Manage routes, drivers, and vehicles all in one place.'
  },
  {
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1200&auto=format&fit=crop',
    title: 'Track Fuel & Maintenance Easily',
    subtitle: 'Monitor costs and keep your fleet in top condition.'
  },
  {
    image: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?q=80&w=1200&auto=format&fit=crop',
    title: 'Smart Scheduling System',
    subtitle: 'Plan and assign schedules with zero conflicts.'
  },
  {
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
    title: 'Real-Time Fleet Analytics',
    subtitle: 'Get insights and generate reports instantly.'
  }
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Auto slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const goToSlide = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const goToNext = () => {
    goToSlide((currentSlide + 1) % SLIDES.length);
  };

  const goToPrev = () => {
    goToSlide((currentSlide - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#F0F4F8] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      
      {/* Main Card - Fit to Screen */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-300/40 flex flex-col md:flex-row w-full max-w-5xl h-full max-h-[92vh] md:max-h-[660px] overflow-hidden border border-slate-100">
        
        {/* LEFT - Form Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto no-scrollbar">
          
          <div>
            {/* Mobile Brand */}
            <div className="flex md:hidden items-center gap-2 mb-4 text-blue-600">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <BusFront className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-wide text-slate-800">BusMaster</span>
            </div>

            {/* Title */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 mb-1.5 tracking-tight">
                Welcome back 👋
              </h2>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">
                Please enter your details to sign in.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2.5">
                <AlertCircle className="text-red-500 w-4 h-4 shrink-0" />
                <p className="text-red-700 text-xs font-medium">{error}</p>
              </div>
            )}


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Username */}
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Forgot */}
              <div className="flex justify-end">
                <a href="#" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-300/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Register Link */}
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline underline-offset-2">
              Sign Up
            </Link>
          </p>

        </div>

        {/* RIGHT - Image Carousel Section */}
        <div className="hidden md:block w-1/2 p-3">
          <div className="relative w-full h-full rounded-[1.2rem] overflow-hidden">
            
            {/* All Images stacked */}
            {SLIDES.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
            ))}

            {/* Slide Text Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 flex flex-col justify-end h-full">
              {/* Brand Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/25 text-white px-3 py-1.5 rounded-lg mb-auto w-fit shadow-lg">
                <BusFront className="w-4 h-4" />
                <span className="font-bold tracking-wider text-xs uppercase">BusMaster Pro</span>
              </div>

              {/* Slide text with smooth fade transition */}
              <div className="relative min-h-[100px] mb-4">
                {SLIDES.map((slide, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-700 ease-in-out absolute inset-0 ${
                      index === currentSlide
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                  >
                    <h3 className="text-2xl font-extrabold text-white mb-1.5 leading-snug drop-shadow-md">
                      {slide.title}
                    </h3>
                    <p className="text-slate-300 font-medium text-xs leading-relaxed max-w-sm">
                      {slide.subtitle}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dot Indicators + Arrow Buttons */}
              <div className="flex items-center justify-between relative z-30 pt-2">
                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {SLIDES.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentSlide
                          ? 'w-6 h-2 bg-white shadow-lg'
                          : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>

                {/* Prev / Next Arrows */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={goToPrev}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 active:scale-90"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 active:scale-90"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;