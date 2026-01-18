import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';

const MessageInput = ({ chatId, recipientId, onSend }) => {
  const { theme } = useTheme();
  const { emit } = useWebSocket();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (isTypingRef.current) {
          emit('typing:stop', { chatId, recipientId });
        }
      }
    };
  }, [chatId, recipientId]);

  const handleTextChange = (newText) => {
    setText(newText);

    // Typing indicator logic
    if (newText.trim().length > 0) {
      // Start typing if not already typing
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        emit('typing:start', { chatId, recipientId });
      }

      // Reset the timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          emit('typing:stop', { chatId, recipientId });
        }
      }, 3000);
    } else {
      // Empty input, stop typing immediately
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emit('typing:stop', { chatId, recipientId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Send Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: true,
    };

    launchCamera(options, handleImageResponse);
  };

  const handleChooseFromLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: true,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      Alert.alert('Error', 'Failed to pick image');
    } else if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      const base64Image = `data:${asset.type};base64,${asset.base64}`;
      setSelectedImage(base64Image);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    const messageText = text.trim();

    if ((messageText.length === 0 && !selectedImage) || isSending) {
      return;
    }

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emit('typing:stop', { chatId, recipientId });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Clear input immediately for better UX
    setText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsSending(true);

    try {
      if (imageToSend) {
        await onSend(messageText || '', 'image', imageToSend);
      } else {
        await onSend(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore text and image on error
      setText(messageText);
      setSelectedImage(imageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const canSend = (text.trim().length > 0 || selectedImage) && !isSending;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={handleRemoveImage}
            activeOpacity={0.7}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.attachButton, { backgroundColor: theme.inputBackground }]}
          onPress={handleImagePicker}
          disabled={isSending}
          activeOpacity={0.7}
        >
          <Text style={[styles.attachButtonText, { color: theme.primary }]}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.inputText,
              borderColor: theme.inputBorder,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.inputPlaceholder}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
          editable={!isSending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.primary : theme.border,
            },
          ]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 8,
    borderTopWidth: 1,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});

export default MessageInput;
