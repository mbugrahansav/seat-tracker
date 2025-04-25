import puppeteer, { Browser, LaunchOptions } from 'puppeteer-core';

let browserInstance: Browser | null = null;

export const getBrowser = async (options?: LaunchOptions): Promise<Browser> => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...options,
    });
  } else if (options && options.headless === false) {
    console.warn('[browserManager] Uyarı: browser zaten açık. Headless=false isteği göz ardı edildi.');
  }

  return browserInstance;
};

export const closeBrowser = async () => {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
};
