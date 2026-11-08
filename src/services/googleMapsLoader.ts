export const GOOGLE_MAPS_API_KEY = 'AIzaSyDyPRhU72VW3Ncpiq-9sjWOMB203WYcqoI';

let loadPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(apiKey: string = GOOGLE_MAPS_API_KEY): Promise<typeof google.maps> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          resolve(window.google.maps);
        }
      }, 100);
      return;
    }

    const callbackName = `__initGoogleMaps_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps failed to initialize'));
      }
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,visualization,drawing&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      delete (window as any)[callbackName];
      reject(new Error(`Failed to load Google Maps SDK: ${err}`));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

