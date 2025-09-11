#!/usr/bin/env python3
"""
Download all missing CSS, JS, and other assets from all HTML pages
"""

import os
import re
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
from bs4 import BeautifulSoup

class MissingAssetsDownloader:
    def __init__(self, base_url, output_dir):
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.downloaded_assets = set()
        
    def download_asset(self, url, local_path):
        """Download an asset from URL to local path"""
        if url in self.downloaded_assets:
            return
            
        try:
            print(f"Downloading asset: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Create directory if it doesn't exist
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(response.content)
                
            self.downloaded_assets.add(url)
            print(f"Saved: {local_path}")
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error downloading {url}: {e}")
    
    def extract_assets_from_html(self, html_file):
        """Extract all asset URLs from an HTML file"""
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            assets = []
            
            # CSS files
            for link in soup.find_all('link', rel=['stylesheet', 'preload']):
                href = link.get('href')
                if href and (href.startswith('/') or href.startswith('http')):
                    assets.append(('css', href))
            
            # JavaScript files
            for script in soup.find_all('script', src=True):
                src = script.get('src')
                if src and (src.startswith('/') or src.startswith('http')):
                    assets.append(('js', src))
            
            # Extract from inline JSON (Next.js data)
            json_scripts = soup.find_all('script', type='application/json')
            for script in json_scripts:
                if script.string:
                    # Look for asset URLs in the JSON
                    json_content = script.string
                    # Find CSS files
                    css_matches = re.findall(r'"/_next/static/css/[^"]+\.css"', json_content)
                    for match in css_matches:
                        css_url = match.strip('"')
                        assets.append(('css', css_url))
                    
                    # Find JS files  
                    js_matches = re.findall(r'"/_next/static/chunks/[^"]+\.js"', json_content)
                    for match in js_matches:
                        js_url = match.strip('"')
                        assets.append(('js', js_url))
                    
                    # Find data files
                    data_matches = re.findall(r'"/_next/data/[^"]+\.json"', json_content)
                    for match in data_matches:
                        data_url = match.strip('"')
                        assets.append(('data', data_url))
            
            return assets
            
        except Exception as e:
            print(f"Error extracting assets from {html_file}: {e}")
            return []
    
    def get_local_asset_path(self, url):
        """Convert asset URL to local file path"""
        parsed = urlparse(url)
        
        if parsed.netloc:
            # External URL
            path = Path(parsed.netloc) / parsed.path.lstrip('/')
        else:
            # Relative URL
            path = Path(parsed.path.lstrip('/'))
        
        return self.output_dir / path
    
    def download_all_missing_assets(self):
        """Download all missing assets from all HTML files"""
        
        # Get all HTML files
        html_files = list(self.output_dir.glob('*.html')) + list(self.output_dir.glob('work/*.html'))
        
        all_assets = set()
        
        print(f"Extracting assets from {len(html_files)} HTML files...")
        
        # Extract assets from all HTML files
        for html_file in html_files:
            assets = self.extract_assets_from_html(html_file)
            for asset_type, asset_url in assets:
                all_assets.add((asset_type, asset_url))
            print(f"Found {len(assets)} assets in {html_file}")
        
        print(f"\nTotal unique assets found: {len(all_assets)}")
        
        # Download each asset
        for asset_type, asset_url in all_assets:
            if asset_url.startswith('data:'):
                continue
                
            # Convert to full URL
            if asset_url.startswith('/'):
                full_url = urljoin(self.base_url, asset_url)
            elif asset_url.startswith('http'):
                full_url = asset_url
            else:
                full_url = urljoin(self.base_url, asset_url)
            
            local_path = self.get_local_asset_path(asset_url)
            
            # Skip if already exists
            if local_path.exists():
                print(f"Already exists: {local_path}")
                continue
                
            self.download_asset(full_url, local_path)
        
        print(f"\nAsset download complete! Downloaded {len(self.downloaded_assets)} new assets.")

if __name__ == "__main__":
    downloader = MissingAssetsDownloader("https://lo2s.com", ".")
    downloader.download_all_missing_assets()
