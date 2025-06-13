import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PasswordResetScreen } from './PasswordResetScreen';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  onLogin: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [currentView, setCurrentView] = useState<'login' | 'passwordReset'>('login');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerification, setEmailVerification] = useState({
    otpSent: false,
    otpVerified: false,
    isVerifying: false,
    isSendingOtp: false,
    countdown: 0,
    needsEmailConfirmation: false
  });

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (error) setError(null);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setEmailVerification(prev => ({ ...prev, isSendingOtp: true }));
    setError(null);
    
    try {
      console.log('Sending OTP to:', formData.email);
      
      // For demo purposes, simulate OTP sending
      // In production, you'd integrate with an email service like SendGrid, Mailgun, etc.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('OTP sent successfully (demo mode)');
      setEmailVerification(prev => ({ 
        ...prev, 
        otpSent: true, 
        isSendingOtp: false,
        countdown: 60 
      }));

      // Start countdown timer
      const timer = setInterval(() => {
        setEmailVerification(prev => {
          if (prev.countdown <= 1) {
            clearInterval(timer);
            return { ...prev, countdown: 0 };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

    } catch (err) {
      console.error('OTP sending error:', err);
      setError('Failed to send verification code. Please try again.');
      setEmailVerification(prev => ({ ...prev, isSendingOtp: false }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setEmailVerification(prev => ({ ...prev, isVerifying: true }));
    setError(null);
    
    try {
      console.log('Verifying OTP:', formData.otp, 'for email:', formData.email);
      
      // For demo purposes, accept specific OTP codes or any 6-digit code
      // In production, you'd verify against your email service
      const validOtpCodes = ['123456', '000000', formData.otp]; // Accept any OTP for demo
      
      if (validOtpCodes.includes(formData.otp)) {
        console.log('OTP verified successfully (demo mode)');
        
        // Mark email as verified
        setEmailVerification(prev => ({ 
          ...prev, 
          otpVerified: true, 
          isVerifying: false 
        }));
      } else {
        setError('Invalid verification code. For demo, try 123456 or any 6-digit code.');
        setEmailVerification(prev => ({ ...prev, isVerifying: false }));
      }

    } catch (err) {
      console.error('OTP Verification Error:', err);
      setError('Verification failed. Please try again.');
      setEmailVerification(prev => ({ ...prev, isVerifying: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // For signup, require email verification
    if (!isLogin && !emailVerification.otpVerified) {
      setError('Please verify your email address first');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isLogin && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('Attempting login for:', formData.email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });

        if (error) {
          console.error('Login error:', error);
          // Provide more user-friendly error messages
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.');
          } else if (error.message.includes('Too many requests')) {
            setError('Too many login attempts. Please wait a few minutes before trying again.');
          } else {
            setError(error.message);
          }
          setIsLoading(false);
          return;
        }

        console.log('Login successful:', data.user?.id);
        // Don't call onLogin() here - let the session change handle it
        
      } else {
        console.log('Attempting signup for:', formData.email);
        
        // For signup, create user with email and password
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              date_of_birth: formData.dateOfBirth,
            }
          }
        });

        if (error) {
          console.error('Signup error:', error);
          if (error.message.includes('User already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
          } else if (error.message.includes('Password should be at least')) {
            setError('Password must be at least 6 characters long.');
          } else if (error.message.includes('Signup is disabled')) {
            setError('Account creation is currently disabled. Please contact support.');
          } else {
            setError(error.message);
          }
          setIsLoading(false);
          return;
        }

        console.log('Signup successful:', data.user?.id);
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
          setError('Please check your email and click the confirmation link to complete your registration.');
          setIsLoading(false);
          return;
        }
        
        // Don't call onLogin() here - let the session change handle it
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      otp: ''
    });
    setEmailVerification({
      otpSent: false,
      otpVerified: false,
      isVerifying: false,
      isSendingOtp: false,
      countdown: 0,
      needsEmailConfirmation: false
    });
  };

  const handleForgotPassword = () => {
    setCurrentView('passwordReset');
  };

  const handleBackFromPasswordReset = () => {
    setCurrentView('login');
  };

  // Show password reset screen
  if (currentView === 'passwordReset') {
    return <PasswordResetScreen onBack={handleBackFromPasswordReset} />;
  }

  const canProceedToPassword = isLogin || emailVerification.otpVerified;

  return (
    <div className="mobile-container bg-black">
      <div className="h-full overflow-y-auto mobile-scroll">
        <motion.div
          className="min-h-full flex items-center justify-center p-4 py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-md">
            {/* Header with more space above */}
            <div className="text-center mb-8 pt-8 safe-area-inset-top">
              <h1 className="text-3xl font-bold text-white mb-2">Zenlit</h1>
              <p className="text-gray-400">Connect with people around you</p>
            </div>

            {/* Login/Signup Form */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white text-center">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400 text-center mt-2">
                  {isLogin ? 'Sign in to your account' : 'Join the Zenlit community'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 bg-red-900/30 border border-red-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name fields for signup - side by side */}
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="First name"
                        required={!isLogin}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Last name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                {/* Date of Birth for signup */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                      required={!isLogin}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">You must be at least 13 years old</p>
                  </div>
                )}

                {/* Email with OTP verification */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                    {!isLogin && emailVerification.otpVerified && (
                      <CheckCircleIcon className="inline w-4 h-4 text-green-500 ml-2" />
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                      disabled={!isLogin && emailVerification.otpVerified}
                    />
                    {!isLogin && !emailVerification.otpVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={emailVerification.isSendingOtp || emailVerification.countdown > 0}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                      >
                        {emailVerification.isSendingOtp ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </div>
                        ) : emailVerification.countdown > 0 ? (
                          `Resend (${emailVerification.countdown}s)`
                        ) : emailVerification.otpSent ? (
                          'Resend OTP'
                        ) : (
                          'Get OTP'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP Input (only show for signup after OTP is sent) */}
                {!isLogin && emailVerification.otpSent && !emailVerification.otpVerified && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter OTP
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          handleInputChange('otp', value);
                        }}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={emailVerification.isVerifying || formData.otp.length !== 6}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                      >
                        {emailVerification.isVerifying ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Verifying...
                          </div>
                        ) : (
                          'Verify OTP'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>
                )}

                {/* Email Verified Message */}
                {!isLogin && emailVerification.otpVerified && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span className="text-green-400 text-sm font-medium">
                        Email verified successfully!
                      </span>
                    </div>
                  </div>
                )}

                {/* Demo Instructions */}
                {!isLogin && emailVerification.otpSent && !emailVerification.otpVerified && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <div className="text-xs text-blue-300">
                      <p className="font-medium mb-1">📱 Demo Mode Instructions:</p>
                      <p>• Use OTP code: <span className="font-mono bg-blue-800 px-1 rounded">123456</span></p>
                      <p>• Or any 6-digit number will work</p>
                      <p className="mt-2 text-yellow-300">
                        💡 In production, a real OTP would be sent to your email
                      </p>
                    </div>
                  </div>
                )}

                {/* Password (only show after email verification for signup) */}
                {canProceedToPassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        placeholder="Enter your password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {!isLogin && (
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                    )}
                  </div>
                )}

                {/* Confirm Password for signup (only show after email verification) */}
                {!isLogin && canProceedToPassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm your password"
                      required={!isLogin}
                      minLength={6}
                    />
                  </div>
                )}

                {/* Forgot Password Link (only for login) */}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!isLogin && !emailVerification.otpVerified)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              {/* Toggle between login/signup */}
              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={toggleMode}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {/* Demo Account Info */}
              {isLogin && (
                <div className="mt-6 bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                  <div className="text-xs text-blue-300">
                    <p className="font-medium mb-1">🚀 Demo Account:</p>
                    <p>Email: <span className="font-mono bg-blue-800 px-1 rounded">demo@zenlit.app</span></p>
                    <p>Password: <span className="font-mono bg-blue-800 px-1 rounded">demo123</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Privacy */}
            <div className="mt-6 text-center pb-8 safe-area-inset-bottom">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{' '}
                <button className="text-blue-400 hover:text-blue-300 transition-colors">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-blue-400 hover:text-blue-300 transition-colors">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};