'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Play, StopCircle } from 'lucide-react'

// ============================================
// BACKEND CONFIGURATION
// ============================================
const BACKEND_CONFIG = {
  // Set to your Flask backend URL from environment variables
  baseUrl: process.env.NEXT_PUBLIC_EMOTION_BACKEND_URL || 'http://127.0.0.1:5000',
  
  // Endpoints
  endpoints: {
    analyzeFrame: '/analyze_frame',     // Analyze client-side webcam frame
  },
  
  // Frame analysis interval (ms) - 1000ms = 1 frame/sec to reduce server load
  frameAnalysisInterval: parseInt(process.env.NEXT_PUBLIC_FRAME_INTERVAL || '1000', 10),
}

export default function EmotionDetector() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentEmotion, setCurrentEmotion] = useState<string>('None')
  const [confidence, setConfidence] = useState<number>(0)
  const [debugInfo, setDebugInfo] = useState<string>('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setDebugInfo('Requesting camera access...')
      
      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      setDebugInfo(`Stream obtained: ${stream.active}, tracks: ${stream.getTracks().length}`)
      console.log('Stream obtained:', stream)
      
      streamRef.current = stream
      setIsCameraActive(true)
      setIsLoading(false)
      
    } catch (err) {
      console.error('Error starting camera:', err)
      setError(err instanceof Error ? err.message : 'Failed to access webcam')
      setDebugInfo(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }

  // Attach stream to video element when camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current
      const stream = streamRef.current
      
      setDebugInfo('Attaching stream to video element...')
      video.srcObject = stream
      
      const handleCanPlay = async () => {
        try {
          setDebugInfo('Video can play, starting...')
          await video.play()
          setDebugInfo(`Video playing: ${!video.paused}, dimensions: ${video.videoWidth}x${video.videoHeight}`)
          console.log('Video playing:', !video.paused, 'Dimensions:', video.videoWidth, video.videoHeight)
          
          // Start analyzing frames
          setTimeout(() => startFrameAnalysis(), 500)
        } catch (playError) {
          console.error('Play error:', playError)
          setDebugInfo(`Play error: ${playError}`)
        }
      }
      
      video.addEventListener('canplay', handleCanPlay)
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [isCameraActive])

  const stopCamera = () => {
    // Stop frame analysis
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsCameraActive(false)
    setCurrentEmotion('None')
    setConfidence(0)
    setError(null)
  }

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context || video.readyState < 2) return null // Check if video is ready
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    if (canvas.width === 0 || canvas.height === 0) return null
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const analyzeFrame = async () => {
    try {
      const frameData = captureFrame()
      if (!frameData) return
      
      const response = await fetch(`${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.analyzeFrame}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: frameData }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.emotion) {
          setCurrentEmotion(data.emotion)
          setConfidence(data.confidence || 0)
        }
      }
    } catch (err) {
      console.error('Error analyzing frame:', err)
    }
  }

  const startFrameAnalysis = () => {
    // Analyze first frame immediately
    analyzeFrame()
    
    // Then set up interval for continuous analysis
    intervalRef.current = setInterval(analyzeFrame, BACKEND_CONFIG.frameAnalysisInterval)
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Facial Emotion Detector
          </CardTitle>
          <CardDescription className="text-base">
            Real-time emotion detection powered by YOLO
          </CardDescription>
          {error && (
            <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
              ⚠️ {error}
            </div>
          )}
          {debugInfo && (
            <div className="text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
              🔍 {debugInfo}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Camera Feed */}
          {!isCameraActive ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <p className="text-lg text-gray-600">Start your camera for live emotion detection</p>
              <Button
                size="lg"
                onClick={startCamera}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg text-lg px-8"
              >
                <Play className="mr-2 h-6 w-6" />
                {isLoading ? 'Connecting...' : 'Start Camera'}
              </Button>
              <p className="text-xs text-gray-500">
                Make sure Flask backend is running on {BACKEND_CONFIG.baseUrl}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Live Video Feed from Client-Side Webcam */}
              <div className="relative rounded-2xl overflow-hidden bg-black mx-auto shadow-2xl border-4 border-white max-w-3xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    minHeight: '400px',
                    maxHeight: '720px',
                    transform: 'scaleX(-1)',
                    display: 'block',
                    backgroundColor: '#000'
                  }}
                />
                
                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Live Detection Badge */}
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                  <span className="font-semibold">LIVE</span>
                </div>

                {/* Current Emotion Display */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-2xl">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Current Emotion</p>
                    <p className={`text-2xl font-bold capitalize ${
                      currentEmotion === 'None' ? 'text-gray-400' : 'text-blue-600'
                    }`}>
                      {currentEmotion}
                    </p>
                    {confidence > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {(confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stop Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={stopCamera}
                  variant="destructive"
                  className="shadow-lg"
                >
                  <StopCircle className="mr-2 h-5 w-5" />
                  Stop Camera
                </Button>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="pt-6 border-t">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Powered by YOLO Model
              </h3>
              <p className="text-xs text-gray-500">
                Client-side webcam with server-side emotion detection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
