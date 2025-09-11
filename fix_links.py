#!/usr/bin/env python3
"""
Fix links in HTML to point to local assets for offline browsing
"""

import re
import os
from pathlib import Path

def fix_html_links():
    """Update HTML file to use local asset paths"""
    
    # Read the original HTML
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Define URL replacements
    replacements = [
        # External fonts and assets
        ('https://fonts.googleapis.com/', 'fonts.googleapis.com/'),
        ('https://fonts.gstatic.com/', 'fonts.gstatic.com/'),
        
        # CloudFront assets
        ('https://d2csodhem33bqt.cloudfront.net/', 'd2csodhem33bqt.cloudfront.net/'),
        
        # Local Next.js assets (already relative, but ensure they work)
        ('/_next/', '_next/'),
        
        # Favicon and manifest
        ('/favicon/', 'favicon/'),
        ('/manifest.json', 'manifest.json'),
        ('/favicon.ico', 'favicon.ico'),
    ]
    
    # Apply replacements
    updated_html = html_content
    for old_url, new_url in replacements:
        updated_html = updated_html.replace(old_url, new_url)
    
    # Fix any remaining absolute URLs that start with /
    # But be careful not to break Next.js functionality
    updated_html = re.sub(r'href="/([^"]*)"', r'href="\1"', updated_html)
    updated_html = re.sub(r'src="/([^"]*)"', r'src="\1"', updated_html)
    
    # Write the updated HTML
    with open('index_local.html', 'w', encoding='utf-8') as f:
        f.write(updated_html)
    
    print("Created index_local.html with local asset links")

def fix_css_links():
    """Fix font URLs in CSS files"""
    css_files = [
        '_next/static/css/6e1652e5440a44c1.css',
        '_next/static/css/01af5632c72df255.css',
        'fonts.googleapis.com/css2.css'
    ]
    
    for css_file in css_files:
        if os.path.exists(css_file):
            with open(css_file, 'r', encoding='utf-8') as f:
                css_content = f.read()
            
            # Fix font URLs
            css_content = css_content.replace('https://fonts.gstatic.com/', '../fonts.gstatic.com/')
            
            with open(css_file, 'w', encoding='utf-8') as f:
                f.write(css_content)
            
            print(f"Updated {css_file}")

if __name__ == "__main__":
    fix_html_links()
    fix_css_links()
    print("Link fixing complete!")
