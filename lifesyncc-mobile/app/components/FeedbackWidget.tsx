import React, { useState } from 'react';
import { FeedbackButton } from './FeedbackButton';
import { FeedbackModal } from './FeedbackModal';
import feedbackService from '../services/feedbackService';

export const FeedbackWidget: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmitFeedback = async (category: string, message: string) => {
    await feedbackService.submitFeedback({ category, message });
  };

  return (
    <>
      <FeedbackButton onPress={() => setModalVisible(true)} />
      <FeedbackModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitFeedback}
      />
    </>
  );
};