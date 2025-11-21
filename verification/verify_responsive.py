
from playwright.sync_api import sync_playwright
import os

def verify_responsive_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Define viewports to test
        viewports = {
            "desktop": {"width": 1920, "height": 1080},
            "laptop": {"width": 1366, "height": 768},
            "tablet": {"width": 768, "height": 1024},
            "mobile": {"width": 375, "height": 667}
        }

        # Ensure verification directory exists
        os.makedirs("verification", exist_ok=True)

        for name, viewport in viewports.items():
            context = browser.new_context(viewport=viewport)
            page = context.new_page()

            # Test Projects Root
            print(f"Testing Projects Root on {name}...")
            page.goto("http://localhost:3000/projects")
            page.wait_for_load_state("networkidle")
            # Wait a bit for any animations
            page.wait_for_timeout(1000)
            page.screenshot(path=f"verification/projects_{name}.png")

            # Test Subproject
            print(f"Testing Subproject on {name}...")
            page.goto("http://localhost:3000/projects/genz-annoyer")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            page.screenshot(path=f"verification/project_detail_{name}.png")

            context.close()

        browser.close()

if __name__ == "__main__":
    verify_responsive_layout()
