import { useEffect, useState } from "react";
import { getAvatarSrc } from "../utils/avatar";

type AvatarImageProps = {
  avatarUrl: string | null;
  name: string;
  className?: string;
};

const avatarRetryDelays = [1000, 2000, 4000];

function AvatarImage({ avatarUrl, name, className = "" }: AvatarImageProps) {
  const baseAvatarSrc = getAvatarSrc(avatarUrl);
  const [retryIndex, setRetryIndex] = useState(0);
  const [loadedAvatarSrc, setLoadedAvatarSrc] = useState("");
  const [isWaitingToRetry, setIsWaitingToRetry] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setRetryIndex(0);
    setLoadedAvatarSrc("");
    setIsWaitingToRetry(false);
    setHasFailed(false);
  }, [baseAvatarSrc]);

  useEffect(() => {
    if (!baseAvatarSrc || loadedAvatarSrc) return;

    let isCancelled = false;
    const separator = baseAvatarSrc.includes("?") ? "&" : "?";
    const avatarSrc =
      retryIndex === 0
        ? baseAvatarSrc
        : `${baseAvatarSrc}${separator}avatarRetry=${retryIndex}`;

    setIsWaitingToRetry(false);

    const image = new Image();

    image.onload = () => {
      if (isCancelled) return;

      setLoadedAvatarSrc(avatarSrc);
    };

    image.onerror = () => {
      if (isCancelled) return;

      if (retryIndex >= avatarRetryDelays.length) {
        setIsWaitingToRetry(false);
        setHasFailed(true);
        return;
      }

      setIsWaitingToRetry(true);
    };

    image.src = avatarSrc;

    return () => {
      isCancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [baseAvatarSrc, loadedAvatarSrc, retryIndex]);

  useEffect(() => {
    if (!isWaitingToRetry) return;
    if (retryIndex >= avatarRetryDelays.length) return;

    const timeout = window.setTimeout(() => {
      setRetryIndex((currentRetryIndex) => currentRetryIndex + 1);
    }, avatarRetryDelays[retryIndex]);

    return () => window.clearTimeout(timeout);
  }, [isWaitingToRetry, retryIndex]);

  if (!baseAvatarSrc || hasFailed) {
    return <>{name.charAt(0).toUpperCase()}</>;
  }

  if (!loadedAvatarSrc) {
    return (
      <span
        aria-label={`Loading ${name}'s avatar`}
        className="h-3 w-3 animate-pulse rounded-full bg-[var(--color-emphasis)]"
      />
    );
  }

  return (
    <img
      src={loadedAvatarSrc}
      alt={`${name}'s avatar`}
      loading="eager"
      decoding="async"
      className={className}
    />
  );
}

export default AvatarImage;
