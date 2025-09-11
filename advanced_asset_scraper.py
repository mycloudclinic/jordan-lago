#!/usr/bin/env python3
"""
Advanced website asset scraper using multiple approaches
Handles JavaScript-heavy sites and missing assets more effectively
"""

import os
import re
import requests
import asyncio
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
from bs4 import BeautifulSoup
import json
import mimetypes

class AdvancedAssetScraper:
    def __init__(self, base_url, output_dir):
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.downloaded_assets = set()
        self.failed_downloads = []
        
    def download_asset(self, url, local_path, retries=3):
        """Download an asset with retry logic and better error handling"""
        if url in self.downloaded_assets:
            return True
            
        for attempt in range(retries):
            try:
                print(f"Downloading ({attempt+1}/{retries}): {url}")
                response = self.session.get(url, timeout=60, stream=True)
                response.raise_for_status()
                
                # Create directory if it doesn't exist
                local_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Download in chunks to handle large files
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                self.downloaded_assets.add(url)
                print(f"✓ Saved: {local_path}")
                time.sleep(0.3)  # Be nice to the server
                return True
                
            except Exception as e:
                print(f"✗ Attempt {attempt+1} failed for {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.failed_downloads.append((url, str(e)))
                    
        return False
    
    def extract_all_asset_urls(self, html_files):
        """Extract all possible asset URLs from HTML files"""
        all_assets = set()
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                soup = BeautifulSoup(content, 'html.parser')
                
                # CSS files - all possible ways they can be referenced
                for link in soup.find_all('link'):
                    href = link.get('href')
                    if href:
                        rel = link.get('rel', [])
                        if isinstance(rel, str):
                            rel = [rel]
                        if any(r in ['stylesheet', 'preload'] for r in rel):
                            all_assets.add(('css', href))
                        elif 'icon' in ' '.join(rel).lower() or 'favicon' in href.lower():
                            all_assets.add(('icon', href))
                        elif href.endswith('.css'):
                            all_assets.add(('css', href))
                
                # JavaScript files
                for script in soup.find_all('script', src=True):
                    all_assets.add(('js', script['src']))
                
                # Images from img tags
                for img in soup.find_all('img', src=True):
                    all_assets.add(('img', img['src']))
                
                # Videos and sources
                for video in soup.find_all('video'):
                    if video.get('src'):
                        all_assets.add(('video', video['src']))
                    for source in video.find_all('source', src=True):
                        all_assets.add(('video', source['src']))
                
                # Extract from JSON-LD and other script tags
                for script in soup.find_all('script'):
                    if script.string:
                        self.extract_urls_from_text(script.string, all_assets)
                
                # Extract from CSS content (for @import and url() references)
                for style in soup.find_all('style'):
                    if style.string:
                        self.extract_css_urls(style.string, all_assets)
                
                # Extract from inline styles
                for element in soup.find_all(style=True):
                    self.extract_css_urls(element['style'], all_assets)
                
                # Look for data attributes that might contain URLs
                for element in soup.find_all():
                    for attr, value in element.attrs.items():
                        if isinstance(value, str) and ('url' in attr.lower() or 'src' in attr.lower()):
                            if value.startswith(('http', '/', '_next')):
                                all_assets.add(('data', value))
                
                print(f"Found {len(all_assets)} total assets in {html_file}")
                
            except Exception as e:
                print(f"Error extracting assets from {html_file}: {e}")
        
        return all_assets
    
    def extract_urls_from_text(self, text, assets_set):
        """Extract URLs from text content (JSON, etc.)"""
        # Look for CSS files
        css_pattern = r'"[^"]*\.css[^"]*"'
        for match in re.findall(css_pattern, text):
            url = match.strip('"')
            if not url.startswith('data:'):
                assets_set.add(('css', url))
        
        # Look for JS files
        js_pattern = r'"[^"]*\.js[^"]*"'
        for match in re.findall(js_pattern, text):
            url = match.strip('"')
            if not url.startswith('data:'):
                assets_set.add(('js', url))
        
        # Look for media files
        media_pattern = r'"[^"]*\.(mp4|webp|jpg|jpeg|png|gif|svg|woff2?|ttf|eot)[^"]*"'
        for match in re.findall(media_pattern, text, re.IGNORECASE):
            url = match.strip('"')
            if not url.startswith('data:'):
                assets_set.add(('media', url))
        
        # Look for generic URLs
        url_pattern = r'"((?:https?://|/)[^"]+)"'
        for match in re.findall(url_pattern, text):
            if any(ext in match.lower() for ext in ['.css', '.js', '.mp4', '.webp', '.jpg', '.png', '.gif', '.svg', '.woff']):
                assets_set.add(('generic', match))
    
    def extract_css_urls(self, css_content, assets_set):
        """Extract URLs from CSS content"""
        # url() references
        url_pattern = r'url\(["\']?([^"\')\s]+)["\']?\)'
        for match in re.findall(url_pattern, css_content):
            if not match.startswith('data:'):
                assets_set.add(('css-asset', match))
        
        # @import statements
        import_pattern = r'@import\s+["\']([^"\']+)["\']'
        for match in re.findall(import_pattern, css_content):
            assets_set.add(('css', match))
    
    def get_local_path(self, url, asset_type='generic'):
        """Convert URL to local file path with better handling"""
        parsed = urlparse(url)
        
        if parsed.netloc:
            # External URL - create domain folder
            path = Path(parsed.netloc) / parsed.path.lstrip('/')
        else:
            # Relative URL
            path = Path(parsed.path.lstrip('/'))
        
        # Handle query parameters by removing them from filename
        if parsed.query:
            path = path.with_name(path.stem + path.suffix)
        
        # Ensure we have a reasonable file extension
        if not path.suffix and asset_type:
            if asset_type == 'css':
                path = path.with_suffix('.css')
            elif asset_type == 'js':
                path = path.with_suffix('.js')
            elif asset_type in ['img', 'media']:
                # Try to guess from URL
                if any(ext in str(path).lower() for ext in ['.jpg', '.png', '.webp', '.gif', '.svg']):
                    pass  # Already has extension
                else:
                    path = path.with_suffix('.jpg')  # Default
        
        return self.output_dir / path
    
    def download_css_dependencies(self, css_url, css_path):
        """Download assets referenced in CSS files"""
        try:
            with open(css_path, 'r', encoding='utf-8') as f:
                css_content = f.read()
            
            assets = set()
            self.extract_css_urls(css_content, assets)
            
            for asset_type, asset_url in assets:
                if asset_url.startswith('data:'):
                    continue
                    
                # Make relative URLs absolute
                full_url = urljoin(css_url, asset_url)
                local_path = self.get_local_path(asset_url, asset_type)
                
                if not local_path.exists():
                    self.download_asset(full_url, local_path)
                    
        except Exception as e:
            print(f"Error processing CSS dependencies for {css_path}: {e}")
    
    def scan_and_download_missing_assets(self):
        """Main method to scan for and download all missing assets"""
        print("🔍 Starting comprehensive asset scan...")
        
        # Get all HTML files
        html_files = list(self.output_dir.glob('*.html'))
        html_files.extend(self.output_dir.glob('work/*.html'))
        
        print(f"📄 Scanning {len(html_files)} HTML files...")
        
        # Extract all asset URLs
        all_assets = self.extract_all_asset_urls(html_files)
        
        print(f"🎯 Found {len(all_assets)} unique assets to check")
        
        # Filter out data URLs and group by type
        valid_assets = []
        for asset_type, asset_url in all_assets:
            if not asset_url.startswith('data:') and asset_url.strip():
                valid_assets.append((asset_type, asset_url))
        
        print(f"📦 Processing {len(valid_assets)} valid assets...")
        
        # Download each asset
        downloaded_count = 0
        skipped_count = 0
        
        for asset_type, asset_url in valid_assets:
            # Convert to full URL
            if asset_url.startswith('/'):
                full_url = urljoin(self.base_url, asset_url)
            elif asset_url.startswith('http'):
                full_url = asset_url
            else:
                full_url = urljoin(self.base_url, asset_url)
            
            local_path = self.get_local_path(asset_url, asset_type)
            
            # Skip if already exists and has content
            if local_path.exists() and local_path.stat().st_size > 0:
                skipped_count += 1
                continue
            
            # Download the asset
            if self.download_asset(full_url, local_path):
                downloaded_count += 1
                
                # If it's a CSS file, download its dependencies
                if asset_type == 'css' and local_path.exists():
                    self.download_css_dependencies(full_url, local_path)
        
        # Print summary
        print(f"\n📊 Download Summary:")
        print(f"   ✅ Downloaded: {downloaded_count}")
        print(f"   ⏭️  Skipped (already exists): {skipped_count}")
        print(f"   ❌ Failed: {len(self.failed_downloads)}")
        
        if self.failed_downloads:
            print(f"\n❌ Failed Downloads:")
            for url, error in self.failed_downloads:
                print(f"   • {url}: {error}")
        
        print(f"\n🎉 Asset download complete!")
        return downloaded_count, skipped_count, len(self.failed_downloads)

if __name__ == "__main__":
    scraper = AdvancedAssetScraper("https://lo2s.com", ".")
    scraper.scan_and_download_missing_assets()
