#!/usr/bin/env python3
"""
Playwright-based scraper for JavaScript-heavy websites
Handles dynamic content loading and modern web apps
"""

import asyncio
import os
import re
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
import json

class PlaywrightScraper:
    def __init__(self, base_url, output_dir):
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.downloaded_assets = set()
        self.failed_downloads = []
        
    def download_asset(self, url, local_path, retries=3):
        """Download an asset with retry logic"""
        if url in self.downloaded_assets:
            return True
            
        for attempt in range(retries):
            try:
                print(f"Downloading ({attempt+1}/{retries}): {url}")
                response = self.session.get(url, timeout=60, stream=True)
                response.raise_for_status()
                
                local_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                self.downloaded_assets.add(url)
                print(f"✓ Saved: {local_path}")
                time.sleep(0.3)
                return True
                
            except Exception as e:
                print(f"✗ Attempt {attempt+1} failed for {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    self.failed_downloads.append((url, str(e)))
                    
        return False
    
    async def scrape_with_browser(self):
        """Use browser automation to discover assets"""
        try:
            # Try to import playwright
            from playwright.async_api import async_playwright
        except ImportError:
            print("❌ Playwright not installed. Install with: pip install playwright")
            print("   Then run: playwright install")
            return await self.fallback_scraping()
        
        print("🎭 Starting Playwright browser scraping...")
        
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            # Track network requests
            network_requests = []
            
            def handle_request(request):
                url = request.url
                if any(ext in url.lower() for ext in ['.css', '.js', '.mp4', '.webp', '.jpg', '.png', '.woff', '.svg']):
                    network_requests.append(url)
            
            page = await context.new_page()
            page.on("request", handle_request)
            
            # Get list of pages to visit
            pages_to_visit = [
                self.base_url,
                f"{self.base_url}/work",
                f"{self.base_url}/about", 
                f"{self.base_url}/contact",
                f"{self.base_url}/archive"
            ]
            
            # Add project pages
            try:
                with open(self.output_dir / 'work.html', 'r') as f:
                    work_content = f.read()
                project_urls = re.findall(r'href="(/work/[^"]+)"', work_content)
                for project_url in project_urls:
                    pages_to_visit.append(f"{self.base_url}{project_url}")
            except:
                pass
            
            # Visit each page and let JavaScript load
            for page_url in pages_to_visit:
                try:
                    print(f"🔍 Visiting: {page_url}")
                    await page.goto(page_url, wait_until='networkidle', timeout=30000)
                    
                    # Wait a bit more for lazy loading
                    await page.wait_for_timeout(3000)
                    
                    # Scroll to trigger lazy loading
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(2000)
                    
                    # Get page content after JS execution
                    content = await page.content()
                    
                    # Extract additional assets from rendered content
                    await self.extract_assets_from_rendered_content(content, network_requests)
                    
                except Exception as e:
                    print(f"❌ Error visiting {page_url}: {e}")
            
            await browser.close()
            
            # Download discovered assets
            print(f"🎯 Found {len(set(network_requests))} network requests")
            return await self.download_discovered_assets(set(network_requests))
    
    async def extract_assets_from_rendered_content(self, content, network_requests):
        """Extract assets from rendered HTML content"""
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find all asset references
        for link in soup.find_all('link', href=True):
            href = link['href']
            if href.startswith(('http', '/')):
                network_requests.append(href)
        
        for script in soup.find_all('script', src=True):
            src = script['src']
            if src.startswith(('http', '/')):
                network_requests.append(src)
        
        for img in soup.find_all('img', src=True):
            src = img['src']
            if src.startswith(('http', '/')):
                network_requests.append(src)
    
    async def download_discovered_assets(self, asset_urls):
        """Download all discovered assets"""
        downloaded = 0
        skipped = 0
        
        for url in asset_urls:
            # Convert to full URL
            if url.startswith('/'):
                full_url = urljoin(self.base_url, url)
            else:
                full_url = url
            
            # Skip if not from our domains
            parsed = urlparse(full_url)
            if parsed.netloc not in ['lo2s.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'd2csodhem33bqt.cloudfront.net']:
                continue
            
            # Get local path
            local_path = self.get_local_path(url)
            
            # Skip if already exists
            if local_path.exists() and local_path.stat().st_size > 0:
                skipped += 1
                continue
            
            # Download
            if self.download_asset(full_url, local_path):
                downloaded += 1
        
        return downloaded, skipped, len(self.failed_downloads)
    
    def get_local_path(self, url):
        """Convert URL to local file path"""
        parsed = urlparse(url)
        
        if parsed.netloc:
            path = Path(parsed.netloc) / parsed.path.lstrip('/')
        else:
            path = Path(parsed.path.lstrip('/'))
        
        # Handle query parameters
        if parsed.query:
            path = path.with_name(path.stem + path.suffix)
        
        return self.output_dir / path
    
    async def fallback_scraping(self):
        """Fallback to requests-based scraping if Playwright not available"""
        print("🔄 Falling back to requests-based scraping...")
        
        from advanced_asset_scraper import AdvancedAssetScraper
        scraper = AdvancedAssetScraper(self.base_url, self.output_dir)
        return scraper.scan_and_download_missing_assets()
    
    async def run(self):
        """Main entry point"""
        try:
            return await self.scrape_with_browser()
        except Exception as e:
            print(f"❌ Browser scraping failed: {e}")
            return await self.fallback_scraping()

def main():
    """Run the scraper"""
    scraper = PlaywrightScraper("https://lo2s.com", ".")
    return asyncio.run(scraper.run())

if __name__ == "__main__":
    main()
