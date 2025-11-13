"use client";

import { Suspense } from "react";
import MarketsContent from "./MarketsContent";

export default function MarketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cosmic-dark relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cosmic-purple"></div>
          <p className="text-text-muted mt-4">Loading markets...</p>
        </div>
      </div>
    }>
      <MarketsContent />
    </Suspense>
  );
}