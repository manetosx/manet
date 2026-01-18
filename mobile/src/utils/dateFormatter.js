/**
 * Format timestamp for message display
 * Returns relative time like "2m ago", "Yesterday", "Jan 10"
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  // Just now
  if (diffMins < 1) return 'Just now';

  // Minutes ago
  if (diffMins < 60) return `${diffMins}m ago`;

  // Hours ago
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  // Yesterday
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';

  // Days ago (within a week)
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format timestamp for conversation list
 * Returns "2m", "Yesterday", "Monday", "Jan 10"
 */
export const formatConversationTime = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  // Minutes
  if (diffMins < 60) return `${diffMins}m`;

  // Hours
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  // Yesterday
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';

  // Day of week (within a week)
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format timestamp for message bubble
 * Returns time like "12:30 PM"
 */
export const formatMessageBubbleTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format last seen time
 * Returns "Last seen 2 hours ago", "Last seen yesterday", etc.
 */
export const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Last seen recently';

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;

  return 'Last seen recently';
};
