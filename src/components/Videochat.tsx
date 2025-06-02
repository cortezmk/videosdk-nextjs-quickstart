"use client";

import { CSSProperties, useRef, useState, useEffect } from "react";
import ZoomVideo, {
  type VideoClient,
  VideoQuality,
  type VideoPlayer,
} from "@zoom/videosdk";
import { renderToStaticMarkup } from "react-dom/server"
import { CameraButton, MicButton } from "./MuteButtons";
import { PhoneOff, ScreenShare } from "lucide-react";
import { Button } from "./ui/button";
import settings from "./settings";

type ShareRefs = { [key: string]: HTMLDivElement };

const Videochat = (props: { slug: string; JWT: string; userName: string }) => {
  const session = props.slug;
  const userName = props.userName;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const [isVideoMuted, setIsVideoMuted] = useState(!client.current.getCurrentUserInfo()?.bVideoOn);
  const [isAudioMuted, setIsAudioMuted] = useState(client.current.getCurrentUserInfo()?.muted ?? true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const activeUsersRef = useRef<number[]>([]);
  const shareVideoCanvasRefs = useRef<ShareRefs>({});
  const sessionState = useRef<boolean>(false);

  useEffect(() => {
    joinSession();
  });

  const joinSession = async () => {
    if (sessionState.current) {
      return;
    }
    sessionState.current = true;
    if(inSession)
      return;
    await client.current.init("en-US", "Global", { patchJsMedia: true, leaveOnPageUnload: true });
    console.log("after init");
    client.current.on("peer-video-state-change", renderVideo);
    console.log("before join");
    await client.current.join(session, jwt, userName)
      .catch((e) => console.log(e));
    console.log("after join");
    setInSession(true);
    console.log("after setInSession");
    const mediaStream = client.current.getMediaStream();
    console.log("after getMediaStream");
    setTimeout(async () => {
      console.log("before startAudio");
      await mediaStream.startAudio();
      console.log("after startAudio");
      setIsAudioMuted(mediaStream.isAudioMuted());
      console.log("before startVideo");
      await mediaStream.startVideo();
      console.log("after startVideo");
      console.log("after active-share-change");
      setIsVideoMuted(!mediaStream.isCapturingVideo());
      console.log("before renderVideo");
      await addAlreadyActiveUsers();
      await renderVideo({ action: "Start", userId: client.current.getCurrentUserInfo().userId });
      console.log("after renderVideo");
    }, 2000);
  };

  const addAlreadyActiveUsers = async () => {
    client.current.getAllUser().forEach(async (user) => {
      console.log(`renderVideo: ${user.userId}`);
      await renderVideo({ action: user.sharerOn ? "Start" : "Stop", userId: user.userId });
    });
  }

  const getUserName = (userId: number) => {
    return client.current.getAllUser().find(user => user.userId === userId)?.displayName;
  }

  const addShareVideoDisplay = (userId: number) => {
    const userName = getUserName(userId);
    if(!userName)
      return;
    const div = document.createElement('div');
    const iframe = document.createElement('iframe');
    iframe.src = `${settings.serviceUrl}/receive/${getUserName(userId)}`;
    div.appendChild(iframe);
    shareVideoCanvasRefs.current[userName] = div;
    videoContainerRef.current!.appendChild(div);
  }

  const removeShareVideoDisplay = (userId: number) => {
    const userName = getUserName(userId);
    if(!userName)
      return;
    shareVideoCanvasRefs.current[userName]?.remove();
    delete shareVideoCanvasRefs.current[userName];
  }

  const renderVideo = async (event: { action: "Start" | "Stop"; userId: number; }) => {
    const mediaStream = client.current.getMediaStream();
    if (event.action === "Stop") {
      if(!activeUsersRef.current.includes(event.userId))
        return;
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element) ? element.forEach((el) => el?.remove()) : element?.remove();
      removeShareVideoDisplay(event.userId);
      activeUsersRef.current = activeUsersRef.current.filter(id => id !== event.userId);
    } else {
      if (activeUsersRef.current.includes(event.userId))
        return;
      if (shareVideoCanvasRefs.current[getUserName(event.userId) ?? ''])
        return;
      activeUsersRef.current.push(event.userId);
      console.log(`Added ${event.userId} to shownUsers`);
      const userVideo = await mediaStream.attachVideo(event.userId, VideoQuality.Video_360P);
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
      if(event.userId !== client.current.getCurrentUserInfo().userId)
        addShareVideoDisplay(event.userId);
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
      <iframe style={{ position: "absolute", top: 0, left: 0, width: "100px", height: "100px" }} src={`${settings.serviceUrl}/broadcast/${userName}`}></iframe>
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
      {!inSession ? (
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
            {/* <Button onClick={startSharing} title="start sharing">
              <ScreenShare />
            </Button> */}
            <Button onClick={leaveSession} title="leave session">
              <PhoneOff />
            </Button>
          </div>
        </div>
      )}
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
