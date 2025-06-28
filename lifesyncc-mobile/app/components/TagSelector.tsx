import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TagSelectorProps {
  visible: boolean;
  selectedTags: string[];
  onClose: () => void;
  onSelectTags: (tags: string[]) => void;
  predefinedTags?: {
    [category: string]: string[];
  };
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  visible,
  selectedTags,
  onClose,
  onSelectTags,
  predefinedTags = {
    priority: ['High Priority', 'Medium Priority', 'Low Priority'],
    difficulty: ['Easy', 'Medium', 'Hard'],
    location: ['Home', 'Gym', 'Outdoor', 'Office'],
    type: ['Cardio', 'Strength', 'Flexibility', 'Mental', 'Study'],
  },
}) => {
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>(selectedTags);
  const [customTag, setCustomTag] = useState('');

  const getTagColor = (tag: string) => {
    if (tag.includes('High')) return '#EF4444';
    if (tag.includes('Medium')) return '#F59E0B';
    if (tag.includes('Low')) return '#10B981';
    if (tag.includes('Easy')) return '#10B981';
    if (tag.includes('Hard')) return '#EF4444';
    if (tag.includes('Cardio')) return '#3B82F6';
    if (tag.includes('Strength')) return '#8B5CF6';
    return '#6B7280';
  };

  const toggleTag = (tag: string) => {
    if (localSelectedTags.includes(tag)) {
      setLocalSelectedTags(localSelectedTags.filter(t => t !== tag));
    } else {
      setLocalSelectedTags([...localSelectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !localSelectedTags.includes(customTag.trim())) {
      setLocalSelectedTags([...localSelectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleDone = () => {
    onSelectTags(localSelectedTags);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Tags</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {Object.entries(predefinedTags).map(([category, tags]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <View style={styles.tagsContainer}>
                  {tags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tag,
                        localSelectedTags.includes(tag) && {
                          backgroundColor: `${getTagColor(tag)}20`,
                          borderColor: getTagColor(tag),
                        },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          localSelectedTags.includes(tag) && {
                            color: getTagColor(tag),
                          },
                        ]}
                      >
                        {tag}
                      </Text>
                      {localSelectedTags.includes(tag) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={getTagColor(tag)}
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.customTagSection}>
              <Text style={styles.categoryTitle}>Custom Tag</Text>
              <View style={styles.customTagContainer}>
                <TextInput
                  style={styles.customTagInput}
                  value={customTag}
                  onChangeText={setCustomTag}
                  placeholder="Enter custom tag"
                  onSubmitEditing={addCustomTag}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addCustomTag}
                  disabled={!customTag.trim()}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {localSelectedTags.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.categoryTitle}>Selected Tags</Text>
                <View style={styles.tagsContainer}>
                  {localSelectedTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.selectedTag,
                        { backgroundColor: `${getTagColor(tag)}20` },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[styles.tagText, { color: getTagColor(tag) }]}>
                        {tag}
                      </Text>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={getTagColor(tag)}
                        style={styles.removeIcon}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginTop: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkIcon: {
    marginLeft: 4,
  },
  removeIcon: {
    marginLeft: 4,
  },
  customTagSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSection: {
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});