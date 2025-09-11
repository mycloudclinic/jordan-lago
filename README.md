# LO2S Website Clone

This is a complete clone of the lo2s.com website with all pages and assets downloaded for offline use and deployment to a new domain.

## Contents

### Main Pages
- **index.html** - Homepage with project carousel
- **work.html** - Portfolio/work listing page
- **about.html** - About page
- **contact.html** - Contact information page
- **archive.html** - Archive page

### Project Pages (18 individual projects)
- **work/** directory containing all project detail pages:
  - Shkoon Msrahiya Album Tour
  - Hozho II, Adriatique x 2nd Sun, Ben Bohmer
  - Bulgari Campaign, A Thousand and One Festival
  - Balad Beast, Project Meem, SoundStorm Festival
  - Calzedonia Milan Fashion Week, Innellea Five Phases
  - And 8 more detailed project pages

### Assets
- **_next/** - Next.js static assets (JS, CSS)
- **favicon/** - Favicon files and icons  
- **fonts.googleapis.com/** - Google Fonts CSS
- **fonts.gstatic.com/** - Google Fonts WOFF2 files
- **d2csodhem33bqt.cloudfront.net/** - All media assets (videos, images)
- **manifest.json** - PWA manifest file

## Total Downloaded

- **67 files** total including 28 HTML pages
- **444MB** of content including all assets
- All external dependencies localized for offline use
- Complete navigation between all pages working offline

## Testing Locally

To test the website locally:

```bash
# Start a simple HTTP server
python3 -m
http.server 8000

# Or use Node.js if you have it
npx http-server

# Then visit http://localhost:8000
```

## Deploying to New Domain

1. Upload all files to your web server
2. Ensure your web server can serve static files
3. Configure your domain to point to the uploaded files
4. The website should work exactly as the original

## Notes

- This is a static clone - dynamic functionality may not work
- All assets are self-contained for offline use
- The website uses Next.js but has been converted to static files
- Videos and images are preserved in their original quality

## Original Website

This clone was created from: https://lo2s.com

Created on: $(date)
