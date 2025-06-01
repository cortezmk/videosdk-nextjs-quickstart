'use client';

import dynamic from "next/dynamic";

type VideochatType = 'normal' | 'broadcast' | 'receive';

// The Videocall component is imported dynamically as it uses the Zoom Video SDK that needs access to the browser environment
const Videochat = dynamic<{ slug: string; JWT: string; userName: string }>(
    () => import("./Videochat"),
    { ssr: false },
);

// The Videocall component is imported dynamically as it uses the Zoom Video SDK that needs access to the browser environment
const Broadcast = dynamic<{ slug: string; JWT: string; userName: string }>(
    () => import("./Broadcast"),
    { ssr: false },
);

// The Videocall component is imported dynamically as it uses the Zoom Video SDK that needs access to the browser environment
const Receive = dynamic<{ slug: string; JWT: string; userName: string }>(
    () => import("./Receive"),
    { ssr: false },
);

export default function VideochatClientWrapper({ slug, JWT, type, userName }: { slug: string; JWT: string; type: VideochatType; userName: string }) {
    return (
        <div>
            {type === 'normal' && <Videochat slug={slug} JWT={JWT} userName={userName} />}
            {type === 'broadcast' && <Broadcast slug={slug} JWT={JWT} userName={userName} />}
            {type === 'receive' && <Receive slug={slug} JWT={JWT} userName={userName} />}
        </div>
        // <Videochat slug={slug} JWT={JWT} />
    );
} 