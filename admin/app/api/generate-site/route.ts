import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import fs from 'fs-extra'
import path from 'path'

// Responsive image widths that the LO2S front-end <picture> elements expect
const IMAGE_WIDTHS = [128, 256, 640, 768, 1080, 1920, 2880, 3072]

/**
 * Generate static site files from current database.
 * Outputs __NEXT_DATA__ in the exact format the LO2S JS chunks expect.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting static site generation...')

    let dryRun = false
    let renamePayload: { previousUid?: string; uid?: string } = {}
    try {
      const body = await request.json()
      dryRun = Boolean(body?.dryRun)
      if (body?.previousUid || body?.uid) {
        renamePayload = { previousUid: body.previousUid, uid: body.uid }
      }
    } catch (_) {
      // no body provided
    }

    // Fetch all published projects with relations
    const projects = await db.project.findMany({
      where: { published: true },
      include: {
        categories: { include: { category: true } },
        teamMembers: true,
        mediaBlocks: { orderBy: { order: 'asc' } }
      },
      orderBy: { order: 'asc' }
    })

    // Transform each project to the LO2S-compatible format
    const transformedProjects = projects.map((project, index) => {
      const nextProject = projects[index + 1] || projects[0]
      return transformProjectToLO2S(project, nextProject)
    })

    // --- Write work.json ---
    const workData = {
      pageProps: {
        cms: {
          works: transformedProjects,
          categories: await getCategories(),
          general: getGeneralSettings()
        }
      },
      __N_SSG: true
    }
    const workJsonPath = path.join(process.cwd(), '../_next/data/sEgby1zVGHQ7Lgldl4hat/work.json')
    await fs.ensureDir(path.dirname(workJsonPath))
    await fs.writeJson(workJsonPath, workData, { spaces: 0 })
    console.log('Generated work.json')

    // --- Update homepage with featured projects (first 4) ---
    await updateHomepage(transformedProjects.slice(0, 4))

    // --- Read branding from homepage for use in project pages ---
    const indexPath = path.join(process.cwd(), '../index.html')
    let branding: { logoUrl?: string; loaderLogoUrl?: string } = {}
    try {
      if (await fs.pathExists(indexPath)) {
        const indexContent = await fs.readFile(indexPath, 'utf-8')
        const m = indexContent.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
        if (m) {
          const data = JSON.parse(m[1])
          branding = data?.props?.pageProps?.cms?.content?.branding || {}
        }
      }
    } catch (_) {
      branding = {}
    }

    // --- Generate individual project pages ---
    await generateProjectPages(transformedProjects, { dryRun, renamePayload, branding })

    console.log('Static site generation complete!')
    return NextResponse.json({
      success: true,
      message: `Generated ${transformedProjects.length} projects`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating site:', error)
    return NextResponse.json({ error: 'Failed to generate site' }, { status: 500 })
  }
}

// ─── LO2S-Compatible Data Transform ─────────────────────────────────────────

/**
 * Transforms a DB project into the exact JSON shape the LO2S JS chunks expect
 * inside __NEXT_DATA__.props.pageProps.cms.work
 */
function transformProjectToLO2S(project: any, nextProject?: any) {
  const heroUrl = project.mainMediaUrl || ''
  const fullVideoUrl = project.mainVideoUrl || project.mainMediaUrl || ''

  return {
    schemaImg: null,
    model: null,
    uid: project.uid,
    createdAt: project.createdAt?.toISOString?.() || new Date().toISOString(),
    info: {
      id: project.id,
      name: project.name,
      client: project.client,
      date: project.date.toISOString().split('T')[0],
      budget: null,
      visitors: null,
      shortDescription: project.shortDescription,
      description: (project.description || '').split('\n\n').filter(Boolean).map((paragraph: string) => ({
        type: 'paragraph',
        children: [{ type: 'text', text: paragraph }]
      })),
      team: {
        id: project.id,
        person: project.teamMembers.map((tm: any) => ({
          id: tm.id,
          position: tm.position,
          name: tm.name
        }))
      },
      categories: project.categories.map((pc: any) => ({
        name: pc.category.name,
        type: pc.category.type
      })),
      location: {
        id: project.id,
        country: project.country,
        city: project.city
      }
    },
    mainMedia: buildMainMedia(heroUrl, fullVideoUrl, project.mainMediaType),
    mediaContent: project.mediaBlocks.map((block: any) => buildMediaContentBlock(block)),
    nextWork: nextProject ? buildNextWork(nextProject) : null,
    seo: {
      id: project.id,
      title: `${project.name} - Jordan Lago Media`,
      description: project.shortDescription || project.description?.substring(0, 160) || '',
      keywords: project.categories.map((pc: any) => pc.category.name).join(', ')
    }
  }
}

