import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ChatContextMenu = ({ visible, onClose, chat, onPin, onDelete, onMute, isPinned, isMuted }) => {
  const { theme } = useTheme();
  const [showMuteOptions, setShowMuteOptions] = useState(false);

  const handlePin = () => {
    onPin();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleMute = (duration) => {
    onMute(duration);
    setShowMuteOptions(false);
    onClose();
  };

  const handleMutePress = () => {
    if (isMuted) {
      // If already muted, unmute directly
      onMute('unmute');
      onClose();
    } else {
      // Show mute duration options
      setShowMuteOptions(true);
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showMuteOptions}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menu, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={handlePin}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    {isPinned ? '📌 Unpin' : '📌 Pin'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={handleMutePress}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    {isMuted ? '🔔 Unmute' : '🔕 Mute'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuText, styles.deleteText, { color: theme.error }]}>
                    🗑️ Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showMuteOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMuteOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMuteOptions(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menu, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleMute(1)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Mute for 1 hour
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleMute(2)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Mute for 2 hours
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleMute(8)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Mute for 8 hours
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMute('forever')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Mute until I turn it back on
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: 200,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteText: {
    fontWeight: '600',
  },
});

export default ChatContextMenu;
