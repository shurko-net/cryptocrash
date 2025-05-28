"use client";

import { AvatarComponent } from "@rainbow-me/rainbowkit";
import { blo } from "blo";

export const BlockieAvatar: AvatarComponent = ({ address, ensImage, size }) => (
  <img
    className="rounded-full"
    src={ensImage || blo(address as `0x${string}`)}
    width={size}
    height={size}
    alt={`${address} avatar`}
  />
);
