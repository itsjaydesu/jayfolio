from playwright.sync_api import sync_playwright
import os

def check_responsiveness():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        viewports = [
            {"name": "desktop", "width": 1920, "height": 1080},
            {"name": "tablet", "width": 768, "height": 1024},
            {"name": "mobile", "width": 375, "height": 667},
        ]

        pages_to_test = [
            {"name": "home", "path": "/"},
            {"name": "projects", "path": "/projects"},
        ]

        for viewport in viewports:
            context = browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]})
            page = context.new_page()

            for page_info in pages_to_test:
                url = f"http://localhost:3000{page_info['path']}"
                print(f"Testing {page_info['name']} on {viewport['name']}...")
                try:
                    page.goto(url, wait_until="networkidle")

                    # Check for horizontal overflow
                    overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
                    if overflow:
                        print(f"WARNING: Horizontal overflow detected on {page_info['name']} - {viewport['name']}")

                    screenshot_path = f"verification/{page_info['name']}_{viewport['name']}.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"Screenshot saved to {screenshot_path}")

                except Exception as e:
                    print(f"Error testing {page_info['name']} on {viewport['name']}: {e}")

            context.close()

        browser.close()

if __name__ == "__main__":
    check_responsiveness()
