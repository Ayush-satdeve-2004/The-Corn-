const API_BASE_URL = 'https://the-corn.onrender.com/api';

export function getOptimizedMediaUrl(url) {
  if (!url) return '';
  if (url.includes('/uploads/')) {
    const filename = url.split('/uploads/').pop();
    return `https://the-corn.onrender.com/uploads/${filename}`;
  }
  return url;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const config = { ...options, headers };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// Auth API
export const loginUser = async (identifier, password) => {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
};

export const registerUser = async (formData) => {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};





export const getUserByUsername = async (username) => {
  try {
    const results = await request(`/users/search/query?q=${encodeURIComponent(username)}`);
    return results.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  } catch {
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    return await request('/users/search/query?q=');
  } catch {
    return [];
  }
};

export const sendEmailOTP = async (email) => {
  return request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const verifyEmailOTP = async (email, otp) => {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
};

export const sendMobileOTP = async (mobile) => {
  return request('/auth/send-mobile-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile }),
  });
};

export const verifyMobileOTP = async (mobile, otp) => {
  return request('/auth/verify-mobile-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile, otp }),
  });
};

export const resetPassword = async (userId, newPassword) => {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ userId, newPassword }),
  });
};

export const checkUsernameAvailable = async (username) => {
  try {
    const res = await request(`/auth/check-username?username=${encodeURIComponent(username)}`);
    return res.available;
  } catch {
    return false;
  }
};

// User API
export const getUserById = async (userId) => {
  try {
    return await request(`/users/${userId}`);
  } catch {
    return null;
  }
};

export const updateProfile = async (userId, updates) => {
  return request(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const searchUsers = async (query) => {
  try {
    return await request(`/users/search/query?q=${encodeURIComponent(query)}`);
  } catch {
    return [];
  }
};

export const deleteAccount = async (userId) => {
  return request(`/users/${userId}`, { method: 'DELETE' });
};

// Post API
export const getFeed = async () => {
  try {
    return await request('/posts');
  } catch {
    return [];
  }
};

export const uploadMedia = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('media', file);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent, e.loaded, e.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (err) {
          reject(new Error('Invalid response format from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || errData.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during video upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));

    xhr.open('POST', `${API_BASE_URL}/upload`, true);
    xhr.send(formData);
  });
};

export const createPost = async (postData) => {
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

export const getUserPosts = async (userId) => {
  try {
    return await request(`/posts/user/${userId}`);
  } catch {
    return [];
  }
};

export const getLikedPosts = async (userId) => {
  try {
    return await request(`/posts/liked/${userId}`);
  } catch {
    return [];
  }
};

export const getSavedPosts = async (userId) => {
  try {
    return await request(`/posts/saved/${userId}`);
  } catch {
    return [];
  }
};

export const likePost = async (postId, userId) => {
  return request(`/posts/${postId}/like`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

export const commentOnPost = async (postId, userId, text) => {
  return request(`/posts/${postId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ userId, text }),
  });
};

export const deleteComment = async (postId, commentId, userId) => {
  return request(`/posts/${postId}/comment/${commentId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  });
};

export const savePost = async (postId, userId) => {
  return request(`/posts/${postId}/save`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

export const deletePost = async (postId) => {
  return request(`/posts/${postId}`, { method: 'DELETE' });
};

// Friend API
export const sendFriendRequest = async (from, to) => {
  return request('/friends/request', {
    method: 'POST',
    body: JSON.stringify({ from, to }),
  });
};

export const getFriendRequests = async (userId) => {
  try {
    return await request(`/friends/requests/${userId}`);
  } catch {
    return [];
  }
};

export const acceptFriendRequest = async (requestId) => {
  return request('/friends/accept', {
    method: 'POST',
    body: JSON.stringify({ requestId }),
  });
};

export const rejectFriendRequest = async (requestId) => {
  return request('/friends/reject', {
    method: 'POST',
    body: JSON.stringify({ requestId }),
  });
};

export const getFriends = async (userId) => {
  try {
    return await request(`/friends/${userId}`);
  } catch {
    return [];
  }
};

export const removeFriend = async (userId, friendId) => {
  return request('/friends/remove', {
    method: 'POST',
    body: JSON.stringify({ userId, friendId }),
  });
};

// Admin API
export const getPendingAccounts = async () => {
  try {
    return await request('/admin/pending');
  } catch {
    return [];
  }
};

export const approveUser = async (userId) => {
  return request('/admin/approve', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

export const sharePost = async (postId, userId, toUserId) => {
  return request(`/posts/${postId}/share`, {
    method: 'POST',
    body: JSON.stringify({ userId, toUserId }),
  });
};

export const rejectUser = async (userId) => {
  return request('/admin/reject', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

export const getActiveUsers = async () => {
  try {
    return await request('/admin/active');
  } catch {
    return [];
  }
};

export const deleteUserByAdmin = async (userId) => {
  return request(`/admin/users/${userId}`, { method: 'DELETE' });
};

export const submitFeedback = async (feedbackData) => {
  return request('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  });
};

export const getAllFeedback = async () => {
  try {
    return await request('/admin/feedback');
  } catch {
    return [];
  }
};
