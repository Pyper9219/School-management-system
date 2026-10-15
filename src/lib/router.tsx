import { useCallback, useEffect, useState } from "react";

function readLocation(): string {
  const raw = window.location.hash.replace(/^#/, "");
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export interface Route {
  /** e.g. "/students/stu-abc" */
  path: string;
  segments: string[];
  query: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export function useRoute(): Route {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onChange = () => setLocation(readLocation());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const next = `#${to.startsWith("/") ? to : `/${to}`}`;
    if (options?.replace) window.history.replaceState(null, "", next);
    else window.location.hash = next;
    setLocation(readLocation());
  }, []);

  const [path = "/", search = ""] = location.split("?");
  const segments = path.split("/").filter(Boolean);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [path]);

  return { path, segments, query: new URLSearchParams(search), navigate };
}

export function Link({
  to,
  children,
  className,
  onClick,
  ref,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  ref?: React.Ref<HTMLAnchorElement>;
}) {
  return (
    <a
      href={`#${to}`}
      className={className}
      ref={ref}
      onClick={() => {
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
