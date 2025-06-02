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

const Videochat = (props: { slug: string; JWT: string; userName: string }) => {
  const session = props.slug;
  const jwt = props.JWT;
  const userName = props.userName;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const videoContainerRef = useRef<HTMLVideoElement>(null);
  const sessionState = useRef<boolean>(false);

  useEffect(() => {
    joinSession();
  });

  const joinSession = async () => {
    if (sessionState.current) {
      return;
    }
    sessionState.current = true;
    await client.current.init("en-US", "Global", { patchJsMedia: true, leaveOnPageUnload: true });
    await client.current.join(session, jwt, userName)
      .catch((e) => console.log(e));
    setInSession(true);
    setTimeout(async () => {
      console.log(`broadcast ${session}: before startSharing`);
      await startSharing();
      console.log(`broadcast ${session}: after startSharing`);
    }, 3000);
  };

  const startSharing = async () => {
    const mediaStream = client.current.getMediaStream();
    await mediaStream.startShareScreen(videoContainerRef.current as HTMLVideoElement);
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      {/* <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: "1" }} src={`http://localhost:3000/call/${userName}`}></iframe> */}
      <video ref={videoContainerRef} style={videoPlayerStyle} />
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
  zIndex: "0",
} as CSSProperties;
