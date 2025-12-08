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

  const course = data?.data;

  useEffect(() => {
    if (course?.lessons?.length > 0 && !currentLesson) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setCurrentLesson(course.lessons[0]);
    }
  }, [course?.lessons, currentLesson]);

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.pause();
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
      // Mark lesson as completed
      setCompletedLessons(prev => new Set([...prev, currentLesson._id || '']));
      
      // Calculate progress
      const completedCount = completedLessons.size + 1;
      const totalLessons = course?.lessons.length || 1;
      const progress = Math.round((completedCount / totalLessons) * 100);
      const completed = progress === 100;
      
      // Update progress on backend
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

    const currentIndex = course.lessons.findIndex((l: Lesson) => l._id === currentLesson._id);
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

    const currentIndex = course.lessons.findIndex((l: Lesson) => l._id === currentLesson._id);
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
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      onPlay={handleVideoPlay}
                      onPause={handleVideoPause}
                      onEnded={handleVideoEnded}
                    >
                      <source src={currentLesson.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Custom Controls Overlay */}
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
                        {formatTime(completedDuration)}
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
                        {formatTime(totalDuration - completedDuration)}
                      </div>
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