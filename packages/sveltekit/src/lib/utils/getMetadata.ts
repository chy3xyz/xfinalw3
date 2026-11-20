import { browser } from "$app/env";
import { PUBLIC_APP_URL } from "$app/env/public";

// For SvelteKit, metadata is handled differently than Next.js
// This is a utility function that can be used in +page.ts or +layout.ts files
// to set page metadata using SvelteKit's metadata API

// Resolved lazily: dynamic public env is populated at server start, not at module eval.
const getBaseUrl = () =>
  browser ? window.location.origin : PUBLIC_APP_URL || "http://localhost:5173";

const titleTemplate = "%s | W3Final Scaffold 2";

export type MetadataOptions = {
  title: string;
  description: string;
  imageRelativePath?: string;
};

export const getMetadata = ({
  title,
  description,
  imageRelativePath = "/thumbnail.jpg",
}: MetadataOptions) => {
  const imageUrl = `${getBaseUrl()}${imageRelativePath}`;

  return {
    title: titleTemplate.replace("%s", title),
    description: description,
    openGraph: {
      title: titleTemplate.replace("%s", title),
      description: description,
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    twitter: {
      title: titleTemplate.replace("%s", title),
      description: description,
      images: [imageUrl],
    },
    icons: {
      icon: [
        {
          url: "/favicon.png",
          sizes: "32x32",
          type: "image/png",
        },
      ],
    },
  };
};
