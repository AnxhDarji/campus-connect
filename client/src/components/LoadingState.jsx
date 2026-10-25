export default function LoadingState({
  message = "Loading CampusConnect...",
  size = 48,
  fullScreen = false,
  className = "",
}) {
  const layoutClass = fullScreen
    ? "cc-loading-state-fullscreen"
    : size <= 36 ? "cc-loading-state-inline" : "cc-loading-state-page";

  return (
    <div
      className={`cc-loading-state ${layoutClass} ${className}`}
      role="status"
      aria-label={message}
    >
      <img
        className="cc-loading-logo"
        src="/CampusConnect_logo.png"
        alt="CampusConnect"
        width={size}
        height={size}
        style={{ width: size, height: "auto" }}
        draggable="false"
      />
      <span className="cc-loading-message">{message}</span>
      <span className="cc-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
