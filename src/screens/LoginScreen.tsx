'use client'
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
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Signup flow states
  const [signupStep, setSignupStep] = useState<'email' | 'otp' | 'password'>('email');
  const [emailVerification, setEmailVerification] = useState({
    otpSent: false,
    otpVerified: false,
    isVerifying: false,
    isSendingOtp: false,
    countdown: 0,
    canResend: true,
    rateLimitEnd: null as Date | null
  });

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (error) setError(null);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkRateLimit = () => {
    if (emailVerification.rateLimitEnd && new Date() < emailVerification.rateLimitEnd) {
      const remainingSeconds = Math.ceil((emailVerification.rateLimitEnd.getTime() - new Date().getTime()) / 1000);
      setError(`Please wait ${remainingSeconds} seconds before requesting another code.`);
      return false;
    }
    return true;
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

    // Check rate limit
    if (!checkRateLimit()) {
      return;
    }

    setEmailVerification(prev => ({ ...prev, isSendingOtp: true, canResend: false }));
    setError(null);
    
    try {
      console.log('Sending OTP to:', formData.email);
      
      // Use Supabase OTP for email verification
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false // Only send OTP for verification, don't create user yet
        }
      });

      if (error) {
        console.error('OTP sending error:', error);
        
        // Handle rate limiting with better UX
        if (error.message.includes('For security purposes')) {
          const match = error.message.match(/(\d+)\s+seconds?/);
          const waitTime = match ? parseInt(match[1]) : 60;
          const rateLimitEnd = new Date(Date.now() + waitTime * 1000);
          
          setEmailVerification(prev => ({ 
            ...prev, 
            isSendingOtp: false, 
            canResend: false,
            rateLimitEnd 
          }));
          
          setError(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
          
          // Start countdown timer
          const timer = setInterval(() => {
            const now = new Date();
            if (now >= rateLimitEnd) {
              clearInterval(timer);
              setEmailVerification(prev => ({ 
                ...prev, 
                canResend: true, 
                rateLimitEnd: null 
              }));
              setError(null);
            } else {
              const remaining = Math.ceil((rateLimitEnd.getTime() - now.getTime()) / 1000);
              setError(`Rate limit exceeded. Please wait ${remaining} seconds before trying again.`);
            }
          }, 1000);
          
          return;
        }
        
        if (error.message.includes('Signups not allowed')) {
          setError('Email verification is currently disabled. Please contact support.');
        } else {
          setError('Failed to send verification code. Please try again.');
        }
        setEmailVerification(prev => ({ ...prev, isSendingOtp: false, canResend: true }));
        return;
      }
      
      console.log('OTP sent successfully');
      setEmailVerification(prev => ({ 
        ...prev, 
        otpSent: true, 
        isSendingOtp: false,
        countdown: 60,
        canResend: false
      }));

      // Start countdown timer
      const timer = setInterval(() => {
        setEmailVerification(prev => {
          if (prev.countdown <= 1) {
            clearInterval(timer);
            return { ...prev, countdown: 0, canResend: true };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

      // Move to OTP step
      setSignupStep('otp');

    } catch (err) {
      console.error('OTP sending error:', err);
      setError('Failed to send verification code. Please try again.');
      setEmailVerification(prev => ({ ...prev, isSendingOtp: false, canResend: true }));
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
      
      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email.trim().toLowerCase(),
        token: formData.otp,
        type: 'email'
      });

      if (error) {
        console.error('OTP Verification Error:', error);
        
        if (error.message.includes('Token has expired') || error.message.includes('otp_expired')) {
          setError('Verification code has expired. Please request a new one.');
          // Reset to email step to get new OTP
          setSignupStep('email');
          setEmailVerification(prev => ({ 
            ...prev, 
            isVerifying: false,
            otpSent: false,
            countdown: 0,
            canResend: true
          }));
          setFormData(prev => ({ ...prev, otp: '' }));
        } else if (error.message.includes('Invalid token') || error.message.includes('invalid')) {
          setError('Invalid verification code. Please check and try again.');
          setEmailVerification(prev => ({ ...prev, isVerifying: false }));
          // Clear the OTP field for retry
          setFormData(prev => ({ ...prev, otp: '' }));
        } else {
          setError('Verification failed. Please try again.');
          setEmailVerification(prev => ({ ...prev, isVerifying: false }));
          setFormData(prev => ({ ...prev, otp: '' }));
        }
        return;
      }

      console.log('OTP verified successfully');
      
      // Mark email as verified and move to password step
      setEmailVerification(prev => ({ 
        ...prev, 
        otpVerified: true, 
        isVerifying: false 
      }));
      
      setSignupStep('password');

    } catch (err) {
      console.error('OTP Verification Error:', err);
      setError('Verification failed. Please try again.');
      setEmailVerification(prev => ({ ...prev, isVerifying: false }));
      setFormData(prev => ({ ...prev, otp: '' }));
    }
  };

  const handleCreateAccount = async () => {
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating account for:', formData.email);
      
      // Create user with email and password
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation since we already verified with OTP
        }
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.');
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }

      console.log('Account created successfully:', data.user?.id);
      
      // Account created successfully, the session change will be handled by App.tsx
      setIsLoading(false);
      
    } catch (err) {
      console.error('Account creation error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
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
      
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSignupStep('email');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
    setEmailVerification({
      otpSent: false,
      otpVerified: false,
      isVerifying: false,
      isSendingOtp: false,
      countdown: 0,
      canResend: true,
      rateLimitEnd: null
    });
  };

  const handleForgotPassword = () => {
    setCurrentView('passwordReset');
  };

  const handleBackFromPasswordReset = () => {
    setCurrentView('login');
  };

  const handleBackToEmail = () => {
    setSignupStep('email');
    setFormData(prev => ({ ...prev, otp: '' }));
    setEmailVerification(prev => ({ 
      ...prev, 
      otpSent: false, 
      otpVerified: false,
      isVerifying: false,
      countdown: 0
    }));
  };

  const handleBackToOtp = () => {
    setSignupStep('otp');
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  // Show password reset screen
  if (currentView === 'passwordReset') {
    return <PasswordResetScreen onBack={handleBackFromPasswordReset} />;
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <div className="h-screen overflow-y-auto">
        <motion.div
          className="min-h-screen flex items-center justify-center p-4 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-md">
            {/* Header with proper spacing */}
            <div className="text-center mb-6 pt-4">
              <h1 className="text-3xl font-bold text-white mb-2">Zenlit</h1>
              <p className="text-gray-400">Connect with people around you</p>
            </div>

            {/* Login/Signup Form */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white text-center">
                  {isLogin ? 'Welcome Back' : 
                   signupStep === 'email' ? 'Create Account' :
                   signupStep === 'otp' ? 'Verify Email' :
                   'Set Password'}
                </h2>
                <p className="text-gray-400 text-center mt-2">
                  {isLogin ? 'Sign in to your account' : 
                   signupStep === 'email' ? 'Enter your email to get started' :
                   signupStep === 'otp' ? 'Enter the verification code sent to your email' :
                   'Create a secure password for your account'}
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

              {/* LOGIN FORM */}
              {isLogin && (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {/* Password */}
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
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              )}

              {/* SIGNUP FORM */}
              {!isLogin && (
                <div className="space-y-4">
                  {/* Step 1: Email */}
                  {signupStep === 'email' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={emailVerification.isSendingOtp || !emailVerification.canResend}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {emailVerification.isSendingOtp ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending Code...
                          </>
                        ) : !emailVerification.canResend ? (
                          'Please Wait...'
                        ) : (
                          'Send Verification Code'
                        )}
                      </button>
                    </>
                  )}

                  {/* Step 2: OTP Verification */}
                  {signupStep === 'otp' && (
                    <>
                      <div className="text-center mb-4">
                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                          We've sent a 6-digit code to <span className="text-white">{formData.email}</span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Enter Verification Code
                        </label>
                        <input
                          type="text"
                          value={formData.otp}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            handleInputChange('otp', value);
                          }}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest text-lg"
                          placeholder="000000"
                          maxLength={6}
                          disabled={emailVerification.isVerifying}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the 6-digit code sent to your email
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleBackToEmail}
                          className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 active:scale-95 transition-all"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={emailVerification.isVerifying || formData.otp.length !== 6}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {emailVerification.isVerifying ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify Code'
                          )}
                        </button>
                      </div>

                      {/* Resend option */}
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">
                          Didn't receive the code?{' '}
                          <button
                            onClick={() => {
                              setSignupStep('email');
                              setEmailVerification(prev => ({ ...prev, otpSent: false }));
                            }}
                            disabled={emailVerification.countdown > 0 || emailVerification.isVerifying}
                            className="text-blue-400 hover:text-blue-300 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
                          >
                            {emailVerification.countdown > 0 ? `Try again in ${emailVerification.countdown}s` : 'Try again'}
                          </button>
                        </p>
                      </div>
                    </>
                  )}

                  {/* Step 3: Password Creation */}
                  {signupStep === 'password' && (
                    <>
                      <div className="text-center mb-4">
                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                          Email verified! Now create a secure password.
                        </p>
                      </div>

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
                            placeholder="Create a password"
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
                        <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                      </div>

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
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleBackToOtp}
                          className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 active:scale-95 transition-all"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateAccount}
                          disabled={isLoading}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            'Create Account'
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

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
            <div className="mt-6 text-center pb-4">
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