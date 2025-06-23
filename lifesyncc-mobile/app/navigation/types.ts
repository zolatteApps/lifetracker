export type OnboardingData = {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: {
    value: number;
    unit: 'cm' | 'ft';
  };
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  NameInput: { onboardingData?: OnboardingData };
  AgeInput: { onboardingData: OnboardingData };
  GenderInput: { onboardingData: OnboardingData };
  HeightInput: { onboardingData: OnboardingData };
  SkipConfirmation: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PhoneLogin: undefined;
  VerifyOTP: { phoneNumber: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Goals: undefined;
  Schedule: undefined;
  Feedback: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};