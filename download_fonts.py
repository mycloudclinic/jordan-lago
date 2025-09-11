#!/usr/bin/env python3
import requests
from pathlib import Path

def download_fonts():
    # Download Google Fonts CSS
    css_url = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap"
    css_path = Path("fonts.googleapis.com/css2.css")
    
    css_path.parent.mkdir(parents=True, exist_ok=True)
    
    response = requests.get(css_url)
    with open(css_path, 'w') as f:
        f.write(response.text)
    print(f"✅ Downloaded: {css_path}")
    
    # Download font files referenced in CSS
    font_urls = [
        "https://fonts.gstatic.com/s/geist/v3/gyByhwUxId8gMEwcGFWNOITd.woff2",
        "https://fonts.gstatic.com/s/geist/v3/gyByhwUxId8gMEwSGFWNOITddY4.woff2", 
        "https://fonts.gstatic.com/s/geist/v3/gyByhwUxId8gMEwYGFWNOITddY4.woff2",
        "https://fonts.gstatic.com/s/geistmono/v3/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2",
        "https://fonts.gstatic.com/s/geistmono/v3/or3nQ6H-1_WfwkMZI_qYFrkdmhHkjkotbA.woff2",
        "https://fonts.gstatic.com/s/geistmono/v3/or3nQ6H-1_WfwkMZI_qYFrMdmhHkjkotbA.woff2"
    ]
    
    for font_url in font_urls:
        font_path = Path(font_url.replace("https://", ""))
        font_path.parent.mkdir(parents=True, exist_ok=True)
        
        response = requests.get(font_url)
        with open(font_path, 'wb') as f:
            f.write(response.content)
        print(f"✅ Downloaded: {font_path}")

if __name__ == "__main__":
    download_fonts()
