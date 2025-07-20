import DopplerSDK from '@dopplerhq/node-sdk'
import 'dotenv/config'

let doppler = null;
let loaded = false;

export async function getDopplerClient() {
  if (!doppler) {
    doppler = new DopplerSDK({
      accessToken: process.env.DOPPLER_KEY,
    });
  }

  if (!loaded) {
    const secrets = await doppler.secrets.list('bot', 'prd');

    // Inject into process.env
    Object.entries(secrets.secrets).forEach(([key, value]) => {
        process.env[key] = value.raw;
      });      

    loaded = true;
  }

  return doppler;
}
