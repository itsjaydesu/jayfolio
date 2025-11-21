
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Define viewports
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 },
    wide: { width: 1920, height: 1080 }
  };

  try {
    // Navigate to the projects page
    await page.goto('http://localhost:3000/projects');

    // Wait for content to load
    await page.waitForSelector('.channel__grid');

    // Take screenshots for each viewport
    for (const [name, viewport] of Object.entries(viewports)) {
      await page.setViewportSize(viewport);
      // Wait a bit for any responsive adjustments
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `verification/projects_${name}.png`, fullPage: true });
      console.log(`Captured ${name} screenshot`);
    }

    // Find a project to click on
    const projectLink = await page.$('.project-entry__overlay');
    if (projectLink) {
        const href = await projectLink.getAttribute('href');
        console.log(`Navigating to project: ${href}`);
        await page.goto(`http://localhost:3000${href}`);
        await page.waitForTimeout(2000); // Wait for navigation and load

        // Take screenshots of the project detail page
        for (const [name, viewport] of Object.entries(viewports)) {
            await page.setViewportSize(viewport);
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `verification/project_detail_${name}.png`, fullPage: true });
            console.log(`Captured ${name} project detail screenshot`);
        }
    } else {
        console.log('No project link found to click');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();
