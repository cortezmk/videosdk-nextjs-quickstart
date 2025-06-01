'use client';

import dynamic from "next/dynamic";

type VideochatType = 'normal' | 'broadcast' | 'receive';

// The Videocall component is imported dynamically as it uses the Zoom Video SDK that needs access to the browser environment
const Videochat = dynamic<{ slug: string; JWT: string; mode?: 'broadcast' | 'receive' }>(
    () => import("./Videochat"),
    { ssr: false },
);

// The Videocall component is imported dynamically as it uses the Zoom Video SDK that needs access to the browser environment
const Broadcast = dynamic<{ slug: string; JWT: string }>(
    () => import("./Broadcast"),
    { ssr: false },
);

// The Videocall component is imported dynamically as it uses the Zoom Video SDK that needs access to the browser environment
const Receive = dynamic<{ slug: string; JWT: string }>(
    () => import("./Receive"),
    { ssr: false },
);

export default function VideochatClientWrapper({ slug, JWT, type, mode }: { slug: string; JWT: string; type: VideochatType; mode?: 'broadcast' | 'receive' }) {
    return (
        <div>
            {type === 'normal' && <Videochat slug={slug} JWT={JWT} mode={mode} />}
            {type === 'broadcast' && <Broadcast slug={slug} JWT={JWT} />}
            {type === 'receive' && <Receive slug={slug} JWT={JWT} />}
        </div>
        // <Videochat slug={slug} JWT={JWT} />
    );
} 