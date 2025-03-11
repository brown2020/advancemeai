"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { logger } from "@/utils/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                <p>
                  We&apos;re sorry, but an error occurred while rendering this
                  page.
                </p>
              </div>
            </div>
            {this.state.error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-300 font-mono overflow-auto">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="mt-6 flex justify-center">
              <Button onClick={this.handleReset}>Try Again</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
