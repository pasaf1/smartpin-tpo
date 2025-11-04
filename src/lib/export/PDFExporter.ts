import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Pin {
  id: string
  seq_number: number
  status: string
  issue_type?: string
  defect_type?: string
  defect_layer?: string
  severity?: number
  created_at: string
  x_position: number
  y_position: number
  opening_photo_url?: string
  closing_photo_url?: string
  mttr_hours?: number
}

interface PinChild {
  id: string
  child_seq: string
  status: string
  opening_photo_url?: string
  closing_photo_url?: string
  defect_type?: string
  created_at: string
}

interface PDFExportOptions {
  includeMap: boolean
  includePhotos: boolean
  includeDetails: boolean
  companyLogo?: string
  projectName?: string
  contractorName?: string
}

export class PDFExporter {
  private doc: jsPDF
  private pageHeight = 297 // A4 height in mm
  private pageWidth = 210 // A4 width in mm
  private margin = 20
  private currentY = 0

  constructor() {
    this.doc = new jsPDF()
  }

  async exportPin(
    pin: Pin, 
    children: PinChild[] = [], 
    options: PDFExportOptions = {
      includeMap: true,
      includePhotos: true,
      includeDetails: true
    }
  ): Promise<void> {
    this.currentY = this.margin

    // Page 1: Header and Details
    await this.addHeader(pin, options)
    
    if (options.includeDetails) {
      this.addPinDetails(pin)
    }
    
    if (options.includeMap) {
      await this.addMapSnapshot(pin)
    }

    if (children.length > 0) {
      this.addChildrenSummary(children)
    }

    // Additional pages: Photos
    if (options.includePhotos) {
      await this.addPhotoPages(pin, children)
    }

    // Save the PDF
    const filename = `SmartPin_Issue_${pin.seq_number}_${new Date().toISOString().split('T')[0] || ''}.pdf`
    this.doc.save(filename)
  }

  async exportMultiplePins(
    pins: Pin[],
    options: PDFExportOptions & { includeSummary?: boolean } = {
      includeMap: false,
      includePhotos: false,
      includeDetails: true,
      includeSummary: true
    }
  ): Promise<void> {
    this.currentY = this.margin

    // Summary page
    if (options.includeSummary) {
      await this.addProjectSummary(pins, options)
    }

    // Individual pin pages
    for (let i = 0; i < pins.length; i++) {
      if (i > 0) {
        this.doc.addPage()
        this.currentY = this.margin
      }

      const pin = pins[i]
      if (!pin) continue

      await this.addHeader(pin, options, false) // No logo on subsequent pages

      if (options.includeDetails) {
        this.addPinDetails(pin)
      }

      if (options.includeMap) {
        await this.addMapSnapshot(pin)
      }
    }

    const filename = `SmartPin_Issues_Report_${new Date().toISOString().split('T')[0] || ''}.pdf`
    this.doc.save(filename)
  }

  private async addHeader(pin: Pin, options: PDFExportOptions, includeLogo = true): Promise<void> {
    // Company Logo (if provided and includeLogo is true)
    if (options.companyLogo && includeLogo) {
      try {
        const logoImg = await this.loadImage(options.companyLogo)
        this.doc.addImage(logoImg, 'PNG', this.pageWidth - 60, this.margin, 40, 20)
      } catch (error) {
        console.warn('Could not load company logo:', error)
      }
    }

    // Title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('SmartPin TPO - Issue Report', this.margin, this.currentY + 10)
    
    this.currentY += 20

    // Project info
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    if (options.projectName) {
      this.doc.text(`Project: ${options.projectName}`, this.margin, this.currentY)
      this.currentY += 7
    }
    
    if (options.contractorName) {
      this.doc.text(`Contractor: ${options.contractorName}`, this.margin, this.currentY)
      this.currentY += 7
    }

    // Issue ID and basic info
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(`Issue ID: ${pin.id}`, this.margin, this.currentY)
    this.currentY += 7
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Pin #${pin.seq_number} | Status: ${pin.status}`, this.margin, this.currentY)
    this.currentY += 7
    
    this.doc.text(`Created: ${new Date(pin.created_at).toLocaleDateString()}`, this.margin, this.currentY)
    this.currentY += 15
  }

