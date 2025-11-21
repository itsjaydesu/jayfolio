import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Define viewports
        viewports = {
            'desktop': {'width': 1920, 'height': 1080},
            'tablet': {'width': 768, 'height': 1024},
            'mobile': {'width': 375, 'height': 667}
        }

        # Ensure verification directory exists
        os.makedirs('verification', exist_ok=True)

        for name, size in viewports.items():
            context = await browser.new_context(viewport=size)
            page = await context.new_page()

            # Test Root Projects Page
            print(f"Testing Root Projects Page on {name}...")
            try:
                await page.goto("http://localhost:3000/projects")
                await page.wait_for_load_state('networkidle')
                # Wait for is-loaded class if possible, else just wait
                try:
                    await page.wait_for_selector('.channel.is-loaded', timeout=5000)
                except:
                    print("Wait for .is-loaded timed out, proceeding...")

                await page.wait_for_timeout(3000)
                await page.screenshot(path=f"verification/projects_root_{name}.png", full_page=True)
            except Exception as e:
                print(f"Error testing root page on {name}: {e}")

            # Test Subproject Page (Gen Z Translator)
            print(f"Testing Subproject Page on {name}...")
            try:
                await page.goto("http://localhost:3000/projects/genz-annoyer")
                await page.wait_for_load_state('networkidle')

                # Wait for detail stage to be visible
                try:
                    await page.wait_for_selector('.detail-stage.is-visible', timeout=5000)
                except:
                    print("Wait for .detail-stage.is-visible timed out, proceeding...")

                await page.wait_for_timeout(3000)
                await page.screenshot(path=f"verification/projects_sub_{name}.png", full_page=True)
            except Exception as e:
                print(f"Error testing subproject page on {name}: {e}")

            await context.close()

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
