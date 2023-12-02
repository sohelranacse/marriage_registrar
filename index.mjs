import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import inquirer from 'inquirer';

// List of labeled links
const labeledLinks = [
  { label: 'Full List', url: 'https://marriage.gov.bd/nikahregistrar/bivag/1' },
  { label: 'Muslim Marriage', url: 'https://marriage.gov.bd/nikahregistrar/bivag/2' },
  { label: 'Hindu Marriage', url: 'https://marriage.gov.bd/nikahregistrar/bivag/3' },
];

// Prompt user to select a labeled link
const linkPrompt = await inquirer.prompt([
  {
    type: 'list',
    name: 'selectedLink',
    message: 'Select a link:',
    choices: labeledLinks.map(item => ({ name: `${item.label}: ${item.url}`, value: item.url })),
  },
]);

// Use the selected link
const url = linkPrompt.selectedLink;
// const url = 'https://marriage.gov.bd/nikahregistrar/bivag/2';

// Initial CSV Writer
const selectedLabel = labeledLinks.find(item => item.url === url)?.label;
const csvWriter = createObjectCsvWriter({
  path: `raw_data/${selectedLabel}.csv`,
  header: [
    { id: 'name', title: 'Name' },
    { id: 'address', title: 'Address' },
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
  mobileNumber: 'Mobile Number',
  coverageArea: 'Coverage Area',
  nid: 'NID',
  email: 'Email',
  dateOfBirth: 'Date of Birth',
};
const records = [dataRow];
csvWriter.writeRecords(records);
// Initially Inserted Header Row

const browser = await puppeteer.launch({ headless: "new", defaultViewport: { width: 1366, height: 500 } }); // new, false
const page = await browser.newPage();
await page.goto(url);

// Wait for the select element to be available
await page.waitForSelector('select[name="bivag"]');
const submitButtonSelector = 'input[value="Submit"]';

// Get all the options from the dropdown
const options = await page.evaluate(() => {
  const selectElement = document.querySelector('select[name="bivag"]');
  const optionElements = selectElement.querySelectorAll('option');
  const optionValues = Array.from(optionElements).map(option => option.textContent.trim());
  return optionValues;
});


// Loop through each option
for (const option of options) {
  try {

    // Select the current option
    await page.select('select[name="bivag"]', option);

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

    // Process each link one by one
    for (const link of tableLinks) {

      // Navigate to the link
      const linkNavigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      await page.goto(link, { waitUntil: 'domcontentloaded' });
      await linkNavigationPromise;

      // Check if the page returns a 404 status
      const linkResponse = await page.waitForResponse(response => response.status() === 404, { timeout: 100 }).catch(() => null);

      if (linkResponse) {
        await page.goBack();
        continue;
      }

      // Wait for the table on the linked page to be available
      const linkedTableSelector = 'table';
      const isLinkedTableAvailable = await page.waitForSelector(linkedTableSelector, { timeout: 100 }).then(() => true).catch(() => false);

      if (!isLinkedTableAvailable) {
        await page.goBack();
        continue;
      }

      // Get all links inside the table on the linked page
      const linksOnLinkedPage = await page.evaluate(() => {
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

      for (const linkUnion of linksOnLinkedPage) {

        // Navigate to the link
        const unionLinkNavigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await page.goto(linkUnion, { waitUntil: 'domcontentloaded' });
        await unionLinkNavigationPromise;

        const unionTableSelector = 'table';
        // Check if the page returns a 404 status
        const unionLinkResponse = await page.waitForResponse(response => response.status() === 404, { timeout: 100 }).catch(() => null);

        if (unionLinkResponse) {
          await page.goBack();
          continue;
        }

        // Wait for the table on the linked page to be available
        const isUnionTableAvailable = await page.waitForSelector(unionTableSelector, { timeout: 100 }).then(() => true).catch(() => false);

        if (!isUnionTableAvailable) {
          await page.goBack();
          continue;
        }

        // Get all links inside the table on the union linked page
        const linksOnUnionPage = await page.evaluate(() => {
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

        for (const linkInfo of linksOnUnionPage) {

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

          const rowIndexes = [1, 19, 7, 4, 9, 8, 5];
          const tableElements = await page.evaluate(() => {
            const tableElement = document.querySelector('table');
            const tableRows = tableElement ? tableElement.querySelectorAll('tr') : [];

            return Array.from(tableRows).map(row => Array.from(row.children).map(cell => cell.textContent.trim()));
          });

          const selectedRows = rowIndexes.map(index => tableElements[index].slice(1));

          let name = selectedRows[0][0] || '';
          let address = selectedRows[1][0] || '';
          let mobileNumber = selectedRows[2][0] || '';
          let coverageArea = selectedRows[3][0] || '';
          let nid = selectedRows[4][0] || '';
          let email = selectedRows[5][0] || '';
          let dateOfBirth = selectedRows[6][0] || '';

          // Insert Row
          const dataRow = {
            name,
            address,
            mobileNumber,
            coverageArea,
            nid,
            email,
            dateOfBirth,
          };
          const records = [dataRow];
          await csvWriter.writeRecords(records);
        }
      }
    }

    // Go back to the previous URL
    // await page.goBack();
    await page.goto(url);
    // Wait for the select element to be available again
    await page.waitForSelector('select[name="bivag"]', { timeout: 60000 });

  } catch (error) {
    console.error('An error occurred:', error);
    // Handle the error as needed, e.g., log it, retry, or skip to the next iteration
  }
}

await browser.close();