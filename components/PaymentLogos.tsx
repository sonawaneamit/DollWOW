import type { ReactNode } from "react";

type PaymentLogosProps = {
  className?: string;
};

export function PaymentLogos({ className = "" }: PaymentLogosProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <span className="sr-only">Accepted payment methods:</span>
      <ShopPayLogo />
      <VisaLogo />
      <MastercardLogo />
      <AmexLogo />
      <DinersClubLogo />
      <DiscoverLogo />
      <ApplePayLogo />
      <GooglePayLogo />
      <PayPalLogo />
    </div>
  );
}

function LogoWrapper({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="inline-block" role="img" aria-label={label}>
      {children}
    </span>
  );
}

function ShopPayLogo() {
  return (
    <LogoWrapper label="Shop Pay">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#5A31F4"/>
        <path d="M15.5 12.5C15.5 11.12 16.62 10 18 10C19.38 10 20.5 11.12 20.5 12.5V15.5C20.5 16.88 19.38 18 18 18C16.62 18 15.5 16.88 15.5 15.5V12.5Z" fill="white"/>
        <path d="M21.5 12C21.5 10.62 22.62 9.5 24 9.5C25.38 9.5 26.5 10.62 26.5 12V15C26.5 16.38 25.38 17.5 24 17.5C22.62 17.5 21.5 16.38 21.5 15V12Z" fill="white"/>
        <path d="M27.5 13C27.5 11.62 28.62 10.5 30 10.5C31.38 10.5 32.5 11.62 32.5 13V16C32.5 17.38 31.38 18.5 30 18.5C28.62 18.5 27.5 17.38 27.5 16V13Z" fill="white"/>
      </svg>
    </LogoWrapper>
  );
}

function VisaLogo() {
  return (
    <LogoWrapper label="Visa">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#1A1F71"/>
        <path d="M21.5 20L24.5 10H27L24 20H21.5Z" fill="#F7B600"/>
        <path d="M32 10.2L29.3 17.5L28.9 15.5L27.8 11.2C27.7 10.6 27.2 10.2 26.6 10.2H22.1L22 10.5C23 10.8 23.9 11.2 24.7 11.7L27.5 20H30.2L34.7 10.2H32Z" fill="#F7B600"/>
        <path d="M17.5 10L14.5 16.5L14.1 14.2L13 10.8C12.9 10.3 12.5 10 12 10H7.5L7.4 10.3C8.8 10.7 10.1 11.3 11.3 12.1L14.5 20H17.2L22 10H17.5Z" fill="#F7B600"/>
      </svg>
    </LogoWrapper>
  );
}

function MastercardLogo() {
  return (
    <LogoWrapper label="Mastercard">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#000000"/>
        <circle cx="19" cy="15" r="7" fill="#EB001B"/>
        <circle cx="31" cy="15" r="7" fill="#F79E1B"/>
        <path d="M25 9.5C26.5 10.8 27.5 12.8 27.5 15C27.5 17.2 26.5 19.2 25 20.5C23.5 19.2 22.5 17.2 22.5 15C22.5 12.8 23.5 10.8 25 9.5Z" fill="#FF5F00"/>
      </svg>
    </LogoWrapper>
  );
}

function AmexLogo() {
  return (
    <LogoWrapper label="American Express">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#006FCF"/>
        <path d="M12 12H15L16.5 15L18 12H21V18H19V14L17.5 17H15.5L14 14V18H12V12Z" fill="white"/>
        <path d="M22 12H28V13.5H24V14.5H27.5V16H24V17H28V18.5H22V12Z" fill="white"/>
        <path d="M29 12H32L33 13.5L34 12H37L34.5 15L37 18H34L33 16.5L32 18H29L31.5 15L29 12Z" fill="white"/>
      </svg>
    </LogoWrapper>
  );
}

