'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse, useUpdateProgress } from '@/hooks/useCourses';
import { Lesson } from '@/types';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [youtubePlayerReady, setYoutubePlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const lastSentProgressRef = useRef<{ time: number; progress: number }>({ time: 0, progress: -1 });
  const ytPollRef = useRef<number | null>(null);

  const course = data?.data;

  useEffect(() => {
    if (course?.lessons?.length > 0 && !currentLesson) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setCurrentLesson(course.lessons[0]);
    }
  }, [course?.lessons, currentLesson]);

  // Load YouTube Player API
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).onYouTubeIframeAPIReady = () => {
        setYoutubePlayerReady(true);
      };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((window as any).YT) {
      setYoutubePlayerReady(true);
    }
  }, []);

  // Initialize YouTube player when lesson changes
  useEffect(() => {
    // YouTube player initialization is intentionally simplified here to avoid
    // parser issues while we iterate. The full player setup will be restored
    // after ensuring the build is clean.
    if (youtubePlayerReady && currentLesson && isYouTubeUrl(currentLesson.videoUrl)) {
      // placeholder: real YT player setup lives here
      // youtubePlayerRef.current = new (window as any).YT.Player(...)
    }
  }, [currentLesson, youtubePlayerReady]);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) await playPromise;
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Play/pause action failed:', err);
    }
  };

  // Throttled progress sender
  const maybeSendProgress = async (progress: number, completed: boolean) => {
    const now = Date.now();
    const last = lastSentProgressRef.current;
    // send if progress changed meaningfully or 8s passed
    if (progress !== last.progress && (now - last.time > 8000 || Math.abs(progress - last.progress) >= 2)) {
      lastSentProgressRef.current = { time: now, progress };
      try {
        await updateProgress.mutateAsync({
          courseId: id as string,
          progress,
          completed,
          lastWatched: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to send periodic progress update', err);
      }
    }
  };

  // Update currentTime for native video and send throttled progress updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      // compute progress using fraction of current lesson
      if (!course?.lessons) return;
      const totalLessons = course.lessons.length || 1;
      const completedCount = completedLessons.size;
      const fraction = currentLesson && !completedLessons.has(currentLesson._id || '')
        ? Math.min((video.currentTime || 0) / (currentLesson.duration || 1), 1)
        : 0;
      const progress = Math.round(((completedCount + fraction) / totalLessons) * 100);
      const completed = progress === 100;
      void maybeSendProgress(progress, completed);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef.current, currentLesson, completedLessons, course]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
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
    return course.lessons.reduce((total: number, lesson: Lesson) => total + (lesson.duration || 0), 0);
  };

  const calculateCompletedDuration = () => {
    if (!course?.lessons) return 0;
    return course.lessons.reduce((total: number, lesson: Lesson) => {
      return completedLessons.has(lesson._id || '') ? total + (lesson.duration || 0) : total;
    }, 0);
  };

  const getYouTubeVideoId = (url?: string) => {
    if (!url) return null;
    const vMatch = url.match(/[?&]v=([^&]+)/);
    if (vMatch && vMatch[1]) return vMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch && shortMatch[1]) return shortMatch[1];
    return null;
  };

  const isYouTubeUrl = (url?: string) => {
    if (!url) return false;
    return /youtu(?:\.be|be\.com)/i.test(url);
  };

  const getYouTubeEmbed = (url?: string) => {
    if (!url) return '';
    const vMatch = url.match(/[?&]v=([^&]+)/);
    if (vMatch && vMatch[1]) return `https://www.youtube.com/embed/${vMatch[1]}`;
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch && shortMatch[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    return url;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500/40 border-t-blue-300 rounded-full animate-spin animate-reverse"></div>
            </div>
          </div>
          <p className="mt-6 text-blue-200 text-lg font-medium">جاري تحميل المحتوى...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const currentIndex = course?.lessons.findIndex((l: Lesson) => l._id === currentLesson?._id) ?? -1;
  const totalLessons = course?.lessons.length || 0;
  const totalDuration = calculateTotalDuration();
  const completedDuration = calculateCompletedDuration();
  // include partial progress from the currently playing lesson
  const liveCompletedDuration = (() => {
    if (!currentLesson) return completedDuration;
    const isCurCompleted = completedLessons.has(currentLesson._id || '');
    const curContribution = !isCurCompleted ? Math.min(currentTime || 0, currentLesson.duration || 0) : 0;
    return completedDuration + curContribution;
  })();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push(`/courses/${id}`)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  العودة للمادة
                </button>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400">التقدم</div>
                  <div className="text-lg font-bold text-white">{course?.userProgress?.progress || 0}%</div>
                </div>
                
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-white truncate max-w-md">
                    {course?.title}
                  </h1>
                  <p className="text-sm text-gray-400">{course?.instructor?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <button className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-300 font-medium">سرعة التشغيل</div>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`w-full px-3 py-2 text-sm rounded transition-colors ${
                            playbackSpeed === speed
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Video Player */}
            <div className="lg:w-2/3 space-y-6">
              {/* Video Player Container */}
              <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
                {currentLesson ? (
                  <div className="relative aspect-video bg-black">
                    {isYouTubeUrl(currentLesson?.videoUrl) ? (
                      <div className="video-iframe-wrapper">
                        <iframe
                          src={getYouTubeEmbed(currentLesson?.videoUrl)}
                          title={currentLesson?.title || 'YouTube video'}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        className="w-full h-full"
                        controls
                        playsInline
                        preload="metadata"
                        onPlay={handleVideoPlay}
                        onPause={handleVideoPause}
                        onEnded={handleVideoEnded}
                      >
                        <source src={currentLesson.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    
                    {/* Custom Controls Overlay (only for native <video>) */}
                    {!isYouTubeUrl(currentLesson?.videoUrl) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                                            <button
                                              onClick={togglePlayPause}
                                              className={`transform transition-all duration-200 ${
                                                isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                                              }`}
                                            >
                                              <div className={`w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110 ${
                                                isPlaying ? '' : ''
                                              }`}>
                                                {isPlaying ? (
                                                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                                  </svg>
                                                ) : (
                                                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                  </svg>
                                                )}
                                              </div>
                                            </button>
                                          </div>
                                        )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400">اختر درساً للبدء</p>
                    </div>
                  </div>
                )}

                {/* Video Info and Navigation */}
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        {currentLesson?.title || 'اختر درساً للبدء'}
                      </h2>
                      <p className="text-gray-300">
                        {currentLesson?.description || 'انقر على أي درس في القائمة الجانبية لبدء التعلم'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-center bg-gray-700/50 rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">الدرس</div>
                        <div className="text-lg font-bold text-white">
                          {currentIndex + 1} / {totalLessons}
                        </div>
                      </div>
                      
                      {currentLesson?.duration && (
                        <div className="text-center bg-gray-700/50 rounded-lg px-4 py-2">
                          <div className="text-sm text-gray-400">المدة</div>
                          <div className="text-lg font-bold text-white">
                            {formatTime(currentLesson.duration)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
                    <div className="flex space-x-3">
                      <button
                        onClick={handlePreviousLesson}
                        disabled={currentIndex === 0}
                        className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        السابق
                      </button>
                      
                      <button
                        onClick={handleNextLesson}
                        disabled={currentIndex === totalLessons - 1}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        التالي
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    {currentLesson && (
                      <div className="flex items-center text-gray-300">
                        <div className={`w-3 h-3 rounded-full mr-2 ${isPlaying ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">
                          {isPlaying ? 'جاري التشغيل' : 'متوقف'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-500/20 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">الوقت المستغرق</div>
                      <div className="text-xl font-bold text-white">
                        {formatTime(liveCompletedDuration)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-500/20 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">الدروس المكتملة</div>
                      <div className="text-xl font-bold text-white">
                        {completedLessons.size} / {totalLessons}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-500/20 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">الوقت المتبقي</div>
                      <div className="text-xl font-bold text-white">
                        {formatTime(Math.max(0, totalDuration - liveCompletedDuration))}
                   </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Lessons List */}
            <div className="lg:w-1/3">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-700/50">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <svg className="w-5 h-5 ml-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    محتويات المادة
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {totalLessons} درس • {formatTime(totalDuration)}
                  </p>
                </div>

                {/* Progress */}
                <div className="p-5 border-b border-gray-700/30">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>تقدمك</span>
                    <span className="font-medium">{course?.userProgress?.progress || 0}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 right-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${course?.userProgress?.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="p-2 max-h-[500px] overflow-y-auto">
                  <div className="space-y-1">
                    {course?.lessons?.map((lesson: Lesson, index: number) => {
                      const isCurrent = currentLesson?._id === lesson._id;
                      const isCompleted = completedLessons.has(lesson._id || '');
                      
                      return (
                        <button
                          key={lesson._id || index}
                          onClick={() => handleLessonSelect(lesson)}
                          className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                            isCurrent
                              ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30'
                              : isCompleted
                              ? 'bg-green-900/10 hover:bg-green-900/20'
                              : 'hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-all ${
                                isCurrent
                                  ? 'bg-blue-500 text-white'
                                  : isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-700 text-gray-300'
                              }`}>
                                {isCompleted ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="font-bold">{index + 1}</span>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className={`font-medium transition-colors ${
                                  isCurrent ? 'text-white' : isCompleted ? 'text-green-300' : 'text-gray-300'
                                }`}>
                                  {lesson.title}
                                </div>
                                <div className="flex items-center text-sm mt-1">
                                  <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-400">
                                    {Math.floor(lesson.duration / 60)}:
                                    {(lesson.duration % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {lesson.isPreview && !isCompleted && (
                              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full border border-amber-500/30">
                                معاينة مجانية
                              </span>
                            )}
                            
                            {isCurrent && (
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Completion Status */}
                {completedLessons.size === totalLessons && (
                  <div className="p-5 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-t border-green-500/20">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-500/20 rounded-lg ml-3">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-white">مبارك! لقد أكملت المادة</div>
                        <div className="text-sm text-green-300 mt-1">
                          يمكنك الآن تحميل شهادتك
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
    </ProtectedRoute>
  );
}