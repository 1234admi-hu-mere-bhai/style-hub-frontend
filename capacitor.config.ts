import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muffigout.apparelhub',
  appName: 'MUFFIGOUT APPAREL HUB',
  webDir: 'dist',
  server: {
    url: 'https://815c3faf-a4f0-4284-b88f-4fae0bb52ab7.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