function DinersClubLogo() {
  return (
    <LogoWrapper label="Diners Club">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#0079BE"/>
        <path d="M20 9C16.7 9 14 11.7 14 15C14 18.3 16.7 21 20 21C23.3 21 26 18.3 26 15C26 11.7 23.3 9 20 9ZM20 19C17.8 19 16 17.2 16 15C16 12.8 17.8 11 20 11C22.2 11 24 12.8 24 15C24 17.2 22.2 19 20 19Z" fill="white"/>
        <path d="M30 9C26.7 9 24 11.7 24 15C24 18.3 26.7 21 30 21C33.3 21 36 18.3 36 15C36 11.7 33.3 9 30 9ZM30 19C27.8 19 26 17.2 26 15C26 12.8 27.8 11 30 11C32.2 11 34 12.8 34 15C34 17.2 32.2 19 30 19Z" fill="white"/>
      </svg>
    </LogoWrapper>
  );
}

function DiscoverLogo() {
  return (
    <LogoWrapper label="Discover">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#FF6000"/>
        <ellipse cx="39" cy="24" rx="14" ry="14" fill="#F68121"/>
        <path d="M8 13H10.5C12 13 13 14 13 15.5C13 17 12 18 10.5 18H8V13Z" fill="white"/>
        <path d="M14 13H15.5V18H14V13Z" fill="white"/>
        <path d="M17 16.5C17 15.1 18 14 19.5 14C20.3 14 21 14.4 21.3 15L20.5 15.7C20.3 15.3 19.9 15.2 19.5 15.2C18.6 15.2 18 15.9 18 16.5C18 17.1 18.6 17.8 19.5 17.8C19.9 17.8 20.3 17.6 20.5 17.2L21.3 17.9C21 18.5 20.3 19 19.5 19C18 19 17 17.9 17 16.5Z" fill="white"/>
      </svg>
    </LogoWrapper>
  );
}

function ApplePayLogo() {
  return (
    <LogoWrapper label="Apple Pay">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#000000"/>
        <path d="M15.5 11C15.2 11.5 14.6 11.9 14 11.9C13.9 11.3 14.2 10.7 14.5 10.3C14.8 9.8 15.4 9.5 16 9.5C16 10.1 15.8 10.6 15.5 11Z" fill="white"/>
        <path d="M16 12C15 12 14.3 12.6 13.8 12.6C13.2 12.6 12.6 12 11.7 12C10.6 12 9.5 12.7 9 13.8C8 15.9 8.7 19 10.2 20.8C10.9 21.7 11.7 22.5 12.7 22.5C13.5 22.5 13.9 22 14.9 22C15.9 22 16.2 22.5 17.2 22.5C18.2 22.5 19 21.8 19.7 20.9C20.3 20.1 20.6 19.3 20.7 19.3C20.7 19.3 19 18.6 19 16.7C19 15.1 20.3 14.3 20.4 14.2C19.6 13 18.4 12.9 18 12.9C17.4 12.9 16.7 12 16 12Z" fill="white"/>
        <path d="M25 13H26.5V16H28V13H29.5V18H28V17H26.5V18H25V13Z" fill="white"/>
        <path d="M30.5 13H33.5C34.3 13 35 13.7 35 14.5C35 15.3 34.3 16 33.5 16H32V18H30.5V13ZM32 14.5V15H33C33.3 15 33.5 14.8 33.5 14.5C33.5 14.2 33.3 14 33 14H32V14.5Z" fill="white"/>
        <path d="M36 14.5C36 13.7 36.7 13 37.5 13H39.5C40.3 13 41 13.7 41 14.5V18H39.5V16.5H37.5V18H36V14.5ZM37.5 15V15.5H39.5V14.5H37.5V15Z" fill="white"/>
        <path d="M42 13H44.5L45.5 15.5L46.5 13H49V14.5H47.5V18H46V16L45 18H44L43 16V18H41.5V14.5H40V13H42Z" fill="white"/>
      </svg>
    </LogoWrapper>
  );
}

