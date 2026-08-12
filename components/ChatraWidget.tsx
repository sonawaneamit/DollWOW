"use client";

import Script from "next/script";
import { MessageCircle } from "lucide-react";

export function ChatraWidget({ chatraId }: { chatraId: string }) {
  const setup = JSON.stringify({
    buttonStyle: "tab",
    zIndex: 70,
    colors: {
      buttonText: "#ffffff",
      buttonBg: "#b5471f",
      clientBubbleBg: "#f8e8e0",
      agentBubbleBg: "#f5eee9"
    }
  });

  return (
    <>
      <button type="button" className="chatra-mobile-launcher" aria-label="Open live chat with DollWow">
        <MessageCircle aria-hidden="true" />
        Chat with DollWow
      </button>
      <Script
        id="chatra-widget"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.ChatraSetup=Object.assign(${setup},window.innerWidth<1024?{customWidgetButton:'.chatra-mobile-launcher'}:{buttonPosition:'br'});window.ChatraID=${JSON.stringify(chatraId)};(function(d,w,c){w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};var s=d.createElement('script');s.async=true;s.src='https://call.chatra.io/chatra.js';if(d.head)d.head.appendChild(s);})(document,window,'Chatra');`
        }}
      />
    </>
  );
}
