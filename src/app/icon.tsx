import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const imageBuffer = readFileSync(join(process.cwd(), "public", "image.png"));
  const base64 = `data:image/png;base64,${imageBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={base64}
          width={64}
          height={64}
          style={{
            width: 64,
            height: 64,
            objectFit: "cover",
            borderRadius: "50%",
            clipPath: "circle(50% at 50% 50%)",
          }}
        />
      </div>
    ),
    { width: 64, height: 64 }
  );
}
