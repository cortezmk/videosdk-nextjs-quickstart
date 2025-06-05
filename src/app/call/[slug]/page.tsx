import { getData } from "@/data/getToken";
import VideochatClientWrapper from "@/components/VideochatClientWrapper";
import Script from "next/script";

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const jwt = await getData('main-session');
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      {/* this component is defined separately as it imports the ZoomSDK and needs to be a client component */}
      <VideochatClientWrapper slug={params.slug} JWT={jwt} />
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
    </main>
  );
} 
