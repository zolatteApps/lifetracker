import React from 'react';
import { useNavigate } from 'react-router-dom';
import Onboarding from './Onboarding';
import { UserProfile } from '../../types';

interface OnboardingWrapperProps {
  onComplete: (profile: UserProfile) => void;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ onComplete }) => {
  const navigate = useNavigate();

  const handleComplete = (profile: UserProfile) => {
    console.log('OnboardingWrapper: Profile completed, navigating to dashboard');
    onComplete(profile);
    navigate('/dashboard');
  };

  return <Onboarding onComplete={handleComplete} />;
};

export default OnboardingWrapper;