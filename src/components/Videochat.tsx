"use client";

import { CSSProperties, useRef, useState } from "react";
import ZoomVideo, {
  type VideoClient,
  VideoQuality,
  type VideoPlayer,
  type Stream,
  type ProcessorParams,
  VideoProcessor,
  Processor
} from "@zoom/videosdk";
import { CameraButton, MicButton } from "./MuteButtons";
import { PhoneOff, ScreenShare } from "lucide-react";
import { Button } from "./ui/button";

const Videochat = (props: { slug: string; JWT: string }) => {
  const session = 'main-session';
  const userName = props.slug;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const [isVideoMuted, setIsVideoMuted] = useState(!client.current.getCurrentUserInfo()?.bVideoOn);
  const [isAudioMuted, setIsAudioMuted] = useState(client.current.getCurrentUserInfo()?.muted ?? true);
  const [isStandardShareVideo, setIsStandardShareVideo] = useState(false);
  const [isStandardShareRemoteVideo, setIsStandardShareRemoteVideo] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoProcessor = useRef<any>(null);
  const activeUsersRef = useRef<number[]>([]);
  const shareActiveRef = useRef<boolean>(false);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const sharedVideoCanvasRef = useRef<OffscreenCanvas>(new OffscreenCanvas(1280, 720));
  const frameRate = 1000/15;

  // const toggleStandardShare = async () => {
  //   const video = document.getElementById('standard-screen-share-video') as HTMLVideoElement;
  //   const stream = client.current.getMediaStream();
  //   if (!isStandardShareVideo) {
  //     stream.startShareScreen(video);
  //   } else {
  //     stream.stopShareScreen();
  //   }
  //   setIsStandardShareVideo(!isStandardShareVideo);
  // }

  // const renderUserStandardShare = async () => {
  //   client.current.on('active-share-change', (payload) => {
  //     const stream = client.current.getMediaStream();
  //     if (payload.state === 'Active') {
  //       console.log(`share screen active ${payload.userId}`);
  //       setIsStandardShareRemoteVideo(true);
  //       stream.startShareView(
  //         document.getElementById('standard-screen-share-canvas') as HTMLCanvasElement,
  //         payload.userId
  //       );
  //     } else if (payload.state === 'Inactive') {
  //       console.log(`share screen inactive ${payload.userId}`);
  //       setIsStandardShareRemoteVideo(false);
  //       stream.stopShareView();
  //     }
  //   });
  //   client.current.getAllUser().forEach((user) => {
  //     if (user.sharerOn) {
  //       setIsStandardShareRemoteVideo(true);
  //       const stream = client.current.getMediaStream();
  //       stream.startShareView(
  //         document.getElementById('standard-screen-share-canvas') as HTMLCanvasElement,
  //         user.userId
  //       )
  //     }
  //   });
  // }

  const startShareVideo = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const video = document.getElementById('video-me') as HTMLVideoElement;
    video.srcObject = stream;
    video.play();
    return video;
  }

  // const tryRedrawSentShare = async (data: Uint8ClampedArray, width: number, height: number) => {
  //   const tempCanvas = new OffscreenCanvas(width, height);
  //   const tempCtx = tempCanvas.getContext('2d');
  //   // tempCtx!.imageSmoothingEnabled = false;
  //   tempCtx!.imageSmoothingQuality = 'high';
  //   const imageData = new ImageData(data, width, height);
  //   tempCtx!.putImageData(imageData, 0, 0);
  //   const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
  //   canvas.width = imageData.width;
  //   canvas.height = imageData.height;
  //   const ctx = canvas.getContext('2d');
  //   ctx!.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  // }

  // const tryRedrawImageData = async (imageData: ImageData) => {
  //   const tempCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  //   const tempCtx = tempCanvas.getContext('2d');
  //   tempCtx!.putImageData(imageData, 0, 0);
  //   const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
  //   canvas.width = imageData.width;
  //   canvas.height = imageData.height;
  //   const ctx = canvas.getContext('2d');
  //   ctx!.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  // }

  const addShareVideoProcessor = async () => {
    lastFrameTimeRef.current = performance.now() - frameRate;
    const stream = client.current.getMediaStream();
    if(shareActiveRef.current) {
      if(videoProcessor.current) {
        videoProcessor.current.port.postMessage({
          cmd: 'update_shared_video_data',
          data: null
        });
        await stream.removeProcessor(videoProcessor.current);
      }
      shareActiveRef.current = false;
      return;
    }
    shareActiveRef.current = true;
    const video = await startShareVideo();
    if(!videoProcessor.current) {
      const params: ProcessorParams = {
        name: "share-video-processor",
        type: "video",
        url: window.location.origin + "/lib/share-video-processor.js",
        options: {},

      };
      const processor = await stream.createProcessor(params);
      processor.port.addEventListener('message', (e) => {
        if(e.data.cmd === 'request_next_frame') {
          sendNextFrame(video);
        }
      });
      videoProcessor.current = processor;
    }
    await stream.addProcessor(videoProcessor.current);
    videoProcessor.current.port.postMessage({ 
      cmd: 'update_user_name', 
      userName: userName
    });
    const refreshRate = 1000/15;
  }

  const sendNextFrame = async (video: HTMLVideoElement) => {
    const now = performance.now();
    const frameInterval = now - lastFrameTimeRef.current;
    if(frameInterval < frameRate) {
      return;
    }
    lastFrameTimeRef.current = now + frameInterval - frameRate;

    // const canvas = new OffscreenCanvas(1280, 720);
    // // const canvas = document.getElementById('canvas-me') as HTMLCanvasElement;
    // canvas.width = 1280;  // Set width to 1080p
    // canvas.height = 720;  //new OffscreenCanvas(1920, 1080);
    const canvas = sharedVideoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    // ctx!.imageSmoothingEnabled = false;
    ctx!.imageSmoothingQuality = 'high';
    ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
    const transferableData = new Uint8ClampedArray(imageData.data);
    videoProcessor.current.port.postMessage({ 
      cmd: 'update_shared_video_canvas', 
      width: canvas.width,
      height: canvas.height
    });
    const message = {
      cmd: 'update_shared_video_data',
      data: transferableData
    };
    videoProcessor.current.port.postMessage(message, [transferableData.buffer]);
  }

  const joinSession = async () => {
    document.addEventListener("visibilitychange", (event) => {
      console.log(`visibilitychange ${document.visibilityState}`);
    });
    await client.current.init("en-US", "Global", { patchJsMedia: true, leaveOnPageUnload: true });
    client.current.on("peer-video-state-change", renderVideo);
    await client.current.join(session, jwt, userName)
      .catch((e) => console.log(e));
    setInSession(true);
    const mediaStream = client.current.getMediaStream();
    await mediaStream.startAudio();
    setIsAudioMuted(mediaStream.isAudioMuted());
    await mediaStream.startVideo();
    setIsVideoMuted(!mediaStream.isCapturingVideo());
    // await renderVideo({ action: "Start", userId: client.current.getCurrentUserInfo().userId, });
    await addActiveUsers();
    // await renderUserStandardShare();
  };

  const addActiveUsers = async () => {
    client.current.getAllUser().forEach(async (user) => {
      if (user.bVideoOn) {
        await renderVideo({ action: "Start", userId: user.userId, });
      }
    });
  }

  const renderVideo = async (event: { action: "Start" | "Stop"; userId: number; }) => {
    const mediaStream = client.current.getMediaStream();
    if (event.action === "Stop") {
      if (!activeUsersRef.current.includes(event.userId)) {
        return;
      }
      activeUsersRef.current = activeUsersRef.current.filter((id) => id !== event.userId);
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element) ? element.forEach((el) => el.remove()) : element.remove();
    } else {
      if (activeUsersRef.current.includes(event.userId)) {
        return;
      }
      activeUsersRef.current.push(event.userId);
      const userVideo = await mediaStream.attachVideo(event.userId, VideoQuality.Video_720P);
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
    }
  };

  const leaveSession = async () => {
    client.current.off("peer-video-state-change", renderVideo);
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    window.location.href = "/";
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <video id="video-me" className="active" style={{ width: 1280, height: 720, display: 'none' }} ></video>
      <div
        className="flex w-full flex-1"
        style={inSession ? {} : { display: "none" }}
      >
        {/* @ts-expect-error html component */}
        <video-player-container ref={videoContainerRef} style={videoPlayerStyle} >
          {/* <video id="standard-screen-share-video" className="active" style={{ display: isStandardShareVideo ? 'block' : 'none' }} />
          <canvas id="standard-screen-share-canvas" style={{ display: isStandardShareRemoteVideo ? 'block' : 'none' }} /> */}
          {/* <canvas id="test-canvas" />
          <canvas id="canvas-me" ></canvas> */}
        {/* @ts-expect-error html component */}
        </video-player-container>
      </div>
      {!inSession ? (
        <div className="mx-auto flex w-64 flex-col self-center">
          <div className="w-4" />
          <h1 className="text-center text-3xl font-bold mb-4 mt-0">
            Session: {session}
          </h1>
          <Button className="flex flex-1" onClick={joinSession} title="join session">
            Join
          </Button>
        </div>
      ) : (
        <div className="flex w-full flex-col justify-around self-center">
          <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
            <CameraButton
              client={client}
              isVideoMuted={isVideoMuted}
              setIsVideoMuted={setIsVideoMuted}
              renderVideo={renderVideo}
            />
            <MicButton
              isAudioMuted={isAudioMuted}
              client={client}
              setIsAudioMuted={setIsAudioMuted}
            />
            <Button onClick={leaveSession} title="leave session">
              <PhoneOff />
            </Button>
            <Button onClick={addShareVideoProcessor} title="">
              <ScreenShare />
            </Button>
            {/* <Button onClick={toggleStandardShare} title="">
              <ScreenShare color="blue" />
            </Button> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Videochat;

const videoPlayerStyle = {
  alignContent: "center",
} as CSSProperties;