/**
 * Build mainMedia in the LO2S format with full metadata objects
 */
function buildMainMedia(heroUrl: string, fullVideoUrl: string, mediaType: string) {
  const isVideo = mediaType === 'video'
  const heroTransformed = isVideo
    ? transformCloudinaryVideo(heroUrl, { muted: true })
    : transformCloudinaryImage(heroUrl)
  const fullTransformed = isVideo
    ? transformCloudinaryVideo(fullVideoUrl, { muted: false })
    : heroTransformed

  return {
    alt: null,
    mediaType,
    src: {
      desktop: buildMediaMetadata(heroTransformed, mediaType),
      mobile: null
    },
    fullVideo: isVideo ? {
      desktop: buildMediaMetadata(fullTransformed, 'video'),
      mobile: null
    } : null
  }
}

/**
 * Build a media metadata object matching the LO2S shape
 * (id, name, url, width, height, mime, ext, hash, etc.)
 */
function buildMediaMetadata(url: string, mediaType: string) {
  if (!url) return null
  const filename = extractFilename(url)
  const ext = mediaType === 'video' ? '.mp4' : '.webp'
  const mime = mediaType === 'video' ? 'video/mp4' : 'image/webp'
  const hash = filename.replace(/\.[^.]+$/, '')

  return {
    id: hashCode(url),
    documentId: hash.substring(0, 24),
    name: filename,
    alternativeText: null,
    caption: null,
    width: null,
    height: null,
    formats: null,
    hash,
    ext,
    mime,
    size: null,
    url,
    previewUrl: null,
    provider: 'cloudinary',
    provider_metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  }
}

/**
 * Build a single mediaContent block in the LO2S format.
 * Supports: full-size (media slot), two-media (left+right), three-media (left+middle+right)
 */
function buildMediaContentBlock(block: any) {
  const type = normalizeLO2SBlockType(block.type)
  const content: any = {
    media: null,
    left: null,
    middle: null,
    right: null
  }

  if (type === 'full-size') {
    // full-size blocks use middleMediaUrl as the single "media" slot,
    // or fall back to leftMediaUrl for backward compatibility
    const url = block.middleMediaUrl || block.leftMediaUrl
    const mediaType = block.middleMediaType || block.leftMediaType || 'image'
    if (url) {
      content.media = buildMediaContentItem(url, mediaType)
    }
  }

  if (type === 'two-media' || type === 'three-media') {
    if (block.leftMediaUrl) {
      content.left = buildMediaContentItem(block.leftMediaUrl, block.leftMediaType || 'image')
    }
    if (block.rightMediaUrl) {
      content.right = buildMediaContentItem(block.rightMediaUrl, block.rightMediaType || 'image')
    }
  }

  if (type === 'three-media') {
    if (block.middleMediaUrl) {
      content.middle = buildMediaContentItem(block.middleMediaUrl, block.middleMediaType || 'image')
    }
  }

  return {
    id: block.id,
    type,
    mediaContent: content
  }
}

/**
 * Build a media content item with responsive image formats for the gallery.
 * Images get the full responsive srcset (128w - 3072w).
 * Videos get a simpler structure matching the LO2S video format.
 */