  private addPinDetails(pin: Pin): void {
    // Details section
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(14)
    this.doc.text('Issue Details', this.margin, this.currentY)
    this.currentY += 10

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(11)

    const details = [
      ['Issue Type:', pin.issue_type || 'Not specified'],
      ['Defect Type:', pin.defect_type || 'Not specified'],
      ['Defect Layer:', pin.defect_layer || 'Not specified'],
      ['Severity:', pin.severity ? `Level ${pin.severity}` : 'Not specified'],
      ['Position:', `X: ${(pin.x_position * 100).toFixed(1)}%, Y: ${(pin.y_position * 100).toFixed(1)}%`],
      ['MTTR:', pin.mttr_hours ? `${pin.mttr_hours} hours` : 'In progress']
    ]

    details.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label || '', this.margin, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value || '', this.margin + 35, this.currentY)
      this.currentY += 6
    })

    this.currentY += 10
  }

  private async addMapSnapshot(pin: Pin): Promise<void> {
    // Try to capture canvas or create a placeholder
    try {
      const mapCanvas = await this.captureMapArea(pin)
      if (mapCanvas) {
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('Location Map', this.margin, this.currentY)
        this.currentY += 10

        // Add the map image
        this.doc.addImage(mapCanvas, 'PNG', this.margin, this.currentY, 170, 100)
        this.currentY += 110
      }
    } catch (error) {
      console.warn('Could not capture map snapshot:', error)
      // Add placeholder text
      this.doc.setFont('helvetica', 'italic')
      this.doc.text('Map snapshot not available', this.margin, this.currentY)
      this.currentY += 10
    }
  }

  private addChildrenSummary(children: PinChild[]): void {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage()
      this.currentY = this.margin
    }

    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(14)
    this.doc.text('Child Issues Summary', this.margin, this.currentY)
    this.currentY += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')

    // Summary stats
    const totalChildren = children.length
    const openChildren = children.filter(c => c.status === 'Open').length
    const closedChildren = children.filter(c => c.status === 'Closed').length

    this.doc.text(`Total Child Issues: ${totalChildren}`, this.margin, this.currentY)
    this.currentY += 6
    this.doc.text(`Open: ${openChildren} | Closed: ${closedChildren}`, this.margin, this.currentY)
    this.currentY += 15

    // Individual children
    children.forEach((child, index) => {
      if (this.currentY > this.pageHeight - 30) {
        this.doc.addPage()
        this.currentY = this.margin
      }

      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`${child.child_seq}:`, this.margin, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`${child.status} - ${child.defect_type || 'No description'}`, this.margin + 15, this.currentY)
      this.currentY += 6
    })
  }

  private async addPhotoPages(pin: Pin, children: PinChild[]): Promise<void> {
    const allPins = [pin, ...children]

    for (const currentPin of allPins) {
      const hasOpeningPhoto = currentPin.opening_photo_url
      const hasClosingPhoto = currentPin.closing_photo_url

      if (!hasOpeningPhoto && !hasClosingPhoto) {
        continue // Skip if no photos
      }

      // New page for photos
      this.doc.addPage()
      this.currentY = this.margin

      // Page header
      const pinLabel = 'seq_number' in currentPin ? `Pin #${currentPin.seq_number}` : `Pin ${(currentPin as PinChild).child_seq}`
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(16)
      this.doc.text(`${pinLabel} - Photos`, this.margin, this.currentY)
      this.currentY += 15

      const photoWidth = 80
      const photoHeight = 80

      try {
        // Opening Photo (Left)
        if (hasOpeningPhoto) {
          const openingImg = await this.loadImage(currentPin.opening_photo_url!)
          this.doc.addImage(openingImg, 'JPEG', this.margin, this.currentY, photoWidth, photoHeight)
          
          this.doc.setFont('helvetica', 'bold')
          this.doc.setFontSize(12)
          this.doc.text('Opening Photo', this.margin, this.currentY + photoHeight + 7)
        }

        // Closing Photo (Right)  
        if (hasClosingPhoto) {
          const closingImg = await this.loadImage(currentPin.closing_photo_url!)
          this.doc.addImage(closingImg, 'JPEG', this.margin + photoWidth + 10, this.currentY, photoWidth, photoHeight)
          
          this.doc.setFont('helvetica', 'bold') 
          this.doc.setFontSize(12)
          this.doc.text('Closing Photo', this.margin + photoWidth + 10, this.currentY + photoHeight + 7)
        }

        this.currentY += photoHeight + 20

        // Status and date info
        this.doc.setFont('helvetica', 'normal')
        this.doc.setFontSize(10)
        this.doc.text(`Status: ${currentPin.status}`, this.margin, this.currentY)
        this.doc.text(`Date: ${new Date(currentPin.created_at).toLocaleDateString()}`, this.margin, this.currentY + 5)

      } catch (error) {
        console.warn('Error loading photos:', error)
        this.doc.setFont('helvetica', 'italic')
        this.doc.text('Photos could not be loaded', this.margin, this.currentY)
      }
    }
  }

  private async addProjectSummary(pins: Pin[], options: PDFExportOptions): Promise<void> {
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(18)
    this.doc.text('Project Issues Summary', this.margin, this.currentY)
    this.currentY += 15

    // Project info
    if (options.projectName) {
      this.doc.setFontSize(14)
      this.doc.text(`Project: ${options.projectName}`, this.margin, this.currentY)
      this.currentY += 10
    }

    // Summary statistics
    const totalPins = pins.length
    const openPins = pins.filter(p => p.status === 'Open').length
    const readyPins = pins.filter(p => p.status === 'ReadyToInspect').length
    const closedPins = pins.filter(p => p.status === 'Closed').length
    const disputedPins = pins.filter(p => p.status === 'InDispute').length

    const avgMTTR = pins
      .filter(p => p.mttr_hours)
      .reduce((sum, p) => sum + (p.mttr_hours || 0), 0) / pins.filter(p => p.mttr_hours).length || 0

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(12)

    const summaryData = [
      ['Total Issues:', totalPins.toString()],
      ['Open:', openPins.toString()],
      ['Ready to Inspect:', readyPins.toString()],
      ['Closed:', closedPins.toString()],
      ['In Dispute:', disputedPins.toString()],
      ['Average MTTR:', avgMTTR > 0 ? `${avgMTTR.toFixed(1)} hours` : 'N/A'],
      ['Report Generated:', new Date().toLocaleString()]
    ]

    summaryData.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(label || '', this.margin, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value || '', this.margin + 50, this.currentY)
      this.currentY += 7
    })

    this.currentY += 10

    // Issues by type breakdown
    const issueTypeCount = pins.reduce((acc, pin) => {
      const type = pin.issue_type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    if (Object.keys(issueTypeCount).length > 0) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Issues by Type:', this.margin, this.currentY)
      this.currentY += 7

      this.doc.setFont('helvetica', 'normal')
      Object.entries(issueTypeCount).forEach(([type, count]) => {
        this.doc.text(`${type}: ${count}`, this.margin + 5, this.currentY)
        this.currentY += 6
      })
    }
  }

  private async captureMapArea(pin: Pin): Promise<string | null> {
    // Try to capture from Konva canvas if available
    try {
      // Look for Konva stages in the DOM
      const konvaContainer = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement
      if (konvaContainer) {
        // Create a focused view around the pin
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = 400
        canvas.height = 300

        // Draw the relevant portion of the canvas
        ctx.drawImage(konvaContainer, 0, 0, canvas.width, canvas.height)
        
        return canvas.toDataURL('image/png')
      }
    } catch (error) {
      console.warn('Could not capture Konva canvas:', error)
    }

    // Fallback: Create a simple map placeholder
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 400
      canvas.height = 300

      // Draw background
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw border
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)

      // Draw pin location
      const pinX = pin.x_position * canvas.width
      const pinY = pin.y_position * canvas.height

      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(pinX, pinY, 10, 0, 2 * Math.PI)
      ctx.fill()

      // Add pin number
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(pin.seq_number.toString(), pinX, pinY + 4)

      // Add title
      ctx.fillStyle = '#333'
      ctx.font = '16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('Roof Plan Location', 10, 25)

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.warn('Could not create map placeholder:', error)
      return null
    }
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }
}