import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "wordmark" | "mark";
  className?: string;
  priority?: boolean;
  alt?: string;
};

const ASSETS = {
  wordmark: {
    src: "/images/brand/chemspace-logo.png",
    width: 1987,
    height: 580,
  },
  mark: {
    src: "/images/brand/chemspace-mark.png",
    width: 512,
    height: 512,
  },
} as const;

export default function BrandLogo({
  variant = "wordmark",
  className,
  priority = false,
  alt = "ChemSpace",
}: BrandLogoProps) {
  const asset = ASSETS[variant];

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={alt}
      priority={priority}
      className={cn("select-none object-contain", className)}
    />
  );
}