function buildMediaContentItem(url: string, mediaType: string) {
  if (mediaType === 'video') {
    const transformedUrl = transformCloudinaryVideo(url, { muted: true })
    return {
      alt: null,
      mediaType: 'video',
      src: {
        desktop: buildMediaMetadata(transformedUrl, 'video'),
        mobile: null
      },
      fullVideo: null
    }
  }

  // Image: build responsive formats array matching LO2S structure
  const transformedUrl = transformCloudinaryImage(url)
  const filename = extractFilename(url)
  const hash = filename.replace(/\.[^.]+$/, '')

  const formats = IMAGE_WIDTHS.map(w => ({
    id: w,
    format: `${w}w`,
    src: {
      name: `x${w}_${filename}`,
      hash: `x${w}_${hash}`,
      ext: '.webp',
      mime: 'image/webp',
      path: null,
      width: w,
      height: null,
      size: null,
      sizeInBytes: null,
      url: buildResponsiveImageUrl(url, w)
    }
  }))

  const desktopSrc = {
    media: 'desktop',
    id: hashCode(url),
    documentId: hash.substring(0, 24),
    alt: null,
    formats,
    default: {
      name: filename,
      caption: null,
      width: null,
      height: null,
      hash,
      ext: '.webp',
      mime: 'image/webp',
      size: null,
      url: transformedUrl,
      previewUrl: null,
      provider: 'cloudinary',
      provider_metadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      alt: null
    }
  }

  return {
    alt: null,
    mediaType: 'image',
    src: [desktopSrc, { ...desktopSrc, media: 'mobile' }],
    fullVideo: null
  }
}

/**
 * Build nextWork structure - a lightweight version of a project for navigation
 */
function buildNextWork(project: any) {
  const heroUrl = project.mainMediaUrl || ''
  const mediaType = project.mainMediaType || 'video'

  return {
    uid: project.uid,
    info: {
      id: project.id,
      name: project.name,
      client: project.client,
      date: project.date.toISOString().split('T')[0],
      budget: null,
      visitors: null,
      shortDescription: project.shortDescription,
      description: (project.description || '').split('\n\n').filter(Boolean).map((p: string) => ({
        type: 'paragraph',
        children: [{ type: 'text', text: p }]
      })),
      location: {
        id: project.id,
        country: project.country,
        city: project.city
      },
      categories: project.categories.map((pc: any) => ({
        name: pc.category.name,
        type: pc.category.type
      })),
      team: {
        id: project.id,
        person: project.teamMembers?.map((tm: any) => ({
          id: tm.id,
          position: tm.position,
          name: tm.name
        })) || []
      }
    },
    mainMedia: buildMainMedia(heroUrl, heroUrl, mediaType)
  }
}

// ─── Cloudinary URL Helpers ──────────────────────────────────────────────────

