import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';

// Initial CSV Writer
const csvWriter = createObjectCsvWriter({
  path: 'raw_data/City_Marriage.csv',
  header: [
    { id: 'name', title: 'Name' },
    { id: 'address', title: 'Address' },
    { id: 'permanentAddress', title: 'PermanentAddress' },
    { id: 'mobileNumber', title: 'Mobile Number' },
    { id: 'coverageArea', title: 'Coverage Area' },
    { id: 'nid', title: 'NID' },
    { id: 'email', title: 'Email' },
    { id: 'dateOfBirth', title: 'Date of Birth' },
  ],
  append: true, // Append to the existing file
  encoding: 'utf-8',
});
const dataRow = {
  name: 'Name',
  address: 'Address',
  permanentAddress: 'PermanentAddress',
  mobileNumber: 'Mobile Number',
  coverageArea: 'Coverage Area',
  nid: 'NID',
  email: 'Email',
  dateOfBirth: 'Date of Birth',
};
const records = [dataRow];
csvWriter.writeRecords(records);
// Initially Inserted Header Row

const url = 'https://marriage.gov.bd/nikahregistrar/city';
const browser = await puppeteer.launch({ headless: "new", defaultViewport: { width: 1366, height: 500 } }); // new, false
const page = await browser.newPage();
await page.goto(url);

// Wait for the select element to be available
await page.waitForSelector('select[name="city"]');
const submitButtonSelector = 'input[value="Submit"]';

// Get all the options from the dropdown
const options = await page.evaluate(() => {
  const selectElement = document.querySelector('select[name="city"]');
  const optionElements = selectElement.querySelectorAll('option');
  const optionValues = Array.from(optionElements).map(option => option.textContent.trim());
  return optionValues;
});


// Loop through each option
for (const option of options) {
  try {

    // Select the current option
    await page.select('select[name="city"]', option);

    // Click the submit button to open a new page in the same tab
    const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await page.click(submitButtonSelector);
    await navigationPromise;

    // Check if the page returns a 404 status
    const response = await page.waitForResponse(response => response.status() === 404, { timeout: 100 }).catch(() => null);

    if (response) {
      await page.goBack();
      continue;
    }

    // Wait for the table to be available
    const tableSelector = 'table';
    await page.waitForSelector(tableSelector);

    // Get all links inside the table on the current page
    const tableLinks = await page.evaluate(() => {
      const tableRows = document.querySelectorAll('table tr');
      const links = [];
      for (const row of tableRows) {
        const linkElement = row.querySelector('td a');
        if (linkElement) {
          links.push(linkElement.href);
        }
      }
      return links;
    });

    for (const linkInfo of tableLinks) {

      // Navigate to the link
      const infoLinkNavigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      await page.goto(linkInfo, { waitUntil: 'domcontentloaded' });
      await infoLinkNavigationPromise;


      const infoTableSelector = 'table';
      // Check if the page returns a 404 status
      const infoLinkResponse = await page.waitForResponse(response => response.status() === 404, { timeout: 100 }).catch(() => null);

      if (infoLinkResponse) {
        await page.goBack();
        continue;
      }

      // Wait for the table on the linked page to be available
      const isinfoTableAvailable = await page.waitForSelector(infoTableSelector, { timeout: 100 }).then(() => true).catch(() => false);

      if (!isinfoTableAvailable) {
        await page.goBack();
        continue;
      }

      const rowIndexes = [1, 19, 18, 7, 4, 9, 8, 5];
      const tableElements = await page.evaluate(() => {
        const tableElement = document.querySelector('table');
        const tableRows = tableElement ? tableElement.querySelectorAll('tr') : [];

        return Array.from(tableRows).map(row => Array.from(row.children).map(cell => cell.textContent.trim()));
      });

      const selectedRows = rowIndexes.map(index => tableElements[index].slice(1));

      let name = selectedRows[0][0] || '';
      let address = selectedRows[1][0] || '';
      let permanentAddress = selectedRows[2][0] || '';
      let mobileNumber = selectedRows[3][0] || '';
      let coverageArea = selectedRows[4][0] || '';
      let nid = selectedRows[5][0] || '';
      let email = selectedRows[6][0] || '';
      let dateOfBirth = selectedRows[7][0] || '';

      // Insert Row
      const dataRow = {
        name,
        address,
        permanentAddress,
        mobileNumber,
        coverageArea,
        nid,
        email,
        dateOfBirth,
      };
      const records = [dataRow];
      await csvWriter.writeRecords(records);
    }


    // Go back to the previous URL
    // await page.goBack();
    await page.goto(url);
    // Wait for the select element to be available again
    await page.waitForSelector('select[name="city"]', { timeout: 60000 });

  } catch (error) {
    console.error('An error occurred:', error);
    // Handle the error as needed, e.g., log it, retry, or skip to the next iteration
  }
}

await browser.close();