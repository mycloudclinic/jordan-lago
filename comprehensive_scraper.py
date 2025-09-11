#!/usr/bin/env python3
"""
Comprehensive asset scraper to get ALL missing assets for the LO2S website
Focuses on CSS, JS, fonts, images, videos, and JSON files
"""

import os
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
import re
import json
from bs4 import BeautifulSoup

class ComprehensiveAssetScraper:
    def __init__(self, base_url, output_dir):
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        })
        self.downloaded = 0
        self.failed = 0
        self.skipped = 0
        
    def download_asset(self, url, local_path, retries=2):
        """Download a single asset with retry logic"""
        for attempt in range(retries):
            try:
                print(f"📥 Downloading: {url}")
                response = self.session.get(url, timeout=30, stream=True)
                response.raise_for_status()
                
                local_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                print(f"✅ Saved: {local_path}")
                self.downloaded += 1
                time.sleep(0.3)
                return True
                
            except Exception as e:
                print(f"❌ Attempt {attempt+1} failed for {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(1)
                else:
                    self.failed += 1
                    
        return False
    
    def fix_url(self, url):
        """Fix URL construction"""
        if url.startswith('data:'):
            return None
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
        
        # Remove query parameters from filename
        if '?' in str(path):
            path = Path(str(path).split('?')[0])
        
        return self.output_dir / path
    
    def extract_all_assets_from_html(self, html_file):
        """Extract ALL possible assets from HTML file"""
        assets = set()
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # CSS files - all possible ways
            for link in soup.find_all('link', href=True):
                href = link['href']
                rel = link.get('rel', [])
                if isinstance(rel, str):
                    rel = [rel]
                
                if any(r in ['stylesheet', 'preload'] for r in rel) or href.endswith('.css'):
                    assets.add(('css', href))
                elif any(word in href.lower() for word in ['icon', 'favicon', 'manifest']):
                    assets.add(('icon', href))
            
            # JavaScript files
            for script in soup.find_all('script', src=True):
                assets.add(('js', script['src']))
            
            # Images from img tags
            for img in soup.find_all('img'):
                if img.get('src'):
                    assets.add(('img', img['src']))
                if img.get('srcset'):
                    # Extract URLs from srcset
                    srcset_urls = re.findall(r'(https?://[^\s,]+|[^\s,]+\.(?:webp|jpg|jpeg|png|gif|svg))', img['srcset'])
                    for url in srcset_urls:
                        if not url.endswith('w'):  # Skip size indicators like "1080w"
                            assets.add(('img', url))
            
            # Videos
            for video in soup.find_all('video'):
                if video.get('src'):
                    assets.add(('video', video['src']))
                for source in video.find_all('source', src=True):
                    assets.add(('video', source['src']))
                # Also check data-src for lazy loading
                for source in video.find_all('source'):
                    if source.get('data-src'):
                        assets.add(('video', source['data-src']))
            
            # Extract from JSON data in script tags
            for script in soup.find_all('script', type='application/json'):
                if script.string:
                    try:
                        data = json.loads(script.string)
                        self.extract_assets_from_json(data, assets)
                    except:
                        pass
            
            # Extract URLs from raw content using regex
            self.extract_assets_from_text(content, assets)
            
            print(f"📄 Found {len(assets)} assets in {html_file.name}")
            
        except Exception as e:
            print(f"❌ Error processing {html_file}: {e}")
        
        return assets
    
    def extract_assets_from_json(self, data, assets):
        """Extract assets from JSON data recursively"""
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str):
                    if any(ext in value.lower() for ext in ['.css', '.js', '.mp4', '.webp', '.jpg', '.png', '.svg', '.woff', '.json']):
                        if value.startswith(('http', '/', '_next', 'd2csodhem33bqt', 'fonts.')):
                            assets.add(('json-asset', value))
                else:
                    self.extract_assets_from_json(value, assets)
        elif isinstance(data, list):
            for item in data:
                self.extract_assets_from_json(item, assets)
    
    def extract_assets_from_text(self, content, assets):
        """Extract asset URLs from text content using regex"""
        # CSS files
        css_pattern = r'["\'](/[^"\']*\.css[^"\']*)["\']'
        for match in re.findall(css_pattern, content):
            assets.add(('css', match))
        
        # JS files
        js_pattern = r'["\'](/[^"\']*\.js[^"\']*)["\']'
        for match in re.findall(js_pattern, content):
            assets.add(('js', match))
        
        # CloudFront assets
        cf_pattern = r'["\']([^"\']*d2csodhem33bqt\.cloudfront\.net/[^"\']+)["\']'
        for match in re.findall(cf_pattern, content):
            if not match.startswith('http'):
                match = f"https://{match}"
            assets.add(('media', match))
        
        # Font files
        font_pattern = r'["\']((?:https://)?fonts\.g[^"\']+)["\']'
        for match in re.findall(font_pattern, content):
            if not match.startswith('http'):
                match = f"https://{match}"
            assets.add(('font', match))
    
    def download_all_missing_assets(self):
        """Main method to download all missing assets"""
        print("🎯 Starting comprehensive asset download...")
        
        # Get all HTML files
        html_files = []
        html_files.extend(self.output_dir.glob('*.html'))
        html_files.extend(self.output_dir.glob('work/*.html'))
        
        print(f"📁 Processing {len(html_files)} HTML files...")
        
        # Extract all assets
        all_assets = set()
        for html_file in html_files:
            assets = self.extract_all_assets_from_html(html_file)
            all_assets.update(assets)
        
        print(f"🎯 Found {len(all_assets)} total unique assets")
        
        # Group by priority
        priority_assets = []
        normal_assets = []
        
        for asset_type, asset_url in all_assets:
            if asset_type in ['css', 'js']:
                priority_assets.append((asset_type, asset_url))
            else:
                normal_assets.append((asset_type, asset_url))
        
        # Download priority assets first (CSS, JS)
        print(f"🚀 Downloading {len(priority_assets)} priority assets (CSS, JS)...")
        self.download_asset_list(priority_assets)
        
        # Then download media assets
        print(f"🖼️  Downloading {len(normal_assets)} media assets...")
        self.download_asset_list(normal_assets)
        
        # Summary
        print(f"\n📊 Download Summary:")
        print(f"   ✅ Downloaded: {self.downloaded}")
        print(f"   ⏭️  Skipped (exists): {self.skipped}")
        print(f"   ❌ Failed: {self.failed}")
        print(f"   🎉 Total processed: {len(all_assets)}")
        
        return self.downloaded, self.skipped, self.failed
    
    def download_asset_list(self, assets):
        """Download a list of assets"""
        for asset_type, asset_url in assets:
            full_url = self.fix_url(asset_url)
            if not full_url:
                continue
                
            local_path = self.get_local_path(asset_url)
            
            # Skip if already exists and has content
            if local_path.exists() and local_path.stat().st_size > 0:
                self.skipped += 1
                continue
            
            self.download_asset(full_url, local_path)

if __name__ == "__main__":
    print("🚀 LO2S Comprehensive Asset Scraper")
    print("=" * 50)
    
    scraper = ComprehensiveAssetScraper("https://lo2s.com", ".")
    downloaded, skipped, failed = scraper.download_all_missing_assets()
    
    print(f"\n🎯 Final Results:")
    print(f"   📥 Downloaded: {downloaded} new assets")
    print(f"   ⏭️  Skipped: {skipped} existing assets") 
    print(f"   ❌ Failed: {failed} failed downloads")
    print(f"\n✨ Scraping complete!")