function isCloudinaryUrl(url?: string | null): url is string {
  return Boolean(url && /res\.cloudinary\.com\//.test(url))
}

function insertCloudinaryTransform(url: string, transform: string): string {
  const marker = '/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url
  const after = url[idx + marker.length]
  // Don't double-insert if transforms already present
  if (after && after !== 'v') return url
  return url.replace(marker, `${marker}${transform}/`)
}

function transformCloudinaryVideo(url: string, opts: { muted: boolean }): string {
  if (!url) return ''
  if (!isCloudinaryUrl(url)) return url
  const baseTransform = 'f_mp4,vc_h264,q_auto:good'
  const t = opts.muted ? `${baseTransform},e_volume:mute` : baseTransform
  const withTransform = insertCloudinaryTransform(url, t)
  return withTransform.replace(/\.(mov|m4v|webm)(\?|#|$)/i, '.mp4$2')
}

function transformCloudinaryImage(url: string): string {
  if (!url) return ''
  if (!isCloudinaryUrl(url)) return url
  return insertCloudinaryTransform(url, 'f_auto,q_auto')
}

/**
 * Build a responsive image URL at a given width using Cloudinary transforms.
 * Non-Cloudinary URLs are returned as-is.
 */
function buildResponsiveImageUrl(url: string, width: number): string {
  if (!url) return ''
  if (!isCloudinaryUrl(url)) return url
  return insertCloudinaryTransform(url, `c_scale,w_${width},f_webp,q_auto`)
}

/**
 * Map DB block types to the LO2S block types the front-end JS expects.
 * DB might store "gallery", "bts", etc. LO2S expects "full-size", "two-media", "three-media".
 */
function normalizeLO2SBlockType(dbType: string): string {
  switch (dbType) {
    case 'full-size':
    case 'two-media':
    case 'three-media':
      return dbType
    // Legacy types from early CMS versions
    case 'gallery':
    case 'bts':
      return 'full-size'
    default:
      return 'full-size'
  }
}

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname
    return pathname.split('/').pop() || 'media'
  } catch {
    return url.split('/').pop() || 'media'
  }
}

// Simple numeric hash from a string (for generating stable IDs)
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ─── Static Data Helpers ─────────────────────────────────────────────────────

async function getCategories() {
  const categories = await db.category.findMany()
  return categories.map(cat => ({ name: cat.name, type: cat.type }))
}

function getGeneralSettings() {
  return {
    categories: null,
    footer: {
      copyright: '© All rights reserved',
      email: 'hello@jordanlagomedia.com',
      legalsText: 'Terms of Use',
      creditsText: 'Credits',
      preloaderText: 'Blending creativity and innovation to awaken new realms.',
      credit: [
        { name: 'Design by DashDigital®', link: 'https://dashdigital.studio/' },
        { name: 'Dev by SALT AND PEPPER', link: 'https://snp.agency/' }
      ]
    },
    pages: [
      { name: 'Work', linkTo: '/work' },
      { name: 'Archive', linkTo: '/archive' },
      { name: 'About', linkTo: '/about' },
      { name: 'Contact', linkTo: '/contact' }
    ]
  }
}

// ─── Homepage Update ─────────────────────────────────────────────────────────

async function updateHomepage(featuredProjects: any[]) {
  const indexPath = path.join(process.cwd(), '../index.html')
  if (!(await fs.pathExists(indexPath))) return

  let indexContent = await fs.readFile(indexPath, 'utf-8')

  // Update __NEXT_DATA__ with featured projects
  const nextDataMatch = indexContent.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (nextDataMatch) {
    const currentData = JSON.parse(nextDataMatch[1])
    currentData.props.pageProps.cms.works = featuredProjects

    const updatedScript = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(currentData)}</script>`
    indexContent = indexContent.replace(nextDataMatch[0], updatedScript)

    const backupPath = `${indexPath}.bak.${Date.now()}`
    await fs.writeFile(backupPath, await fs.readFile(indexPath, 'utf-8'))
    await fs.writeFile(indexPath, indexContent)
    console.log('Updated homepage carousel')
  }

  // Inject global branding shim if not already present
  const brandShimId = 'jordan-lago-branding-global'
  if (indexContent.indexOf(`id="${brandShimId}"`) === -1) {
    const brandShim = buildBrandingShim(brandShimId)
    indexContent = indexContent.replace(/<\/body>/i, brandShim + '</body>')
    await fs.writeFile(indexPath, indexContent)
    console.log('Injected global branding shim on homepage')
  }
}

// ─── Project Page Generation ─────────────────────────────────────────────────

async function generateProjectPages(
  projects: any[],
  opts?: {
    dryRun?: boolean
    renamePayload?: { previousUid?: string; uid?: string }
    branding?: { logoUrl?: string; loaderLogoUrl?: string }
  }
) {
  const workDir = path.join(process.cwd(), '../work')
  const templatePath = path.join(process.cwd(), 'templates', 'project-page.html')

  for (const project of projects) {
    // Handle rename if requested
    const rp = opts?.renamePayload
    if (rp && rp.uid === project.uid && rp.previousUid && rp.previousUid !== project.uid) {
      const from = path.join(workDir, `${rp.previousUid}.html`)
      const to = path.join(workDir, `${project.uid}.html`)
      if (await fs.pathExists(from)) {
        await fs.copy(from, `${from}.bak.${Date.now()}`)
        await fs.move(from, to, { overwrite: true })
        const redirectHtml = `<!doctype html><meta http-equiv="refresh" content="0; url=/work/${project.uid}.html"><script>location.replace('/work/${project.uid}.html')</script>`
        await fs.writeFile(from, redirectHtml)
        console.log(`Renamed page ${rp.previousUid} -> ${project.uid}`)
      }
    }

    const projectPath = path.join(workDir, `${project.uid}.html`)
    let projectContent: string

    if (await fs.pathExists(projectPath)) {
      // Existing page: read and update __NEXT_DATA__ only
      projectContent = await fs.readFile(projectPath, 'utf-8')
      console.log(`Updating existing page for ${project.uid}`)
    } else if (await fs.pathExists(templatePath)) {
      // New page: clone from template
      projectContent = await fs.readFile(templatePath, 'utf-8')
      console.log(`Creating new page for ${project.uid} from template`)
    } else {
      console.error(`No template found at ${templatePath} and no existing page for ${project.uid}. Skipping.`)
      continue
    }

    // Update __NEXT_DATA__
    const nextDataMatch = projectContent.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (nextDataMatch) {
      let currentData: any
      try {
        currentData = JSON.parse(nextDataMatch[1])
      } catch {
        currentData = { props: { pageProps: { cms: {} } }, __N_SSG: true }
      }
      if (!currentData.props) currentData.props = {}
      if (!currentData.props.pageProps) currentData.props.pageProps = {}
      if (!currentData.props.pageProps.cms) currentData.props.pageProps.cms = {}

      // Set the project data in the LO2S-compatible format
      currentData.props.pageProps.cms.work = project

      const updatedScript = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(currentData)}</script>`
      projectContent = projectContent.replace(nextDataMatch[0], updatedScript)
    }

    // Inject media shim if not already present
    const shimId = 'jordan-lago-media-shim'
    if (!projectContent.includes(`id="${shimId}"`)) {
      const shim = buildMediaShim(shimId)
      projectContent = projectContent.replace(/<\/body>/i, shim + '</body>')
    }

    if (opts?.dryRun) {
      console.log(`Dry-run: skipping write for ${project.uid}`)
      continue
    }

    // Verify essential structure before writing
    if (!projectContent.includes('<script id="__NEXT_DATA__"') || !projectContent.includes('/_next/static/')) {
      console.error(`Verification failed for ${project.uid}. Skipping write.`)
      continue
    }

    // Backup + write
    if (await fs.pathExists(projectPath)) {
      const backupPath = `${projectPath}.bak.${Date.now()}`
      await fs.writeFile(backupPath, await fs.readFile(projectPath, 'utf-8'))
    }
    await fs.writeFile(projectPath, projectContent)
    console.log(`Updated/created page for ${project.uid}`)
  }

  console.log(`Processed ${projects.length} project pages`)
}

