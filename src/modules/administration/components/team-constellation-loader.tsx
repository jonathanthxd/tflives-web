"use client";

import dynamic from "next/dynamic";

// Keep the constellation's CSS and renderer behind its actual presence in the
// server-rendered team section. A page without members needs neither resource.
export default dynamic(() => import("./team-constellation"));
