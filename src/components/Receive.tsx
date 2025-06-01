"use client";

import { CSSProperties, useRef, useState, useEffect } from "react";
import ZoomVideo, {
  type VideoClient,
  VideoQuality,
  type VideoPlayer,
} from "@zoom/videosdk";
import { CameraButton, MicButton } from "./MuteButtons";
import { PhoneOff, ScreenShare } from "lucide-react";
import { Button } from "./ui/button";

const Videochat = (props: { slug: string; JWT: string }) => {
  const session = props.slug;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  // const [shownUsers, setShownUsers] = useState<number[]>([]);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const [isVideoMuted, setIsVideoMuted] = useState(!client.current.getCurrentUserInfo()?.bVideoOn);
  const [isAudioMuted, setIsAudioMuted] = useState(client.current.getCurrentUserInfo()?.muted ?? true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const activeUsersRef = useRef<number[]>([]);
  const shareVideoCanvasRef = useRef<HTMLCanvasElement>(null);
  const shareMyVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    joinSession();
  });

  const joinSession = async () => {
    if(inSession)
      return;
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    console.log("receive: after init");
    // client.current.on("peer-video-state-change", renderVideo);
    console.log("receive: before join");
    await client.current.join(session, jwt, userName)
      .catch((e) => console.log(e));
    console.log("receive: after join");
    setInSession(true);
    console.log("receive: after setInSession");
    const mediaStream = client.current.getMediaStream();
    console.log("receive: after getMediaStream");
    setTimeout(async () => {
      // console.log("receive: before startAudio");
      // await mediaStream.startAudio();
      // console.log("receive: after startAudio");
      // setIsAudioMuted(mediaStream.isAudioMuted());
      // console.log("receive: before startVideo");
      // await mediaStream.startVideo();
      // console.log("receive: after startVideo");
      client.current.on('active-share-change', renderShareVideo);
      console.log("receive: after active-share-change");
      // setIsVideoMuted(!mediaStream.isCapturingVideo());
      // console.log("before renderVideo");
      // await renderVideo({ action: "Start", userId: client.current.getCurrentUserInfo().userId });
      // console.log("after renderVideo");
    }, 2000);
    // setTimeout(async () => {
    //   await startSharing();
    // }, 3000);
    

  };

  const renderShareVideo = async (payload: { state: "Active" | "Inactive"; userId: number; }) => {
    if(!shareVideoCanvasRef.current) {
      const shareView = document.createElement('canvas') as HTMLCanvasElement;
      shareVideoCanvasRef.current = shareView;
      videoContainerRef.current!.appendChild(shareView);
    }
    const mediaStream = client.current.getMediaStream();
    if (payload.state === 'Active') {
      mediaStream.startShareView(
        shareVideoCanvasRef.current,
        payload.userId
      )
    } else if (payload.state === 'Inactive') {
      mediaStream.stopShareView()
    }
  }

  const renderVideo = async (event: { action: "Start" | "Stop"; userId: number; }) => {
    const mediaStream = client.current.getMediaStream();

    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element) ? element.forEach((el) => el.remove()) : element.remove();
    } else {
      if (activeUsersRef.current.includes(event.userId))
        return;
      activeUsersRef.current.push(event.userId);
      console.log(`Added ${event.userId} to shownUsers`);
      const userVideo = await mediaStream.attachVideo(event.userId, VideoQuality.Video_360P);
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
    }
  };

  const startSharing = async () => {
    const mediaStream = client.current.getMediaStream();
    if(!shareMyVideoRef.current) {
      const shareVideo = document.createElement('video') as HTMLVideoElement;
      shareMyVideoRef.current = shareVideo;
      videoContainerRef.current!.appendChild(shareVideo);
    }
    await mediaStream.startShareScreen(shareMyVideoRef.current as HTMLVideoElement);
  };

  const leaveSession = async () => {
    client.current.off("peer-video-state-change", renderVideo);
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    window.location.href = "/";
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <h1 className="text-center text-3xl font-bold mb-4 mt-0">
        Session: {session}
      </h1>
      <div
        className="flex w-full flex-1"
        style={inSession ? {} : { display: "none" }}
      >
        {/* @ts-expect-error html component */}
        <video-player-container ref={videoContainerRef} style={videoPlayerStyle} />
      </div>
      {/* {!inSession ? (
        <div className="mx-auto flex w-64 flex-col self-center">
          <div className="w-4" />
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
            <Button onClick={startSharing} title="start sharing">
              <ScreenShare />
            </Button>
            <Button onClick={leaveSession} title="leave session">
              <PhoneOff />
            </Button>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Videochat;

const videoPlayerStyle = {
  height: "75vh",
  marginTop: "1.5rem",
  marginLeft: "3rem",
  marginRight: "3rem",
  alignContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
} as CSSProperties;

const userName = `User-${new Date().getTime().toString().slice(8)}`;