// ─── Shim Builders ───────────────────────────────────────────────────────────

/**
 * Media shim: swaps hero video source from __NEXT_DATA__, handles play button,
 * and applies branding (logo replacement).
 */
function buildMediaShim(shimId: string): string {
  return `
<script id="${shimId}">(function(){try{
  function insertTransforms(u){
    if(!u||typeof u!=='string') return u;
    if(!/res\\.cloudinary\\.com\\//.test(u)) return u;
    var marker='/upload/';
    var i=u.indexOf(marker);
    if(i===-1) return u;
    var after=u[i+marker.length];
    var hasTransforms=after&&after!=='v';
    var t='f_mp4,vc_h264,q_auto:good,e_volume:mute';
    var v=hasTransforms?u:u.replace(marker,marker+t+'/');
    return v.replace(/\\.(mov|m4v|webm)(\\?|#|$)/i,'.mp4$2');
  }
  function swap(){
    var el=document.getElementById('__NEXT_DATA__');
    if(!el) return;
    var data={};try{data=JSON.parse(el.textContent||'{}');}catch(_){}
    var w=(((data||{}).props||{}).pageProps||{}).cms&&(((data||{}).props||{}).pageProps.cms).work||{};
    var url=(w.mainMedia&&w.mainMedia.fullVideo&&w.mainMedia.fullVideo.desktop&&w.mainMedia.fullVideo.desktop.url)||(w.mainMedia&&w.mainMedia.src&&w.mainMedia.src.desktop&&w.mainMedia.src.desktop.url)||'';
    url=insertTransforms(url);
    if(!url) return;
    var vid=document.querySelector('section video, video');
    if(!vid) return;
    vid.muted=true;vid.setAttribute('muted','');
    vid.playsInline=true;vid.setAttribute('playsinline','');
    vid.autoplay=true;vid.setAttribute('autoplay','');
    vid.loop=true;vid.setAttribute('loop','');
    vid.setAttribute('preload','auto');
    var source=vid.querySelector('source');
    if(!source){source=document.createElement('source');source.type='video/mp4';vid.appendChild(source);}
    if(source.getAttribute('type')!=='video/mp4') source.setAttribute('type','video/mp4');
    if(source.src!==url){source.src=url;try{vid.load();}catch(e){}}
    var tryPlay=function(){try{var p=vid.play();if(p&&typeof p.then==='function'){p.catch(function(){});}}catch(_){}};
    vid.addEventListener('loadeddata',tryPlay,{once:true});
    vid.addEventListener('canplay',tryPlay,{once:true});
    setTimeout(tryPlay,50);
    var btn=document.querySelector('button[data-cursor-text="Play Video"],button[aria-label="background button"],button.Intro_openVideo__hsZV3');
    if(btn&&!btn.__jordanLagoMediaBound){
      btn.__jordanLagoMediaBound=true;
      btn.addEventListener('click',function(ev){
        try{ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
        if(vid.paused){tryPlay();}else{try{vid.pause();}catch(_){}}}catch(_){}return false;
      },true);
    }
    try{
      var dataBrand=(function(){try{var elb=document.getElementById('__NEXT_DATA__');if(!elb)return{};var d=JSON.parse(elb.textContent||'{}');return(((((d||{}).props||{}).pageProps||{}).cms||{}).content||{}).branding||{};}catch(_){return{};}})();
      var logoUrl=dataBrand.logoUrl||'';
      if(logoUrl){
        var headerLogo=document.querySelector('.Header_logo__ZB7rz');
        if(headerLogo){
          var svgs=headerLogo.querySelectorAll('svg');svgs.forEach(function(n){try{n.remove();}catch(_){}});
          var img=headerLogo.querySelector('img.jlago-logo');
          if(!img){img=document.createElement('img');img.className='jlago-logo';img.alt='logo';img.style.height='20px';img.style.display='inline-block';img.style.verticalAlign='middle';img.style.objectFit='contain';headerLogo.appendChild(img);}
          if(img.src!==logoUrl)img.src=logoUrl;
          if(!headerLogo.dataset.jlagoObs){try{var mo=new MutationObserver(function(){var s=headerLogo.querySelectorAll('svg');s.forEach(function(n){try{n.remove();}catch(_){}});});mo.observe(headerLogo,{childList:true,subtree:false});headerLogo.dataset.jlagoObs='1';}catch(_){}}
        }
      }
    }catch(_){}
  }
  if(document.readyState==='complete'||document.readyState==='interactive'){setTimeout(swap,0);}
  else{document.addEventListener('DOMContentLoaded',swap,{once:true});}
}catch(e){})();
</script>
`
}

