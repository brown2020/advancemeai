"use client";

import { useEffect, useRef } from "react";
import { logger } from "@/utils/logger";

type PerformanceMetrics = {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  TTI?: number; // Time to Interactive
};

// Define the interface for PerformanceEventTiming
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  startTime: number;
}

/**
 * Hook to monitor and report web vitals and performance metrics
 *
 * @param options Configuration options for the performance monitor
 * @returns void
 */
export function usePerformanceMonitor(
  options: {
    reportToAnalytics?: boolean;
    logMetrics?: boolean;
  } = {}
) {
  const {
    reportToAnalytics = false,
    logMetrics = process.env.NODE_ENV === "development",
  } = options;
  const metricsRef = useRef<PerformanceMetrics>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only run in browser environment with the Performance API
    if (!("performance" in window) || !window.performance?.getEntriesByType) {
      return;
    }

    // Get navigation timing metrics
    const navigationEntries = performance.getEntriesByType("navigation");
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      metricsRef.current.TTFB = navEntry.responseStart;
    }

    // Observer for First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const fcp = entries[0];
        metricsRef.current.FCP = fcp.startTime;
        if (logMetrics) {
          logger.info(`First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
        }
      }
    });

    // Observer for Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metricsRef.current.LCP = lastEntry.startTime;
      if (logMetrics) {
        logger.info(
          `Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`
        );
      }
    });

    // Observer for First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const firstInput = entries[0] as PerformanceEventTiming;
        metricsRef.current.FID =
          firstInput.processingStart - firstInput.startTime;
        if (logMetrics) {
          logger.info(
            `First Input Delay: ${metricsRef.current.FID.toFixed(2)}ms`
          );
        }
      }
    });

    // Observer for Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      metricsRef.current.CLS = clsValue;
      if (logMetrics) {
        logger.info(`Cumulative Layout Shift: ${clsValue.toFixed(3)}`);
      }
    });

    // Start observing
    try {
      fcpObserver.observe({ type: "paint", buffered: true });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      fidObserver.observe({ type: "first-input", buffered: true });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch (error) {
      logger.warn(
        "Performance monitoring not fully supported in this browser",
        error
      );
    }

    // Report metrics when the page is unloaded
    const reportMetrics = () => {
      if (reportToAnalytics) {
        // Send metrics to analytics service
        // This would be implemented based on your analytics provider
        console.log("Reporting metrics to analytics:", metricsRef.current);
      }
    };

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        reportMetrics();
      }
    });

    return () => {
      // Clean up observers
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      window.removeEventListener("visibilitychange", reportMetrics);
    };
  }, [logMetrics, reportToAnalytics]);
}
