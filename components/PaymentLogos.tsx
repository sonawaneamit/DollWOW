export function PaymentLogos({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-wrap items-center justify-center gap-2" : "flex flex-wrap items-center gap-3"}>
      <span className="text-xs font-medium text-text-dim">We accept:</span>
      <div className="flex flex-wrap items-center gap-2">
        {/* Visa */}
        <svg className="h-6 opacity-70" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="white"/>
          <path d="M20.5 11.5L18 20.5H15.5L17.8 11.5H20.5ZM28 16.2C28 14.5 25.5 14.4 25.5 13.7C25.5 13.4 25.8 13.1 26.5 13C26.9 13 27.7 13.1 28.4 13.5L28.9 11.7C28.2 11.4 27.4 11.2 26.4 11.2C24 11.2 22.3 12.5 22.3 14.4C22.3 15.8 23.5 16.6 24.4 17C25.3 17.5 25.6 17.8 25.6 18.2C25.6 18.8 24.9 19.1 24.2 19.1C23.2 19.1 22.7 18.9 21.9 18.5L21.4 20.4C22.2 20.7 22.9 20.9 24.2 20.9C26.8 20.9 28.5 19.6 28.5 17.6C28 16.2 28 16.2 28 16.2ZM35.5 20.5H33.5L31.8 11.5H29.5C29 11.5 28.6 11.8 28.4 12.2L25 20.5H27.5L28 19H31L31.3 20.5H35.5ZM29.6 14.2L30.5 17.2H28.6L29.6 14.2ZM23.5 11.5L21.5 20.5H19L21 11.5H23.5Z" fill="#1434CB"/>
        </svg>
        {/* Mastercard */}
        <svg className="h-6 opacity-70" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="white"/>
          <circle cx="18" cy="16" r="7" fill="#EB001B"/>
          <circle cx="30" cy="16" r="7" fill="#F79E1B"/>
          <path d="M24 10.5C22.5 11.8 21.5 13.8 21.5 16C21.5 18.2 22.5 20.2 24 21.5C25.5 20.2 26.5 18.2 26.5 16C26.5 13.8 25.5 11.8 24 10.5Z" fill="#FF5F00"/>
        </svg>
        {/* Amex */}
        <svg className="h-6 opacity-70" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="#006FCF"/>
          <path d="M12 14.5L10.5 11H8.5L11 16V19H13V16L15.5 11H13.5L12 14.5ZM20 11H16V19H20C21.7 19 23 17.7 23 16V14C23 12.3 21.7 11 20 11ZM21 16C21 16.6 20.6 17 20 17H18V13H20C20.6 13 21 13.4 21 14V16ZM28 15H25V13H28V11H23V19H28V17H25V16H28V15ZM35 13H32L31 11H29L30 13H27V15H30.5L32 17H35V19H37V17L38 15H37.5L36 13V11H35V13Z" fill="white"/>
        </svg>
        {/* Discover */}
        <svg className="h-6 opacity-70" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="white"/>
          <path d="M30 10H48V22C44 22 40 22 36 22C36 18 36 14 36 10H30Z" fill="#FF6000"/>
          <circle cx="38" cy="16" r="6" fill="#FF6000"/>
        </svg>
      </div>
    </div>
  );
}