function GooglePayLogo() {
  return (
    <LogoWrapper label="Google Pay">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="white"/>
        <rect width="50" height="30" rx="4" stroke="#DADCE0" strokeWidth="1"/>
        <path d="M23 15.3V19H21.5V10H25C26 10 26.9 10.4 27.5 11C28.1 11.6 28.5 12.5 28.5 13.5C28.5 14.5 28.1 15.4 27.5 16C26.9 16.6 26 17 25 17H23V15.3ZM23 11.5V15.5H25C25.6 15.5 26.1 15.3 26.5 14.9C26.9 14.5 27 14 27 13.5C27 13 26.9 12.5 26.5 12.1C26.1 11.7 25.6 11.5 25 11.5H23Z" fill="#5F6368"/>
        <path d="M32.5 14C33.9 14 35 15.1 35 16.5V19H33.5V18.5C33 18.9 32.5 19 32 19C30.9 19 30 18.1 30 17C30 15.9 30.9 15 32 15C32.5 15 33 15.2 33.5 15.5V16.5C33.5 15.9 33 15.5 32.5 15.5C31.7 15.5 31 16.2 31 17C31 17.8 31.7 18.5 32.5 18.5C33.3 18.5 34 17.8 34 17V16.5C34 15.7 33.3 15 32.5 15V14Z" fill="#5F6368"/>
        <path d="M36 14H37.5L39.5 17.5L41.5 14H43L40 19.5L38 23H36.5L37.5 21L36 19L35 17.5L36 14Z" fill="#5F6368"/>
        <path d="M15 13C15 11.3 16.3 10 18 10C19 10 19.9 10.4 20.5 11.1L19.4 12.2C19 11.8 18.5 11.6 18 11.6C17.1 11.6 16.5 12.4 16.5 13.3C16.5 14.2 17.1 15 18 15C18.5 15 19 14.8 19.4 14.4V13.5H18V12H21V14.7C20.2 15.5 19.2 16 18 16C16.3 16 15 14.7 15 13Z" fill="#EA4335"/>
        <path d="M12 15C12 13.3 13.3 12 15 12C16.7 12 18 13.3 18 15C18 16.7 16.7 18 15 18C13.3 18 12 16.7 12 15ZM13.5 15C13.5 15.8 14.2 16.5 15 16.5C15.8 16.5 16.5 15.8 16.5 15C16.5 14.2 15.8 13.5 15 13.5C14.2 13.5 13.5 14.2 13.5 15Z" fill="#FBBC04"/>
        <path d="M8 15C8 13.3 9.3 12 11 12C12.7 12 14 13.3 14 15C14 16.7 12.7 18 11 18C9.3 18 8 16.7 8 15ZM9.5 15C9.5 15.8 10.2 16.5 11 16.5C11.8 16.5 12.5 15.8 12.5 15C12.5 14.2 11.8 13.5 11 13.5C10.2 13.5 9.5 14.2 9.5 15Z" fill="#4285F4"/>
      </svg>
    </LogoWrapper>
  );
}

function PayPalLogo() {
  return (
    <LogoWrapper label="PayPal">
      <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect width="50" height="30" rx="4" fill="#003087"/>
        <path d="M19 10H22C24 10 25 11 25 13C25 15 24 16 22 16H20L19 20H17L19 10Z" fill="#009CDE"/>
        <path d="M20.5 13.5H21.5C22.3 13.5 22.8 13 23 12C23 11 22.5 10.5 21.5 10.5H20.5L20 13.5H20.5Z" fill="#012169"/>
        <path d="M24 11H27C29 11 30 12 30 14C30 16 29 17 27 17H25L24 21H22L24 11Z" fill="#009CDE"/>
        <path d="M25.5 14.5H26.5C27.3 14.5 27.8 14 28 13C28 12 27.5 11.5 26.5 11.5H25.5L25 14.5H25.5Z" fill="#012169"/>
      </svg>
    </LogoWrapper>
  );
}
