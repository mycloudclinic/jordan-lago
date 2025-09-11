#!/usr/bin/env python3
"""
Download specific missing assets based on 404 errors from server logs
"""

import requests
from pathlib import Path
import time

# Missing client logos from server logs
missing_assets = [
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Calzedonia_0854fdd7d4.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Expo2020_Dubai_f648c29cbb.webp", 
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Dyson_05e2ebf9e0.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Ferrari_a37303e6d0.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_GEA_c7c97b1053.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_JTI_ecbd365617.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Leo_Burnett_6cb0922dd5.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Lindt_92a192eca7.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_PMI_a7089ff597.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Pinto_Paris2_2dcf9fba53.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Porsche_9153242127.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Samsung_b3522855cf.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Toyota_102d9ead37.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Adriatique_26c6f9ea68.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_AMA_1e2e92e1d7.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Amr_Diab_184d1acb33.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Benchmark_72dea4b8b7.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Factory_People_c4bcf33119.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Free_Jabriya_0b1a7462ac.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Innellea_e31ffbfade.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Kord_8e6a7419d9.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Live_Nation_Entertainment_fecc1349b3.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Luxury_KSA_c47ecc3cf2.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Marwan_Moussa_ed5eba3877.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Mayyas_d6d582f71d.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_MDL_Beast_e49880115b.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Meiosis_d9eed1ae2e.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Shahid_2a63c405b3.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Shkoon_1f27849e7c.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Venture_Lifestyle_3b02700eab.webp",
    "d2csodhem33bqt.cloudfront.net/uploads/x256_Vertex_d5052c2955.webp",
    # Missing Next.js files
    "_next/data/sEgby1zVGHQ7Lgldl4hat/legal.json",
    "_next/static/chunks/pages/legal-3c8b37975380135e.js"
]

def download_missing_assets():
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })
    
    downloaded = 0
    failed = 0
    
    for asset_path in missing_assets:
        # Convert to full URL
        if asset_path.startswith('d2csodhem33bqt.cloudfront.net'):
            url = f"https://{asset_path}"
        elif asset_path.startswith('_next'):
            url = f"https://lo2s.com/{asset_path}"
        else:
            url = f"https://lo2s.com/{asset_path}"
        
        local_path = Path(asset_path)
        
        # Skip if already exists
        if local_path.exists():
            print(f"⏭️  Already exists: {asset_path}")
            continue
            
        try:
            print(f"📥 Downloading: {url}")
            response = session.get(url, timeout=30)
            response.raise_for_status()
            
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Saved: {local_path}")
            downloaded += 1
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Failed {url}: {e}")
            failed += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Downloaded: {downloaded}")
    print(f"   ❌ Failed: {failed}")

if __name__ == "__main__":
    download_missing_assets()
