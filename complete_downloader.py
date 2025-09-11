#!/usr/bin/env python3
"""
Complete website downloader for lo2s.com
Downloads all pages and creates proper directory structure
"""

import os
import re
import requests
import json
from urllib.parse import urljoin, urlparse
from pathlib import Path
import time
from bs4 import BeautifulSoup

class CompleteWebsiteDownloader:
    def __init__(self, base_url, output_dir):
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.downloaded_pages = set()
        
    def download_page(self, url, local_path):
        """Download a page from URL to local path"""
        if url in self.downloaded_pages:
            return
            
        try:
            print(f"Downloading page: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Create directory if it doesn't exist
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, 'w', encoding='utf-8') as f:
                f.write(response.text)
                
            self.downloaded_pages.add(url)
            print(f"Saved page: {local_path}")
            time.sleep(1)  # Be nice to the server
            
        except Exception as e:
            print(f"Error downloading {url}: {e}")
    
    def extract_project_urls_from_work_page(self):
        """Extract all project URLs from the work page"""
        work_page_path = self.output_dir / 'work.html'
        if not work_page_path.exists():
            print("Work page not found, downloading it first...")
            self.download_page(f"{self.base_url}/work", work_page_path)
        
        with open(work_page_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all href links that start with /work/
        project_urls = re.findall(r'href="(/work/[^"]+)"', content)
        
        # Remove duplicates and filter out the main work page
        unique_urls = list(set(project_urls))
        project_urls = [url for url in unique_urls if url != '/work']
        
        print(f"Found {len(project_urls)} project pages:")
        for url in project_urls:
            print(f"  - {url}")
        
        return project_urls
    
    def download_all_pages(self):
        """Download all main pages and project pages"""
        
        # Main pages to download
        main_pages = [
            ('/', 'index.html'),
            ('/work', 'work.html'),
            ('/about', 'about.html'),
            ('/contact', 'contact.html'),
            ('/archive', 'archive.html'),
        ]
        
        print("Downloading main pages...")
        for page_url, filename in main_pages:
            full_url = urljoin(self.base_url, page_url)
            local_path = self.output_dir / filename
            self.download_page(full_url, local_path)
        
        # Get all project URLs from work page
        project_urls = self.extract_project_urls_from_work_page()
        
        print(f"\nDownloading {len(project_urls)} project pages...")
        for project_url in project_urls:
            full_url = urljoin(self.base_url, project_url)
            # Create filename from URL slug
            project_name = project_url.split('/')[-1]
            local_path = self.output_dir / 'work' / f"{project_name}.html"
            self.download_page(full_url, local_path)
        
        print(f"\nPage download complete! Downloaded {len(self.downloaded_pages)} pages.")
    
    def update_all_links(self):
        """Update all HTML files to use local paths"""
        html_files = list(self.output_dir.glob('*.html')) + list(self.output_dir.glob('work/*.html'))
        
        print(f"\nUpdating links in {len(html_files)} HTML files...")
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Update external asset URLs
                content = content.replace('https://fonts.googleapis.com/', 'fonts.googleapis.com/')
                content = content.replace('https://fonts.gstatic.com/', 'fonts.gstatic.com/')
                content = content.replace('https://d2csodhem33bqt.cloudfront.net/', 'd2csodhem33bqt.cloudfront.net/')
                
                # Update local Next.js assets
                content = content.replace('/_next/', '_next/')
                content = content.replace('/favicon/', 'favicon/')
                content = content.replace('/manifest.json', 'manifest.json')
                content = content.replace('/favicon.ico', 'favicon.ico')
                
                # Update internal page links
                if html_file.name != 'index.html' and 'work/' not in str(html_file):
                    # For non-index pages, adjust paths to go up one level
                    content = re.sub(r'href="/([^"]*)"', r'href="../\1"', content)
                    content = re.sub(r'src="/([^"]*)"', r'src="../\1"', content)
                    # Fix the double ../
                    content = content.replace('href="../work/', 'href="work/')
                    content = content.replace('href="../about.html', 'href="about.html')
                    content = content.replace('href="../contact.html', 'href="contact.html')
                    content = content.replace('href="../archive.html', 'href="archive.html')
                    content = content.replace('href="../index.html', 'href="index.html')
                    content = content.replace('href="../"', 'href="index.html"')
                elif 'work/' in str(html_file):
                    # For work pages, go up two levels
                    content = re.sub(r'href="/([^"]*)"', r'href="../../\1"', content)
                    content = re.sub(r'src="/([^"]*)"', r'src="../../\1"', content)
                    # Fix specific paths
                    content = content.replace('href="../../work/', 'href="../')
                    content = content.replace('href="../../about.html', 'href="../about.html')
                    content = content.replace('href="../../contact.html', 'href="../contact.html')
                    content = content.replace('href="../../archive.html', 'href="../archive.html')
                    content = content.replace('href="../../index.html', 'href="../index.html')
                    content = content.replace('href="../../"', 'href="../index.html"')
                else:
                    # For index page
                    content = re.sub(r'href="/([^"]*)"', r'href="\1"', content)
                    content = re.sub(r'src="/([^"]*)"', r'src="\1"', content)
                    content = content.replace('href="work/', 'href="work.html')
                    content = content.replace('href="about', 'href="about.html')
                    content = content.replace('href="contact', 'href="contact.html')
                    content = content.replace('href="archive', 'href="archive.html')
                
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"Updated: {html_file}")
                
            except Exception as e:
                print(f"Error updating {html_file}: {e}")

if __name__ == "__main__":
    downloader = CompleteWebsiteDownloader("https://lo2s.com", ".")
    downloader.download_all_pages()
    downloader.update_all_links()
    print("\nComplete website download and link updates finished!")
