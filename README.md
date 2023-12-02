# Marriage Registrar Data Scraper

![Scraper Demo](screenshots/run_index.png)

## Introduction

This repository contains scripts to scrape marriage registrar data from the [Bangladesh Marriage Registrar](https://marriage.gov.bd/) website. The data is collected using Puppeteer, a Node library which provides a high-level API to control headless browsers.

## Prerequisites

Before running the scripts, ensure that you have Node.js and npm installed on your machine.

```bash
# Install dependencies
npm install

# Get Full list/Muslim Registrar/Hindu Registrar List
node index.mjs

# Get City Corporation Marriage Registrar List
node city.mjs