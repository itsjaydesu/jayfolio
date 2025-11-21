import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)

    viewports = {
        "desktop": {"width": 1920, "height": 1080},
        "tablet": {"width": 768, "height": 1024},
        "mobile": {"width": 375, "height": 667},
        "small_mobile": {"width": 320, "height": 568}
    }

    pages_to_test = [
        {"name": "home", "url": "http://localhost:3000/"},
        {"name": "projects", "url": "http://localhost:3000/projects"},
        # Assuming signal-grid exists, if not we might get 404 but screenshot will show it
        {"name": "project_detail", "url": "http://localhost:3000/projects/signal-grid"}
    ]

    for vp_name, vp_size in viewports.items():
        context = browser.new_context(viewport=vp_size)
        page = context.new_page()

        for p in pages_to_test:
            try:
                print(f"Testing {p['name']} on {vp_name}...")
                page.goto(p["url"], wait_until="networkidle")
                # Wait a bit for animations
                time.sleep(2)

                screenshot_path = f"verification/{p['name']}_{vp_name}.png"
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"Saved {screenshot_path}")
            except Exception as e:
                print(f"Error testing {p['name']} on {vp_name}: {e}")

        context.close()

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
