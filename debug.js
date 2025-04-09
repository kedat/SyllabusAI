// Simple script to help debug the React app
import puppeteer from 'puppeteer';

async function debugApp() {
  console.log('Launching browser to debug the React app...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logs from the browser to be printed to our console
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Navigate to the local app
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
    console.log('Page loaded');
    
    // Get page content
    const content = await page.content();
    console.log('Page title:', await page.title());
    
    // Check if there's an error message in the page
    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector('.error-message');
      return errorElement ? errorElement.textContent : 'No specific error element found';
    });
    
    console.log('Error message on page:', errorMessage);
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('Screenshot taken: debug-screenshot.png');
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

debugApp().catch(console.error);