/**
 * Branding shim for the homepage: replaces SVG logos with uploaded images
 */
function buildBrandingShim(shimId: string): string {
  return `
<script id="${shimId}">(function(){try{
  function enforce(){
    var dataBrand=(function(){try{var elb=document.getElementById('__NEXT_DATA__');if(!elb)return{};var d=JSON.parse(elb.textContent||'{}');return(((((d||{}).props||{}).pageProps||{}).cms||{}).content||{}).branding||{};}catch(_){return{};}})();
    var logoUrl=dataBrand.logoUrl||'';
    var loaderLogoUrl=dataBrand.loaderLogoUrl||logoUrl;
    if(logoUrl){
      var headerLogo=document.querySelector('.Header_logo__ZB7rz');
      if(headerLogo){
        var svgs=headerLogo.querySelectorAll('svg');svgs.forEach(function(n){try{n.remove();}catch(_){}});
        var img=headerLogo.querySelector('img.jlago-logo');
        if(!img){img=document.createElement('img');img.className='jlago-logo';img.alt='logo';img.style.height='20px';img.style.display='inline-block';img.style.verticalAlign='middle';img.style.objectFit='contain';headerLogo.appendChild(img);}
        if(img.src!==logoUrl)img.src=logoUrl;
        if(!headerLogo.dataset.jlagoObs){try{var mo=new MutationObserver(function(){var s=headerLogo.querySelectorAll('svg');s.forEach(function(n){try{n.remove();}catch(_){}});});mo.observe(headerLogo,{childList:true,subtree:false});headerLogo.dataset.jlagoObs='1';}catch(_){}}
      }
    }
    if(loaderLogoUrl){
      var pl1=document.querySelector('.PreloaderScreen_logo__06yGo');
      if(pl1){try{var svgs1=pl1.querySelectorAll('svg');svgs1.forEach(function(n){try{n.remove();}catch(_){}});var i1=pl1.querySelector('img.jlago-prelogo');if(!i1){i1=document.createElement('img');i1.className='jlago-prelogo';i1.alt='logo';i1.style.height='28px';i1.style.objectFit='contain';pl1.appendChild(i1);}if(i1.src!==loaderLogoUrl)i1.src=loaderLogoUrl;if(!pl1.dataset.jlagoObs){try{var mo1=new MutationObserver(function(){var s=pl1.querySelectorAll('svg');s.forEach(function(n){try{n.remove();}catch(_){}});});mo1.observe(pl1,{childList:true,subtree:true});pl1.dataset.jlagoObs='1';}catch(_){}}pl1.style.display='';pl1.style.backgroundImage='none';}catch(_){}}
      var pl2=document.querySelector('.PreloaderScreen_secondLogo__k4rT4');
      if(pl2){try{var svgs2=pl2.querySelectorAll('svg');svgs2.forEach(function(n){try{n.remove();}catch(_){}});var i2=pl2.querySelector('img.jlago-prelogo-2');if(!i2){i2=document.createElement('img');i2.className='jlago-prelogo-2';i2.alt='logo';i2.style.height='24px';i2.style.objectFit='contain';pl2.appendChild(i2);}if(i2.src!==loaderLogoUrl)i2.src=loaderLogoUrl;if(!pl2.dataset.jlagoObs){try{var mo2=new MutationObserver(function(){var s=pl2.querySelectorAll('svg');s.forEach(function(n){try{n.remove();}catch(_){}});});mo2.observe(pl2,{childList:true,subtree:true});pl2.dataset.jlagoObs='1';}catch(_){}}pl2.style.display='';pl2.style.backgroundImage='none';}catch(_){}}
    }
  }
  if(!document.body.dataset.jlagoGlobalObs){try{var mob=new MutationObserver(function(){try{enforce();}catch(_){}});mob.observe(document.body,{childList:true,subtree:true});document.body.dataset.jlagoGlobalObs='1';}catch(_){}}
  if(document.readyState==='complete'||document.readyState==='interactive'){setTimeout(enforce,0);}else{document.addEventListener('DOMContentLoaded',enforce,{once:true});}
}catch(e){})();
</script>
`
}
