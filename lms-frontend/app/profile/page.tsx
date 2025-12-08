'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import '../Profilepage.css';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  role: 'student' | 'instructor' | 'admin';
  enrolledCourses: number;
  completedCourses: number;
  totalLearningTime: number;
  skills: string[];
  createdAt: string;
  recentActivities?: RecentActivity[];
}

interface Course {
  _id: string;
  title: string;
  category: string;
  progress: number;
  lastAccessed: string;
  thumbnail?: string;
}

interface Certificate {
  _id: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  certificateId: string;
  downloadUrl: string;
}

interface ProfileUpdateData {
  name: string;
  bio: string;
  location: string;
  website: string;
  skills: string[];
}

interface AvatarUpdateData {
  avatar: string;
}

interface RecentActivity {
  _id: string;
  actionType: 'course_enrolled' | 'course_completed' | 'certificate_earned' | 'profile_updated' | 'comment_posted';
  description: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  });

  // Fetch user profile data
  const { data: profileResponse, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch user certificates
  const { data: certificatesResponse, isLoading: certificatesLoading } = useQuery({
    queryKey: ['user-certificates'],
    queryFn: async () => {
      const response = await apiClient.get('/users/certificates');
      return response.data;
    },
    enabled: !!user,
  });

  const profileData = profileResponse?.data || null;
  const courses = profileData?.courses || [];
  const certificates = certificatesResponse?.data || [];

  const initialFormState = useMemo(() => ({
    name: profileData?.name || '',
    bio: profileData?.bio || '',
    location: profileData?.location || '',
    website: profileData?.website || '',
    skills: profileData?.skills?.join(', ') || '',
  }), [profileData]);

  const [editForm, setEditForm] = useState(initialFormState);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
    },
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarData: AvatarUpdateData) => {
      const response = await apiClient.post('/users/avatar', avatarData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.put('/users/change-password', passwordData);
      return response.data;
    },
    onSuccess: () => {
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    },
    onError: (error: Error) => {
      alert('Failed to change password');
    },
  });

  // Change email mutation
  const changeEmailMutation = useMutation({
    mutationFn: async (emailData: { newEmail: string; password: string }) => {
      const response = await apiClient.put('/users/change-email', emailData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setShowEmailForm(false);
      setEmailForm({ newEmail: '', password: '' });
      alert('Email changed successfully! Please check your new email for verification.');
    },
    onError: (error: Error) => {
      alert('Failed to change email');
    },
  });



  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement avatar upload to backend
      console.log('Avatar upload not implemented yet');
    }
  };

  const handleSaveProfile = () => {
    const updatedData = {
      name: editForm.name,
      bio: editForm.bio,
      location: editForm.location,
      website: editForm.website,
      skills: editForm.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean),
    };

    updateProfileMutation.mutate(updatedData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours.toFixed(1)} hours`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleChangeEmail = () => {
    changeEmailMutation.mutate({
      newEmail: emailForm.newEmail,
      password: emailForm.password,
    });
  };

  if (!user) {
    return (
      <div className="profile-auth-required">
        <div className="auth-message">
          <h2>Authentication Required</h2>
          <p>Please log in to view your profile</p>
          <button 
            className="login-btn"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (profileLoading && !profileData?._id) {
    return (
      <div className="loading-container">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="container">
          <h1>My Profile</h1>
          <p className="header-subtitle">Manage your account and track your learning progress</p>
        </div>
      </div>

      <div className="container">
        <div className="profile-layout">
          {/* Left Sidebar - Profile Card */}
          <div className="profile-sidebar">
            <div className="profile-card">
              <div className="avatar-section">
                <div className="avatar-wrapper" onClick={handleAvatarClick}>
                  <img 
                    src={profileData.avatar || '/default-avatar.png'} 
                    alt={profileData.name}
                    className="profile-avatar"
                  />
                  <div className="avatar-overlay">
                    <i className="fas fa-camera"></i>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="avatar-input"
                />
                <button 
                  className="edit-avatar-btn"
                  onClick={handleAvatarClick}
                >
                  Change Photo
                </button>
              </div>

              <div className="profile-info">
                <h2 className="profile-name">{profileData.name}</h2>
                <p className="profile-email">{profileData.email}</p>
                <div className="profile-badge">
                  <span className={`role-badge ${profileData.role}`}>
                    {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                  </span>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <div className="stat-number">{profileData.enrolledCourses}</div>
                  <div className="stat-label">Courses</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{profileData.completedCourses}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{formatTime(profileData.totalLearningTime)}</div>
                  <div className="stat-label">Learning Time</div>
                </div>
              </div>

              <div className="profile-actions">
                <button 
                  className={`action-btn ${isEditing ? 'cancel' : 'edit'}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'}`}></i>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button 
                  className="action-btn logout"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            {profileData.role === 'admin' && (
              <div className="quick-stats">
                <h3>Learning Stats</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <i className="fas fa-trophy"></i>
                    <div>
                      <div className="stat-value">{profileData.completedCourses}</div>
                      <div className="stat-label">Certificates</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i className="fas fa-star"></i>
                    <div>
                      <div className="stat-value">4.8</div>
                      <div className="stat-label">Avg. Rating</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i className="fas fa-calendar-check"></i>
                    <div>
                      <div className="stat-value">{formatDate(profileData.createdAt)}</div>
                      <div className="stat-label">Member Since</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="profile-main">
            {/* Tabs */}
            <div className="profile-tabs">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-home"></i>
                Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <i className="fas fa-book-open"></i>
                My Courses
              </button>
              <button 
                className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
                onClick={() => setActiveTab('certificates')}
              >
                <i className="fas fa-certificate"></i>
                Certificates
              </button>
              <button 
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <i className="fas fa-cog"></i>
                Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  {isEditing ? (
                    <div className="edit-profile-form">
                      <h2>Edit Profile</h2>
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself"
                          rows={4}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input
                          type="text"
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, Country"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="website">Website</label>
                        <input
                          type="url"
                          id="website"
                          value={editForm.website}
                          onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="skills">Skills (comma separated)</label>
                        <input
                          type="text"
                          id="skills"
                          value={editForm.skills}
                          onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                          placeholder="JavaScript, React, Node.js"
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          className="btn-primary"
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i>
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="profile-details">
                        <div className="detail-section">
                          <h3>About Me</h3>
                          <p className="profile-bio">{profileData.bio}</p>
                        </div>

                        <div className="detail-section">
                          <h3>Contact Information</h3>
                          <div className="contact-info">
                            <div className="contact-item">
                              <i className="fas fa-envelope"></i>
                              <span>{profileData.email}</span>
                            </div>
                            {profileData.location && (
                              <div className="contact-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>{profileData.location}</span>
                              </div>
                            )}
                            {profileData.website && (
                              <div className="contact-item">
                                <i className="fas fa-globe"></i>
                                <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                                  {profileData.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="detail-section">
                          <h3>Social Links</h3>
                          <div className="social-links">
                            {profileData.socialLinks?.twitter && (
                              <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                                <i className="fab fa-twitter"></i>
                              </a>
                            )}
                            {profileData.socialLinks?.linkedin && (
                              <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                                <i className="fab fa-linkedin"></i>
                              </a>
                            )}
                            {profileData.socialLinks?.github && (
                              <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-link">
                                <i className="fab fa-github"></i>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="detail-section">
                          <h3>Skills & Expertise</h3>
                          <div className="skills-list">
                            {profileData.skills.map((skill: string, index: number) => (
                              <span key={index} className="skill-tag">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Recent Activity */}
                  <div className="recent-activity">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                      {profileData.recentActivities && profileData.recentActivities.length > 0 ? (
                        profileData.recentActivities.map((activity: RecentActivity) => (
                          <div key={activity._id} className="activity-item">
                            <div className="activity-icon">
                              <i className={`fas ${
                                activity.actionType === 'course_enrolled' ? 'fa-book-open' :
                                activity.actionType === 'course_completed' ? 'fa-check-circle' :
                                activity.actionType === 'certificate_earned' ? 'fa-certificate' :
                                activity.actionType === 'profile_updated' ? 'fa-user-edit' :
                                activity.actionType === 'comment_posted' ? 'fa-comment' :
                                'fa-clock'
                              }`}></i>
                            </div>
                            <div className="activity-content">
                              <p dangerouslySetInnerHTML={{ __html: activity.description }}></p>
                              <span className="activity-time">
                                {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="activity-item">
                          <div className="activity-content">
                            <p>No recent activity</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="courses-tab">
                  <div className="courses-header">
                    <h2>My Courses</h2>
                    <div className="courses-stats">
                      <span className="stat">
                        <strong>{profileData.enrolledCourses}</strong> Enrolled
                      </span>
                      <span className="stat">
                        <strong>{profileData.completedCourses}</strong> Completed
                      </span>
                      <span className="stat">
                        <strong>{Math.round((profileData.completedCourses / profileData.enrolledCourses) * 100)}%</strong> Completion Rate
                      </span>
                    </div>
                  </div>

                  <div className="courses-grid">
                    {courses.map((course: Course) => (
                      <div key={course._id} className="course-card">
                        <div className="course-image">
                          <img src={course.thumbnail} alt={course.title} />
                          <div className="course-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{course.progress}%</span>
                          </div>
                        </div>
                        <div className="course-info">
                          <span className="course-category">{course.category}</span>
                          <h3 className="course-title">{course.title}</h3>
                          <div className="course-meta">
                            <span className="last-accessed">
                              <i className="fas fa-clock"></i>
                              Last accessed {formatDate(course.lastAccessed)}
                            </span>
                          </div>
                          <div className="course-actions">
                            <button 
                              className="btn-continue"
                              onClick={() => router.push(`/courses/${course._id}/learn`)}
                            >
                              {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                            </button>
                            <button className="btn-outline">
                              <i className="fas fa-info-circle"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'certificates' && (
                <div className="certificates-tab">
                  <div className="certificates-header">
                    <h2>My Certificates</h2>
                    <p>Download and share your earned certificates</p>
                  </div>

                  <div className="certificates-grid">
                    {certificates.map((cert: Certificate) => (
                      <div key={cert._id} className="certificate-card">
                        <div className="certificate-header">
                          <i className="fas fa-certificate"></i>
                          <div>
                            <h3>{cert.courseTitle}</h3>
                            <p className="certificate-id">ID: {cert.certificateId}</p>
                          </div>
                        </div>
                        <div className="certificate-details">
                          <div className="detail-item">
                            <span className="label">Issued</span>
                            <span className="value">{formatDate(cert.issueDate)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Status</span>
                            <span className="value verified">
                              <i className="fas fa-check-circle"></i>
                              Verified
                            </span>
                          </div>
                        </div>
                        <div className="certificate-actions">
                          <button className="btn-download">
                            <i className="fas fa-download"></i>
                            Download PDF
                          </button>
                          <button className="btn-share">
                            <i className="fas fa-share-alt"></i>
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="settings-tab">
                  <div className="settings-header">
                    <h2>Account Settings</h2>
                    <p>Manage your account preferences and security</p>
                  </div>

                  <div className="settings-sections">
                    <div className="settings-section">
                      <h3>Account Information</h3>
                      <div className="setting-item">
                        <div className="setting-info">
                          <h4>Email Address</h4>
                          <p>Your primary email for login and notifications</p>
                        </div>
                        <div className="setting-value">
                          <span>{profileData.email}</span>
                          <button
                            className="btn-change"
                            onClick={() => setShowEmailForm(!showEmailForm)}
                          >
                            {showEmailForm ? 'Cancel' : 'Change'}
                          </button>
                        </div>
                      </div>
                      {showEmailForm && (
                        <div className="change-form">
                          <div className="form-group">
                            <label htmlFor="newEmail">New Email Address</label>
                            <input
                              type="email"
                              id="newEmail"
                              value={emailForm.newEmail}
                              onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                              placeholder="Enter new email address"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="emailPassword">Current Password</label>
                            <input
                              type="password"
                              id="emailPassword"
                              value={emailForm.password}
                              onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Enter current password"
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              className="btn-primary"
                              onClick={handleChangeEmail}
                              disabled={changeEmailMutation.isPending}
                            >
                              {changeEmailMutation.isPending ? 'Changing...' : 'Change Email'}
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setShowEmailForm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="setting-item">
                        <div className="setting-info">
                          <h4>Password</h4>
                          <p>Update your password to keep your account secure</p>
                        </div>
                        <div className="setting-value">
                          <button
                            className="btn-change"
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                          >
                            {showPasswordForm ? 'Cancel' : 'Change Password'}
                          </button>
                        </div>
                      </div>
                      {showPasswordForm && (
                        <div className="change-form">
                          <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                              type="password"
                              id="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              placeholder="Enter current password"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                              type="password"
                              id="newPassword"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Enter new password"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirm new password"
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              className="btn-primary"
                              onClick={handleChangePassword}
                              disabled={changePasswordMutation.isPending}
                            >
                              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setShowPasswordForm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="settings-section">
                      <h3>Notifications</h3>
                      <div className="setting-item">
                        <div className="setting-info">
                          <h4>Email Notifications</h4>
                          <p>Receive updates about courses, certificates, and announcements</p>
                        </div>
                        <div className="setting-value">
                          <label className="toggle-switch">
                            <input type="checkbox" defaultChecked />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                      <div className="setting-item">
                        <div className="setting-info">
                          <h4>Course Reminders</h4>
                          <p>Get reminders about upcoming lessons and deadlines</p>
                        </div>
                        <div className="setting-value">
                          <label className="toggle-switch">
                            <input type="checkbox" defaultChecked />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="settings-section danger-zone">
                      <h3>Danger Zone</h3>
                      <div className="setting-item">
                        <div className="setting-info">
                          <h4>Delete Account</h4>
                          <p>Permanently delete your account and all data</p>
                        </div>
                        <div className="setting-value">
                          <button className="btn-danger">
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}