#!/usr/bin/env python3
"""
Complete website downloader for lo2s.com
Downloads all assets including CSS, JS, fonts, images, videos, and other resources
"""

import os
import re
import requests
import json
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
from bs4 import BeautifulSoup

class WebsiteDownloader:
    def __init__(self, base_url, output_dir):
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.downloaded_urls = set()
        
    def download_file(self, url, local_path):
        """Download a file from URL to local path"""
        if url in self.downloaded_urls:
            return
            
        try:
            print(f"Downloading: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Create directory if it doesn't exist
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(response.content)
                
            self.downloaded_urls.add(url)
            print(f"Saved: {local_path}")
            time.sleep(0.5)  # Be nice to the server
            
        except Exception as e:
            print(f"Error downloading {url}: {e}")
    
    def extract_urls_from_html(self, html_content):
        """Extract all asset URLs from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        urls = []
        
        # CSS files
        for link in soup.find_all('link', rel=['stylesheet', 'preload']):
            href = link.get('href')
            if href:
                urls.append(('css', href))
        
        # JavaScript files
        for script in soup.find_all('script', src=True):
            urls.append(('js', script['src']))
        
        # Images
        for img in soup.find_all('img', src=True):
            urls.append(('img', img['src']))
        
        # Videos
        for video in soup.find_all('video'):
            for source in video.find_all('source', src=True):
                urls.append(('video', source['src']))
        
        # Favicon and manifest
        for link in soup.find_all('link', href=True):
            href = link.get('href')
            if href and any(x in href for x in ['favicon', 'manifest', 'apple-touch']):
                urls.append(('icon', href))
        
        # Extract URLs from JSON data (Next.js data)
        script_tags = soup.find_all('script', type='application/json')
        for script in script_tags:
            try:
                data = json.loads(script.string)
                self.extract_urls_from_json(data, urls)
            except:
                pass
        
        return urls
    
    def extract_urls_from_json(self, data, urls):
        """Recursively extract URLs from JSON data"""
        if isinstance(data, dict):
            for key, value in data.items():
                if key in ['url', 'src', 'href'] and isinstance(value, str):
                    if value.startswith('http') or value.startswith('/'):
                        urls.append(('media', value))
                else:
                    self.extract_urls_from_json(value, urls)
        elif isinstance(data, list):
            for item in data:
                self.extract_urls_from_json(item, urls)
    
    def get_local_path(self, url, asset_type):
        """Convert URL to local file path"""
        parsed = urlparse(url)
        
        if parsed.netloc:
            # External URL - create domain folder
            path = Path(parsed.netloc) / parsed.path.lstrip('/')
        else:
            # Relative URL
            path = Path(parsed.path.lstrip('/'))
        
        # Ensure we have a file extension
        if not path.suffix:
            if asset_type == 'css':
                path = path.with_suffix('.css')
            elif asset_type == 'js':
                path = path.with_suffix('.js')
            elif asset_type in ['img', 'video', 'media']:
                # Try to determine from URL
                if 'css' in str(path):
                    path = path.with_suffix('.css')
                elif any(ext in str(path) for ext in ['.jpg', '.png', '.webp', '.mp4', '.svg']):
                    pass  # Already has extension
                else:
                    path = path.with_suffix('.html')
        
        return self.output_dir / path
    
    def download_css_assets(self, css_url, css_content):
        """Download assets referenced in CSS files"""
        # Find URLs in CSS
        url_pattern = r'url\(["\']?([^"\')\s]+)["\']?\)'
        urls = re.findall(url_pattern, css_content)
        
        for url in urls:
            if url.startswith('data:'):
                continue
                
            full_url = urljoin(css_url, url)
            local_path = self.get_local_path(url, 'css-asset')
            self.download_file(full_url, local_path)
    
    def download_all_assets(self):
        """Main method to download all assets"""
        # Read the main HTML file
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Extract all URLs
        urls = self.extract_urls_from_html(html_content)
        
        print(f"Found {len(urls)} assets to download")
        
        # Download each asset
        for asset_type, url in urls:
            if url.startswith('data:'):
                continue
                
            # Convert relative URLs to absolute
            if url.startswith('/'):
                full_url = urljoin(self.base_url, url)
            elif url.startswith('http'):
                full_url = url
            else:
                full_url = urljoin(self.base_url, url)
            
            local_path = self.get_local_path(url, asset_type)
            self.download_file(full_url, local_path)
            
            # If it's a CSS file, download its assets too
            if asset_type == 'css' and local_path.exists():
                try:
                    with open(local_path, 'r', encoding='utf-8') as f:
                        css_content = f.read()
                    self.download_css_assets(full_url, css_content)
                except:
                    pass
        
        print(f"\nDownload complete! {len(self.downloaded_urls)} files downloaded.")

if __name__ == "__main__":
    downloader = WebsiteDownloader("https://lo2s.com", ".")
    downloader.download_all_assets()
