import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, CheckIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useProfile } from '../hooks/useProfile';
import { Profile } from '../types';

interface Props {
  userId: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const INTERESTS_OPTIONS = [
  'Photography', 'Travel', 'Fitness', 'Music', 'Art', 'Technology', 'Food', 'Fashion',
  'Sports', 'Reading', 'Gaming', 'Movies', 'Dancing', 'Hiking', 'Cooking', 'Yoga',
  'Writing', 'Pets', 'Nature', 'Coffee', 'Design', 'Business', 'Science', 'History'
];

export const ProfileSetupScreen: React.FC<Props> = ({ userId, onComplete, onSkip }) => {
  const { profile, updateProfile, uploadAvatar } = useProfile(userId);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    date_of_birth: profile?.date_of_birth || '',
    gender: profile?.gender || '',
    location: profile?.location || '',
    interests: profile?.interests || [],
    avatar_url: profile?.avatar_url || ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size must be less than 5MB');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await uploadAvatar(file);
    
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setFormData(prev => ({
        ...prev,
        avatar_url: result.data
      }));
    }

    setIsLoading(false);
  };

  const handleNext = async () => {
    setError(null);

    // Validate current step
    if (currentStep === 1) {
      if (!formData.display_name.trim()) {
        setError('Please enter a display name');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.date_of_birth) {
        setError('Please select your date of birth');
        return;
      }
      if (!formData.gender) {
        setError('Please select your gender');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    const updates: Partial<Profile> = {
      ...formData,
      is_profile_complete: true
    };

    const result = await updateProfile(updates);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onComplete();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Let's set up your profile</h2>
        <p className="text-gray-400">Tell us a bit about yourself</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <button
            onClick={handleAvatarSelect}
            disabled={isLoading}
            className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Display Name *
        </label>
        <input
          type="text"
          value={formData.display_name}
          onChange={(e) => handleInputChange('display_name', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="How should people call you?"
          maxLength={50}
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          className="w-full h-24 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Tell people about yourself..."
          maxLength={150}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${formData.bio.length > 140 ? 'text-red-400' : 'text-gray-400'}`}>
            {formData.bio.length}/150
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
        <p className="text-gray-400">Help others get to know you better</p>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Date of Birth *
        </label>
        <input
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Gender *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleInputChange('gender', option.value)}
              className={`p-3 rounded-lg border transition-all ${
                formData.gender === option.value
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="City, Country"
          maxLength={100}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Your Interests</h2>
        <p className="text-gray-400">Select what you're passionate about</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {INTERESTS_OPTIONS.map((interest) => (
          <button
            key={interest}
            onClick={() => handleInterestToggle(interest)}
            className={`p-3 rounded-lg border transition-all text-sm ${
              formData.interests.includes(interest)
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {interest}
          </button>
        ))}
      </div>

      {formData.interests.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {formData.interests.length} interest{formData.interests.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckIcon className="w-10 h-10 text-white" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
        <p className="text-gray-400">Your profile is ready. You can always update it later.</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {formData.avatar_url && (
            <img
              src={formData.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-white">{formData.display_name}</h3>
            {formData.bio && <p className="text-sm text-gray-400 mt-1">{formData.bio}</p>}
            {formData.interests.length > 0 && (
              <p className="text-xs text-blue-400 mt-2">
                {formData.interests.slice(0, 3).join(', ')}
                {formData.interests.length > 3 && ` +${formData.interests.length - 3} more`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="p-2 rounded-full hover:bg-gray-800 active:scale-95 transition-all"
              >
                <ChevronLeftIcon className="w-5 h-5 text-white" />
              </button>
            )}
            
            <div className="flex-1 text-center">
              <div className="flex justify-center space-x-2 mb-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all ${
                      step <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400">Step {currentStep} of 4</p>
            </div>

            {currentStep < 4 && onSkip && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
            )}
          </div>

          {/* Form Container */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-red-900/30 border border-red-700 rounded-lg p-3"
              >
                <span className="text-red-400 text-sm">{error}</span>
              </motion.div>
            )}

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </motion.div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    currentStep === 3 ? 'Almost Done' : 'Continue'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};