"use client";

import { CSSProperties, useRef, useState, useEffect } from "react";
import ZoomVideo, {
  type VideoClient
} from "@zoom/videosdk";


const Videochat = (props: { slug: string; JWT: string; userName: string }) => {
  const session = props.slug;
  const userName = props.userName;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const shareVideoCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    joinSession();
  });

  const joinSession = async () => {
    if(inSession)
      return;
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    console.log(`receive ${session}: after init`);
    console.log(`receive ${session}: before join`);
    await client.current.join(session, jwt, userName)
      .catch((e) => console.log(e));
    console.log(`receive ${session}: after join`);
    setInSession(true);
    console.log(`receive ${session}: after setInSession`);
    setTimeout(async () => {
      client.current.on('active-share-change', renderShareVideo);
      console.log(`receive ${session}: after active-share-change`);
    }, 2000);
  };

  const renderShareVideo = async (payload: { state: "Active" | "Inactive"; userId: number; }) => {
    const mediaStream = client.current.getMediaStream();
    if (payload.state === 'Active') {
      mediaStream.startShareView(
        shareVideoCanvasRef.current as HTMLCanvasElement,
        payload.userId
      )
    } else if (payload.state === 'Inactive') {
      mediaStream.stopShareView()
    }
  }

  const leaveSession = async () => {
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    window.location.href = "/";
  };

  return (
    <div style={inSession ? { width: "100%", height: "100%" } : { display: "none" }}>
      <canvas style={{ width: "100%", height: "100%" }} ref={shareVideoCanvasRef} />
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
