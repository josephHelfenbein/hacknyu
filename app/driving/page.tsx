'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Camera,
  Eye,
  Clock,
  ArrowLeft,
  Play,
  Square,
} from 'lucide-react';

export default function Page() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertLevel, setAlertLevel] = useState('Normal');
  const [eyesClosedCount, setEyesClosedCount] = useState(0);
  const [drivingTime, setDrivingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const connectWebSocket = () => {
    const socket = new WebSocket('ws://localhost:8000/ws');
    socket.onopen = () => console.log('Connected to WebSocket');
    socket.onclose = () => console.log('Disconnected from WebSocket');
    setWs(socket);
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  };
  const captureFrame = () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !ws ||
      ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
      const imageData = canvasRef.current.toDataURL('image/jpeg'); // Convert to JPEG Base64
      ws.send(imageData); // Send to WebSocket Server
    }
  };
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopCamera();
      disconnectWebSocket();
    } else {
      startCamera();
      connectWebSocket();
    }
    setIsMonitoring(!isMonitoring);
  };
  useEffect(() => {
    let frameInterval: NodeJS.Timeout;
    if (isMonitoring) {
      frameInterval = setInterval(captureFrame, 100);
    }
    return () => clearInterval(frameInterval);
  }, [isMonitoring, ws]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(() => {
        setDrivingTime((prevTime) => prevTime + 1);
        if (Math.random() < 0.1) {
          setAlertLevel('Warning');
          setEyesClosedCount((prev) => prev + 1);
        } else {
          setAlertLevel('Normal');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCamera = async () => {
    if (videoRef.current) {
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = userMediaStream;
        setStream(userMediaStream);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <ArrowLeft className="mr-2" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold">Driving Monitor</h1>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800 md:col-span-2">
            <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="h-full w-full rounded-lg object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
                width={640}
                height={480}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`mr-2 h-3 w-3 rounded-full ${alertLevel === 'Normal' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="font-semibold">{alertLevel}</span>
              </div>
              <button
                onClick={toggleMonitoring}
                className={`rounded-full px-4 py-2 font-semibold ${
                  isMonitoring
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isMonitoring ? (
                  <Square className="mr-2 inline" />
                ) : (
                  <Play className="mr-2 inline" />
                )}
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
              <h2 className="mb-2 flex items-center text-xl font-semibold">
                <Eye className="mr-2" /> Alertness
              </h2>
              <p className="text-3xl font-bold">{100 - eyesClosedCount}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Eyes closed: {eyesClosedCount} times
              </p>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
              <h2 className="mb-2 flex items-center text-xl font-semibold">
                <Clock className="mr-2" /> Driving Time
              </h2>
              <p className="text-3xl font-bold">{formatTime(drivingTime)}</p>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
              <h2 className="mb-2 flex items-center text-xl font-semibold">
                <AlertCircle className="mr-2" /> Tips
              </h2>
              <ul className="list-inside list-disc text-sm">
                <li>Take a break every 2 hours</li>
                <li>Stay hydrated</li>
                <li>Adjust your posture regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
