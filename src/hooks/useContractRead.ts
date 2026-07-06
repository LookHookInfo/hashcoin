import { useState, useEffect, useCallback, useRef } from "react";

const inflightPromises = new Map<string, Promise<unknown>>();

function getKey(fetchFn: () => Promise<unknown>, deps: unknown[]): string {
    return `${fetchFn.toString()}|${deps.map((d) => String(d)).join("|")}`;
}

export function useContractRead<T>({
    fetchFn,
    deps = [],
    enabled = true,
    intervalMs,
}: {
    fetchFn: () => Promise<T>;
    deps?: unknown[];
    enabled?: boolean;
    intervalMs?: number;
}) {
    const [data, setData] = useState<T | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<unknown>(undefined);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();
    const hasDataRef = useRef(false);

    const fetch = useCallback(async () => {
        if (!enabled) return;
        const key = getKey(fetchFn, deps);
        try {
            if (!hasDataRef.current) setIsLoading(true);
            if (!inflightPromises.has(key)) {
                inflightPromises.set(key, fetchFn().finally(() => {
                    inflightPromises.delete(key);
                }));
            }
            const result = await inflightPromises.get(key) as T;
            hasDataRef.current = true;
            setData(result);
            setError(undefined);
        } catch (err) {
            console.error("[useContractRead]", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [enabled, ...deps]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    useEffect(() => {
        if (!enabled) return;

        const start = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (!intervalMs) return;
            intervalRef.current = setInterval(fetch, intervalMs);
        };
        const stop = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
        };
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                fetch();
                start();
            } else {
                stop();
            }
        };
        const onFocus = () => {
            fetch();
            start();
        };

        start();
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);
        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [fetch, enabled, intervalMs]);

    const refetch = useCallback(() => {
        fetch();
    }, [fetch]);

    return { data, isLoading, error, refetch };
}
