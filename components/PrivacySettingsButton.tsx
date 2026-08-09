"use client";

export function PrivacySettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("dollwow:manage-consent"))}
      className="flex min-h-11 items-center text-left text-[15px] text-text-dim transition-colors hover:text-accent"
    >
      Manage privacy settings
    </button>
  );
}
