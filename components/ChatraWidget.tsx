"use client";

import Script from "next/script";

export function ChatraWidget({ chatraId }: { chatraId: string }) {
  const setup = JSON.stringify({
    buttonStyle: "round",
    buttonPosition: "br",
    buttonSize: 56,
    zIndex: 70,
    colors: {
      buttonText: "#ffffff",
      buttonBg: "#b5471f",
      clientBubbleBg: "#f8e8e0",
      agentBubbleBg: "#f5eee9"
    }
  });

  return (
    <Script
      id="chatra-widget"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `window.ChatraSetup=${setup};window.ChatraID=${JSON.stringify(chatraId)};(function(d,w,c){w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};var s=d.createElement('script');s.async=true;s.src='https://call.chatra.io/chatra.js';if(d.head)d.head.appendChild(s);})(document,window,'Chatra');`
      }}
    />
  );
}
