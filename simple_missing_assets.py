#!/usr/bin/env python3
"""
Simple, focused scraper to get the specific missing assets
"""

import os
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
import re

class SimpleMissingAssetsScraper:
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
        """Fix URL construction issues"""
        # If it's already a full URL, return as is
        if url.startswith('http'):
            return url
            
        # If it starts with d2csodhem33bqt.cloudfront.net, make it https
        if url.startswith('d2csodhem33bqt.cloudfront.net'):
            return f"https://{url}"
            
        # If it starts with fonts domains, make it https
        if url.startswith('fonts.googleapis.com') or url.startswith('fonts.gstatic.com'):
            return f"https://{url}"
            
        # If it's a relative URL starting with /, join with base
        if url.startswith('/'):
            return urljoin(self.base_url, url)
            
        # Otherwise join with base
        return urljoin(self.base_url, url)
    
    def find_missing_css_files(self):
        """Find specific missing CSS files from HTML"""
        missing_css = set()
        
        # Check all HTML files for CSS references
        html_files = list(self.output_dir.glob('*.html')) + list(self.output_dir.glob('work/*.html'))
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find CSS file references
                css_matches = re.findall(r'href="([^"]*\.css[^"]*)"', content)
                for css_url in css_matches:
                    css_path = self.get_local_path(css_url)
                    if not css_path.exists():
                        missing_css.add(css_url)
                        print(f"Missing CSS: {css_url}")
                        
            except Exception as e:
                print(f"Error checking {html_file}: {e}")
        
        return missing_css
    
    def get_local_path(self, url):
        """Get local path for a URL"""
        parsed = urlparse(url)
        
        if parsed.netloc:
            path = Path(parsed.netloc) / parsed.path.lstrip('/')
        else:
            path = Path(parsed.path.lstrip('/'))
        
        return self.output_dir / path
    
    def download_specific_missing_assets(self):
        """Download the specific assets we know are missing"""
        
        # Known missing CSS file from work pages
        missing_assets = [
            '_next/static/css/e4fa9c326e32d8be.css',
        ]
        
        print("🔍 Looking for missing CSS files...")
        found_missing = self.find_missing_css_files()
        
        # Add any found missing CSS files
        missing_assets.extend(found_missing)
        
        # Remove duplicates
        missing_assets = list(set(missing_assets))
        
        print(f"📦 Found {len(missing_assets)} missing assets to download")
        
        for asset_url in missing_assets:
            full_url = self.fix_url(asset_url)
            local_path = self.get_local_path(asset_url)
            
            if not local_path.exists():
                self.download_file(full_url, local_path)
            else:
                print(f"⏭️  Already exists: {local_path}")
        
        print(f"\n📊 Summary:")
        print(f"   ✅ Downloaded: {self.downloaded}")
        print(f"   ❌ Failed: {self.failed}")
        
        return self.downloaded, self.failed

if __name__ == "__main__":
    scraper = SimpleMissingAssetsScraper("https://lo2s.com", ".")
    scraper.download_specific_missing_assets()
