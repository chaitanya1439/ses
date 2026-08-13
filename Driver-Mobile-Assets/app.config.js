const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

const DEFAULT_GOOGLE_MAPS_API_KEY = 'AIzaSyCleomJ-Z8Dalf54g7ApfjzIsSP6_Z_ats';
const DEFAULT_GOOGLE_SERVICES_FILE = './google-services.json';

function resolveGoogleServicesFile() {
  const googleServicesFile =
    process.env.DRIVER_GOOGLE_SERVICES_FILE ||
    process.env.GOOGLE_SERVICES_FILE ||
    DEFAULT_GOOGLE_SERVICES_FILE;

  const googleServicesJson =
    process.env.DRIVER_GOOGLE_SERVICES_JSON ||
    process.env.GOOGLE_SERVICES_JSON;

  if (!googleServicesJson) {
    return googleServicesFile;
  }

  const generatedDir = path.join(__dirname, '.expo');
  const generatedFile = path.join(generatedDir, 'google-services.generated.json');

  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(generatedFile, googleServicesJson);

  return './.expo/google-services.generated.json';
}

module.exports = () => {
  const expo = appJson.expo;

  return {
    ...expo,
    extra: {
      ...expo.extra,
      eas: {
        projectId: "04044752-9181-4d0d-9b58-7e3e3105b8b1",
        ...expo.extra?.eas,
      },
    },
    android: {
      ...expo.android,
      googleServicesFile: resolveGoogleServicesFile(),
      config: {
        ...expo.android?.config,
        googleMaps: {
          apiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
            expo.android?.config?.googleMaps?.apiKey ||
            DEFAULT_GOOGLE_MAPS_API_KEY,
        },
      },
    },
  };
};
