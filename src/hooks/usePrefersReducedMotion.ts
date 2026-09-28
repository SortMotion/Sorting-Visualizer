import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** `true` si el sistema pide reducir animaciones (accesibilidad). */
export function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(
        () => typeof window !== "undefined" && window.matchMedia(QUERY).matches
    );

    useEffect(() => {
        const mq = window.matchMedia(QUERY);
        const onChange = () => setReduced(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return reduced;
}
