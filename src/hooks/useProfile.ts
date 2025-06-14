import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../types';

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setProfile(null);
      return;
    }

    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error details:', error);
        
        // If profile doesn't exist, that's okay - we'll create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created automatically');
          setProfile(null);
          setError(null);
        } else if (error.code === '42P01') {
          // Table doesn't exist - this is a migration issue
          console.error('Profiles table does not exist. Please run the database migration.');
          setError('Database not properly configured. Please contact support.');
        } else {
          console.error('Error fetching profile:', error);
          setError(`Failed to load profile: ${error.message}`);
        }
        return;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Partial<Profile>) => {
    if (!userId) return { error: 'No user ID provided' };

    try {
      setError(null);
      console.log('Creating new profile for user:', userId, profileData);

      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        return { error: 'User email not found' };
      }

      const newProfile = {
        id: userId,
        email: user.email,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return { error: `Failed to create profile: ${error.message}` };
      }

      console.log('Profile created successfully:', data);
      setProfile(data);
      return { data };
    } catch (err) {
      console.error('Profile creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return { error: 'No user ID provided' };

    try {
      setError(null);
      console.log('Updating profile:', updates);

      // First try to update
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile');
          return await createProfile(updates);
        }
        
        setError(`Failed to update profile: ${error.message}`);
        return { error: `Failed to update profile: ${error.message}` };
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
      return { data };
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) return { error: 'No user ID provided' };

    try {
      setError(null);
      console.log('Uploading avatar for user:', userId);

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        
        // If bucket doesn't exist, provide helpful error
        if (uploadError.message.includes('Bucket not found')) {
          setError('Storage bucket not configured. Please create a "profiles" bucket in Supabase Storage.');
          return { error: 'Storage bucket not configured. Please create a "profiles" bucket in Supabase Storage.' };
        }
        
        setError(`Failed to upload avatar: ${uploadError.message}`);
        return { error: `Failed to upload avatar: ${uploadError.message}` };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      console.log('Avatar uploaded, public URL:', publicUrl);

      // Update profile with new avatar URL
      const updateResult = await updateProfile({ avatar_url: publicUrl });
      
      if (updateResult.error) {
        return updateResult;
      }

      return { data: publicUrl };
    } catch (err) {
      console.error('Avatar upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
    createProfile
  };
}