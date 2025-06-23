import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen: React.FC = () => {
  const { user, signOut, loading } = useAuth();

  const formatHeight = () => {
    if (!user?.height) return 'Not set';
    const { value, unit } = user.height;
    
    if (unit === 'ft') {
      const totalInches = Math.round(value / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}'${inches}"`;
    }
    return `${value} cm`;
  };

  const getGenderDisplay = () => {
    if (!user?.gender) return 'Not set';
    const genderMap = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer_not_to_say': 'Prefer not to say'
    };
    return genderMap[user.gender] || user.gender;
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your personal information</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color="#4F46E5" />
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'Not logged in'}</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Age</Text>
            </View>
            <Text style={styles.detailValue}>{user?.age || 'Not set'}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Gender</Text>
            </View>
            <Text style={styles.detailValue}>{getGenderDisplay()}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Height</Text>
            </View>
            <Text style={styles.detailValue}>{formatHeight()}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="phone-portrait-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Phone</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.phoneNumber || 'Not set'}
              {user?.isPhoneVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginLeft: 4 }} />
              )}
            </Text>
          </View>
        </View>

        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="card-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Member ID</Text>
            </View>
            <Text style={styles.detailValue}>{user?.id?.substring(0, 8) || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Member Since</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Profile Status</Text>
            </View>
            <Text style={[
              styles.detailValue,
              { color: user?.isOnboardingCompleted ? '#10b981' : '#f59e0b' }
            ]}>
              {user?.isOnboardingCompleted ? 'Complete' : 'Incomplete'}
            </Text>
          </View>
        </View>

        {!user?.isOnboardingCompleted && (
          <TouchableOpacity style={styles.completeProfileButton}>
            <Ionicons name="create-outline" size={20} color="#4F46E5" />
            <Text style={styles.completeProfileText}>Complete Your Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  completeProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});