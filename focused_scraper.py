#!/usr/bin/env python3
"""
Focused scraper for first 10 work and archive pages only
"""

import os
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
import re
from bs4 import BeautifulSoup

class FocusedScraper:
    def __init__(self, base_url, output_dir):
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.downloaded = 0
        self.failed = 0
        
    def download_file(self, url, local_path):
        """Download a single file"""
        try:
            print(f"Downloading: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(response.content)
            
            print(f"✓ Saved: {local_path}")
            self.downloaded += 1
            time.sleep(0.5)
            return True
            
        except Exception as e:
            print(f"✗ Failed {url}: {e}")
            self.failed += 1
            return False
    
    def fix_url(self, url):
        """Fix URL construction"""
        if url.startswith('http'):
            return url
        if url.startswith('d2csodhem33bqt.cloudfront.net'):
            return f"https://{url}"
        if url.startswith(('fonts.googleapis.com', 'fonts.gstatic.com')):
            return f"https://{url}"
        if url.startswith('/'):
            return urljoin(self.base_url, url)
        return urljoin(self.base_url, url)
    
    def get_local_path(self, url):
        """Get local path for a URL"""
        parsed = urlparse(url)
        if parsed.netloc:
            path = Path(parsed.netloc) / parsed.path.lstrip('/')
        else:
            path = Path(parsed.path.lstrip('/'))
        return self.output_dir / path
    
    def get_first_10_work_pages(self):
        """Get first 10 work page URLs"""
        try:
            work_files = list(self.output_dir.glob('work/*.html'))
            # Sort by name and take first 10
            work_files = sorted(work_files)[:10]
            return work_files
        except Exception as e:
            print(f"Error getting work pages: {e}")
            return []
    
    def extract_assets_from_html(self, html_file):
        """Extract CSS and JS assets from HTML file"""
        assets = set()
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # CSS files
            for link in soup.find_all('link', href=True):
                href = link['href']
                if href.endswith('.css') or 'stylesheet' in str(link.get('rel', [])):
                    assets.add(href)
            
            # JS files
            for script in soup.find_all('script', src=True):
                assets.add(script['src'])
            
            # Also check for CSS references in the raw content
            css_matches = re.findall(r'href="([^"]*\.css[^"]*)"', content)
            for css_url in css_matches:
                assets.add(css_url)
                
        except Exception as e:
            print(f"Error extracting from {html_file}: {e}")
        
        return assets
    
    def scrape_first_10_pages(self):
        """Scrape assets from first 10 work pages and archive"""
        print("🎯 Focusing on first 10 work pages and archive...")
        
        # Get first 10 work pages
        work_pages = self.get_first_10_work_pages()
        
        # Add main pages
        main_pages = [
            self.output_dir / 'archive.html',
            self.output_dir / 'work.html'
        ]
        
        all_pages = work_pages + [p for p in main_pages if p.exists()]
        
        print(f"📄 Processing {len(all_pages)} pages:")
        for page in all_pages:
            print(f"   • {page.name}")
        
        # Extract all assets
        all_assets = set()
        for page in all_pages:
            assets = self.extract_assets_from_html(page)
            all_assets.update(assets)
            print(f"   Found {len(assets)} assets in {page.name}")
        
        print(f"\n🎯 Total unique assets found: {len(all_assets)}")
        
        # Download missing assets
        for asset_url in all_assets:
            local_path = self.get_local_path(asset_url)
            
            # Skip if already exists and has content
            if local_path.exists() and local_path.stat().st_size > 0:
                continue
            
            full_url = self.fix_url(asset_url)
            self.download_file(full_url, local_path)
        
        print(f"\n📊 Summary:")
        print(f"   ✅ Downloaded: {self.downloaded}")
        print(f"   ❌ Failed: {self.failed}")
        
        return self.downloaded, self.failed

if __name__ == "__main__":
    scraper = FocusedScraper("https://lo2s.com", ".")
    scraper.scrape_first_10_pages()
