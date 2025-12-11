/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "fframess",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    // Pass server-only env safely
    new sst.aws.Nextjs("fframess-frontend", {
      environment: {
        NEXT_STRIPE_SECRET_KEY: process.env.NEXT_STRIPE_SECRET_KEY!,
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL!,
      },
    });
  },
});
