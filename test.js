const puppeteer = require('puppeteer');

async function translateAndScreenshot(url, targetLanguage) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the Bengali webpage
  await page.goto(url);

  // Extract the Bengali text content from the webpage
  const bengaliText = await page.evaluate(() => {
    // Replace this selector with the appropriate selector for the Bengali text on the webpage
    const element = document.querySelector('#bengali-text');
    return element ? element.textContent : '';
  });

  // Open Google Translate and input the Bengali text
  await page.goto(`https://translate.google.com/?sl=bn&tl=${targetLanguage}&text=${encodeURIComponent(bengaliText)}`);

  // Wait for the translation to complete (you may need to adjust the wait time)
  await page.waitForTimeout(1000);

  // Take a screenshot of the translated page
  await page.screenshot({ path: 'translated_page.png' });

  // Close the browser
  await browser.close();
}

// Example usage
translateAndScreenshot('https://marriage.gov.bd/nikahregistrar/bivag/1', 'en');
