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
        // If profile doesn't exist, that's okay - we'll create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created automatically');
          setProfile(null);
          setError(null);
        } else {
          console.error('Error fetching profile:', error);
          setError(error.message);
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return { error: 'No user ID provided' };

    try {
      setError(null);

      console.log('Updating profile:', updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        setError(error.message);
        return { error: error.message };
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
      return { data };
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = 'Failed to update profile';
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
        setError(uploadError.message);
        return { error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      console.log('Avatar uploaded, public URL:', publicUrl);

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile with avatar:', error);
        setError(error.message);
        return { error: error.message };
      }

      console.log('Profile updated with avatar:', data);
      setProfile(data);
      return { data: publicUrl };
    } catch (err) {
      console.error('Avatar upload error:', err);
      const errorMessage = 'Failed to upload avatar';
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
    refetch: fetchProfile
  };
}