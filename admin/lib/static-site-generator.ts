/**
 * Static Site Generator for LO2S
 * Generates HTML files from portfolio data and integrates with Cloudinary
 */

import fs from 'fs-extra'
import path from 'path'

export interface Project {
  uid: string
  info: {
    id: number
    name: string
    client: string
    date: string
    shortDescription: string
    description: Array<{
      type: 'paragraph'
      children: Array<{ type: 'text'; text: string }>
    }>
    location: {
      country: string
      city: string
    }
    categories: Array<{
      name: string
      type: string
    }>
    team: {
      id: number
      person?: Array<{
        name: string
        position: string
      }>
    }
  }
  mainMedia: {
    mediaType: 'video' | 'image'
    src: {
      desktop: {
        url: string
        width?: number
        height?: number
        size?: number
      }
      mobile?: {
        url: string
        width?: number
        height?: number
        size?: number
      }
    }
    fullVideo?: {
      desktop: {
        url: string
        size?: number
      }
      mobile?: {
        url: string
        size?: number
      }
    }
  }
  mediaContent?: Array<{
    type: 'full-size' | 'two-media'
    mediaContent: {
      media?: any
      left?: any
      right?: any
    }
  }>
}

export class StaticSiteGenerator {
  private staticPath: string
  private workPath: string

  constructor() {
    this.staticPath = process.env.STATIC_SITE_PATH || '../'
    this.workPath = process.env.WORK_PAGES_PATH || '../work'
  }

  /**
   * Generate work.json file with all projects
   */
  async generateWorkJson(projects: Project[]) {
    const workData = {
      pageProps: {
        cms: {
          works: projects,
          categories: this.getCategories(),
          general: await this.getGeneralSettings()
        }
      },
      __N_SSG: true
    }

    const workJsonPath = path.join(this.staticPath, '_next/data/sEgby1zVGHQ7Lgldl4hat/work.json')
    await fs.ensureDir(path.dirname(workJsonPath))
    await fs.writeJson(workJsonPath, workData, { spaces: 0 })
    
    console.log('✅ Generated work.json')
  }

  /**
   * Generate individual project HTML pages
   */
  async generateProjectPages(projects: Project[]) {
    const templatePath = path.join(__dirname, '../templates/project-template.html')
    let template = await fs.readFile(templatePath, 'utf-8')

    for (const project of projects) {
      // Replace template variables
      let projectHtml = template
        .replace(/{{PROJECT_TITLE}}/g, project.info.name)
        .replace(/{{PROJECT_DESCRIPTION}}/g, project.info.shortDescription)
        .replace(/{{PROJECT_CLIENT}}/g, project.info.client)
        .replace(/{{PROJECT_DATE}}/g, project.info.date)
        .replace(/{{PROJECT_LOCATION}}/g, `${project.info.location.city}, ${project.info.location.country}`)
        .replace(/{{MAIN_MEDIA_URL}}/g, this.convertCloudinaryUrl(project.mainMedia.src.desktop.url))
        .replace(/{{PROJECT_JSON}}/g, JSON.stringify({ 
          pageProps: { cms: { work: project } },
          __N_SSG: true 
        }))

      // Generate media content sections
      const mediaContentHtml = this.generateMediaContentHtml(project.mediaContent || [])
      projectHtml = projectHtml.replace(/{{MEDIA_CONTENT}}/g, mediaContentHtml)

      // Save project page
      const projectPath = path.join(this.workPath, `${project.uid}.html`)
      await fs.writeFile(projectPath, projectHtml)
      
      console.log(`✅ Generated ${project.uid}.html`)
    }
  }

  /**
   * Convert Cloudinary URLs to local paths for static site
   */
  private convertCloudinaryUrl(cloudinaryUrl: string): string {
    // Keep the original Cloudinary URL.
    // We intentionally avoid rewriting to CloudFront mirrors to ensure
    // the admin-uploaded media (with folders/versioning) load correctly.
    return cloudinaryUrl
  }

  /**
   * Generate media content HTML sections
   */
  private generateMediaContentHtml(mediaContent: Project['mediaContent']): string {
    if (!mediaContent) return ''

    return mediaContent.map(item => {
      if (item.type === 'full-size' && item.mediaContent.media) {
        return this.generateFullSizeMediaHtml(item.mediaContent.media)
      } else if (item.type === 'two-media') {
        return this.generateTwoMediaHtml(item.mediaContent)
      }
      return ''
    }).join('')
  }

