#!/usr/bin/env python3
"""
Fix all links in HTML files to work properly offline
"""

import re
import os
from pathlib import Path

def fix_html_file(file_path, is_in_work_folder=False):
    """Fix links in a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix external asset URLs to local paths
        content = content.replace('https://fonts.googleapis.com/', 'fonts.googleapis.com/')
        content = content.replace('https://fonts.gstatic.com/', 'fonts.gstatic.com/')
        content = content.replace('https://d2csodhem33bqt.cloudfront.net/', 'd2csodhem33bqt.cloudfront.net/')
        
        if is_in_work_folder:
            # For files in work/ folder, go up one level for assets
            content = content.replace('/_next/', '../_next/')
            content = content.replace('/favicon/', '../favicon/')
            content = content.replace('/manifest.json', '../manifest.json')
            content = content.replace('/favicon.ico', '../favicon.ico')
            
            # Fix font paths to go up one level
            content = content.replace('fonts.googleapis.com/', '../fonts.googleapis.com/')
            content = content.replace('fonts.gstatic.com/', '../fonts.gstatic.com/')
            content = content.replace('d2csodhem33bqt.cloudfront.net/', '../d2csodhem33bqt.cloudfront.net/')
            
            # Fix navigation links
            content = re.sub(r'href="/"', 'href="../index.html"', content)
            content = re.sub(r'href="/work"', 'href="../work.html"', content)
            content = re.sub(r'href="/about"', 'href="../about.html"', content)
            content = re.sub(r'href="/contact"', 'href="../contact.html"', content)
            content = re.sub(r'href="/archive"', 'href="../archive.html"', content)
            
        else:
            # For root level files
            content = content.replace('/_next/', '_next/')
            content = content.replace('/favicon/', 'favicon/')
            content = content.replace('/manifest.json', 'manifest.json')
            content = content.replace('/favicon.ico', 'favicon.ico')
            
            # Fix navigation links for root files
            content = re.sub(r'href="/work"', 'href="work.html"', content)
            content = re.sub(r'href="/about"', 'href="about.html"', content)
            content = re.sub(r'href="/contact"', 'href="contact.html"', content)
            content = re.sub(r'href="/archive"', 'href="archive.html"', content)
            content = re.sub(r'href="/"', 'href="index.html"', content)
            
            # Fix project links to point to work folder
            content = re.sub(r'href="/work/([^"]+)"', r'href="work/\1.html"', content)
        
        # Write the updated content back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Fixed: {file_path}")
        
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

def main():
    """Fix all HTML files"""
    base_dir = Path('.')
    
    # Fix root level HTML files
    root_html_files = list(base_dir.glob('*.html'))
    print(f"Fixing {len(root_html_files)} root HTML files...")
    
    for html_file in root_html_files:
        if html_file.name not in ['index_local.html']:  # Skip backup files
            fix_html_file(html_file, is_in_work_folder=False)
    
    # Fix work folder HTML files
    work_dir = base_dir / 'work'
    if work_dir.exists():
        work_html_files = list(work_dir.glob('*.html'))
        print(f"Fixing {len(work_html_files)} work HTML files...")
        
        for html_file in work_html_files:
            fix_html_file(html_file, is_in_work_folder=True)
    
    print("All links fixed!")

if __name__ == "__main__":
    main()
