'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse, useUpdateProgress } from '@/hooks/useCourses';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { Lesson } from '@/types';
import '@/app/CourseLearnPage.css';

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const { data, isLoading } = useCourse(id as string);
  const updateProgress = useUpdateProgress();
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('lessons');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const course = data?.data;

  useEffect(() => {
    if (course?.lessons?.length > 0 && !currentLesson) {
      setCurrentLesson(course.lessons[0]);
    }
  }, [course, currentLesson]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.load();
      setTimeout(() => videoRef.current?.play(), 100);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoEnded = async () => {
    if (currentLesson) {
      setCompletedLessons(prev => new Set([...prev, currentLesson._id || '']));
      
      const completedCount = completedLessons.size + 1;
      const totalLessons = course?.lessons.length || 1;
      const progress = Math.round((completedCount / totalLessons) * 100);
      const completed = progress === 100;
      
      try {
        await updateProgress.mutateAsync({
          courseId: id as string,
          progress,
          completed,
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  const handleNextLesson = () => {
    if (!course?.lessons || !currentLesson) return;
    
    const currentIndex = course.lessons.findIndex(l => l._id === currentLesson._id);
    if (currentIndex < course.lessons.length - 1) {
      setCurrentLesson(course.lessons[currentIndex + 1]);
      setIsPlaying(true);
      if (videoRef.current) {
        setTimeout(() => videoRef.current?.play(), 100);
      }
    }
  };

  const handlePreviousLesson = () => {
    if (!course?.lessons || !currentLesson) return;
    
    const currentIndex = course.lessons.findIndex(l => l._id === currentLesson._id);
    if (currentIndex > 0) {
      setCurrentLesson(course.lessons[currentIndex - 1]);
      setIsPlaying(true);
      if (videoRef.current) {
        setTimeout(() => videoRef.current?.play(), 100);
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTotalDuration = () => {
    if (!course?.lessons) return 0;
    return course.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  };

  const calculateCompletedDuration = () => {
    if (!course?.lessons) return 0;
    return course.lessons.reduce((total, lesson) => {
      return completedLessons.has(lesson._id || '') ? total + (lesson.duration || 0) : total;
    }, 0);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="loading-screen">
          <div className="loader">
            <div className="spinner"></div>
            <p className="loading-text">Loading content...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const currentIndex = course?.lessons.findIndex(l => l._id === currentLesson?._id) ?? -1;
  const totalLessons = course?.lessons.length || 0;
  const totalDuration = calculateTotalDuration();
  const completedDuration = calculateCompletedDuration();
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <ProtectedRoute>
      <div className="course-learn-page">
        {/* Navigation Bar */}
        <nav className="learn-navbar">
          <div className="nav-container">
            <div className="nav-left">
              <button 
                className="back-btn"
                onClick={() => router.push(`/courses/${id}`)}
              >
                <i className="fas fa-arrow-left"></i>
                <span>Back to Course</span>
              </button>
              <div className="course-title">
                <h1>{course?.title}</h1>
                <p className="instructor-name">By {course?.instructor?.name}</p>
              </div>
            </div>
            
            <div className="nav-right">
              <div className="progress-display">
                <div className="progress-text">
                  <span>Progress:</span>
                  <strong>{course?.userProgress?.progress || 0}%</strong>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${course?.userProgress?.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Left Column - Video Player */}
          <div className="player-section">
            {/* Video Container */}
            <div className="video-container">
              {currentLesson ? (
                <div className="video-wrapper">
                  <video
                    ref={videoRef}
                    className="video-player"
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onEnded={handleVideoEnded}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                  >
                    <source src={currentLesson.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Video Overlay */}
                  <div className="video-overlay">
                    <button 
                      className={`play-btn ${isPlaying ? 'playing' : ''}`}
                      onClick={togglePlayPause}
                    >
                      <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="video-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="time-display">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-video-placeholder">
                  <i className="fas fa-video-slash"></i>
                  <p>Select a lesson to start</p>
                </div>
              )}

              {/* Lesson Info */}
              <div className="lesson-info">
                <div className="lesson-header">
                  <div>
                    <h2>{currentLesson?.title || 'Select a Lesson'}</h2>
                    <p className="lesson-description">
                      {currentLesson?.description || 'Click any lesson from the sidebar to start learning'}
                    </p>
                  </div>
                  <div className="lesson-meta">
                    <span className="lesson-number">
                      <i className="fas fa-list-ol"></i>
                      Lesson {currentIndex + 1} of {totalLessons}
                    </span>
                    {currentLesson?.duration && (
                      <span className="lesson-duration">
                        <i className="fas fa-clock"></i>
                        {formatTime(currentLesson.duration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Video Controls */}
                <div className="video-controls">
                  <div className="controls-left">
                    <button 
                      className="control-btn"
                      onClick={handlePreviousLesson}
                      disabled={currentIndex === 0}
                    >
                      <i className="fas fa-step-backward"></i>
                      Previous
                    </button>
                    
                    <div className="speed-control">
                      <button 
                        className="control-btn"
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      >
                        <i className="fas fa-tachometer-alt"></i>
                        {playbackSpeed}x
                      </button>
                      {showSpeedMenu && (
                        <div className="speed-menu">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                            <button
                              key={speed}
                              className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                              onClick={() => handleSpeedChange(speed)}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="controls-center">
                    <div className="play-controls">
                      <button 
                        className="play-control-btn"
                        onClick={togglePlayPause}
                      >
                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                      </button>
                      <span className={`play-status ${isPlaying ? 'playing' : 'paused'}`}>
                        <i className={`fas fa-circle ${isPlaying ? 'fa-play' : 'fa-pause'}`}></i>
                        {isPlaying ? 'Playing' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="controls-right">
                    <button 
                      className="control-btn next-btn"
                      onClick={handleNextLesson}
                      disabled={currentIndex === totalLessons - 1}
                    >
                      Next
                      <i className="fas fa-step-forward"></i>
                    </button>
                    
                    {currentLesson?.isPreview && (
                      <span className="preview-badge">
                        <i className="fas fa-eye"></i>
                        Free Preview
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon time-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-content">
                  <h3>Time Spent</h3>
                  <p className="stat-value">{formatTime(completedDuration)}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon complete-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>Lessons Completed</h3>
                  <p className="stat-value">{completedLessons.size} / {totalLessons}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon remaining-icon">
                  <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="stat-content">
                  <h3>Time Remaining</h3>
                  <p className="stat-value">{formatTime(totalDuration - completedDuration)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="sidebar">
            {/* Tabs */}
            <div className="sidebar-tabs">
              <button 
                className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
                onClick={() => setActiveTab('lessons')}
              >
                <i className="fas fa-play-circle"></i>
                Lessons
              </button>
              <button 
                className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveTab('resources')}
              >
                <i className="fas fa-file-alt"></i>
                Resources
              </button>
              <button 
                className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <i className="fas fa-edit"></i>
                Notes
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'lessons' && (
                <div className="lessons-list">
                  <div className="lessons-header">
                    <h3>Course Content</h3>
                    <p className="lessons-count">
                      {totalLessons} lessons • {formatTime(totalDuration)}
                    </p>
                  </div>
                  
                  <div className="lessons-container">
                    {course?.lessons?.map((lesson: Lesson, index: number) => {
                      const isCurrent = currentLesson?._id === lesson._id;
                      const isCompleted = completedLessons.has(lesson._id || '');
                      
                      return (
                        <div
                          key={lesson._id || index}
                          className={`lesson-item ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                          onClick={() => handleLessonSelect(lesson)}
                        >
                          <div className="lesson-item-left">
                            <div className={`lesson-number ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}>
                              {isCompleted ? (
                                <i className="fas fa-check"></i>
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div className="lesson-info">
                              <h4 className="lesson-title">{lesson.title}</h4>
                              <div className="lesson-meta">
                                <span className="lesson-duration">
                                  <i className="fas fa-clock"></i>
                                  {formatTime(lesson.duration || 0)}
                                </span>
                                {lesson.isPreview && (
                                  <span className="lesson-preview">
                                    <i className="fas fa-eye"></i>
                                    Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isCurrent && (
                            <div className="current-indicator">
                              <i className="fas fa-play"></i>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {activeTab === 'resources' && (
                <div className="resources-tab">
                  <div className="tab-header">
                    <h3>Course Resources</h3>
                  </div>
                  <div className="resources-list">
                    <div className="resource-item">
                      <i className="fas fa-file-pdf"></i>
                      <div>
                        <h4>Course Syllabus</h4>
                        <p>PDF • 2.4 MB</p>
                      </div>
                      <button className="download-btn">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                    <div className="resource-item">
                      <i className="fas fa-file-code"></i>
                      <div>
                        <h4>Source Code</h4>
                        <p>ZIP • 15.2 MB</p>
                      </div>
                      <button className="download-btn">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                    <div className="resource-item">
                      <i className="fas fa-file-alt"></i>
                      <div>
                        <h4>Exercise Files</h4>
                        <p>DOCX • 3.1 MB</p>
                      </div>
                      <button className="download-btn">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'notes' && (
                <div className="notes-tab">
                  <div className="tab-header">
                    <h3>My Notes</h3>
                  </div>
                  <div className="notes-editor">
                    <textarea 
                      className="notes-textarea"
                      placeholder="Write your notes here..."
                      rows={10}
                    ></textarea>
                    <button className="save-notes-btn">
                      <i className="fas fa-save"></i>
                      Save Notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}