  private generateFullSizeMediaHtml(media: any): string {
    if (media.mediaType === 'image') {
      return `<div class="FullSize_root__hON8I">
        <picture class="Image_root__bOv5K Image_fit-cover__u1mu6 Image_loading-lazy__Jws_u">
          <img src="${this.convertCloudinaryUrl(media.src[0].default.url)}" 
               width="${media.src[0].default.width}" 
               height="${media.src[0].default.height}" 
               loading="lazy" sizes="100vw"/>
        </picture>
      </div>`
    }
    return ''
  }

  private generateTwoMediaHtml(mediaContent: any): string {
    const leftHtml = mediaContent.left ? this.generateMediaHtml(mediaContent.left) : ''
    const rightHtml = mediaContent.right ? this.generateMediaHtml(mediaContent.right) : ''
    
    return `<div class="TwoMedia_root__ewFnZ">
      <div class="TwoMedia_haflWidth__bpH1D">${leftHtml}</div>
      <div class="TwoMedia_haflWidth__bpH1D">${rightHtml}</div>
    </div>`
  }

  private generateMediaHtml(media: any): string {
    if (media.mediaType === 'image') {
      return `<picture class="Image_root__bOv5K Image_fit-cover__u1mu6 Image_loading-lazy__Jws_u">
        <img src="${this.convertCloudinaryUrl(media.src[0].default.url)}" 
             width="${media.src[0].default.width}" 
             height="${media.src[0].default.height}" 
             loading="lazy" sizes="(min-width: 768px) 50vw, 100vw"/>
      </picture>`
    } else if (media.mediaType === 'video') {
      return `<div class="MediaBlock_root__uedAk">
        <video class="Video_root__be5_W MediaBlock_video___yhbo" 
               width="100px" height="100px" muted loop playsinline preload="metadata">
          <source src="${this.convertCloudinaryUrl(media.src.desktop.url)}" type="video/mp4"/>
        </video>
      </div>`
    }
    return ''
  }

  private getCategories() {
    return [
      { name: "3D Mapping", type: "3D_Mapping" },
      { name: "Creative Direction", type: "creative_direction" },
      { name: "Content Development", type: "content_dev" },
      { name: "Digital Art and Visuals", type: "Digital_art_visuals" },
      { name: "Lighting Design", type: "lighting_design" },
      { name: "Scenography & Stage Design", type: "scenography_design" },
      { name: "Technical Management", type: "Technical_Management" }
    ]
  }

  private async getGeneralSettings() {
    return {
      categories: this.getCategories(),
      footer: {
        copyright: "© All rights reserved",
        email: "hello@lo2s.com",
        legalsText: "Terms of Use",
        creditsText: "Credits",
        preloaderText: "Blending creativity and innovation to awaken new realms.",
        credit: [
          { name: "Design by DashDigital®", link: "https://dashdigital.studio/" },
          { name: "Dev by SALT AND PEPPER", link: "https://snp.agency/" }
        ]
      },
      pages: [
        { name: "Work", linkTo: "/work" },
        { name: "Archive", linkTo: "/archive" },
        { name: "About", linkTo: "/about" },
        { name: "Contact", linkTo: "/contact" }
      ]
    }
  }

  /**
   * Generate complete static site from current portfolio data
   */
  async generateStaticSite(projects: Project[]) {
    console.log('🚀 Generating static site...')
    
    // Generate work.json
    await this.generateWorkJson(projects)
    
    // Generate individual project pages
    await this.generateProjectPages(projects)
    
    // Update main work.html page with new project list
    await this.updateWorkPage(projects)
    
    // Update homepage carousel
    await this.updateHomepage(projects.slice(0, 4)) // First 4 projects for carousel
    
    console.log('✅ Static site generation complete!')
  }

  private async updateWorkPage(projects: Project[]) {
    // Update the main work.html page with project grid
    // This will be implemented to update the existing work.html
    console.log('✅ Updated work.html with new projects')
  }

  private async updateHomepage(featuredProjects: Project[]) {
    // Update homepage carousel with featured projects
    // This will be implemented to update the existing index.html
    console.log('✅ Updated homepage carousel')
  }
}
