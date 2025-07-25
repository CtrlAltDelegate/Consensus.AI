const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFGenerator {
  constructor() {
    this.defaultOptions = {
      fontSize: 12,
      margin: 50,
      lineHeight: 1.5
    };
  }

  async generateConsensusReport(consensusData, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      let yPosition = height - config.margin;

      // Title
      page.drawText('Consensus Analysis Report', {
        x: config.margin,
        y: yPosition,
        size: 18,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 40;

      // Metadata
      page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: config.margin,
        y: yPosition,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      yPosition -= 20;
      page.drawText(`Confidence Level: ${(consensusData.confidence * 100).toFixed(1)}%`, {
        x: config.margin,
        y: yPosition,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5)
      });

      yPosition -= 40;

      // Topic
      if (consensusData.topic) {
        page.drawText('Topic:', {
          x: config.margin,
          y: yPosition,
          size: 14,
          font: timesRomanBoldFont
        });
        
        yPosition -= 20;
        yPosition = this.addWrappedText(page, consensusData.topic, config.margin, yPosition, width - 2 * config.margin, config, timesRomanFont);
        yPosition -= 20;
      }

      // Consensus Content
      page.drawText('Consensus Analysis:', {
        x: config.margin,
        y: yPosition,
        size: 14,
        font: timesRomanBoldFont
      });
      
      yPosition -= 20;
      yPosition = this.addWrappedText(page, consensusData.consensus, config.margin, yPosition, width - 2 * config.margin, config, timesRomanFont);

      // Sources section
      if (consensusData.sources && consensusData.sources.length > 0) {
        yPosition -= 30;
        
        if (yPosition < config.margin + 100) {
          page = pdfDoc.addPage();
          yPosition = height - config.margin;
        }

        page.drawText('Sources Analyzed:', {
          x: config.margin,
          y: yPosition,
          size: 14,
          font: timesRomanBoldFont
        });
        
        yPosition -= 20;
        
        consensusData.sources.forEach((source, index) => {
          if (yPosition < config.margin + 50) {
            page = pdfDoc.addPage();
            yPosition = height - config.margin;
          }
          
          const sourceText = `${index + 1}. ${source.provider} (${source.model}) - ${source.tokenUsage} tokens`;
          page.drawText(sourceText, {
            x: config.margin,
            y: yPosition,
            size: 10,
            font: timesRomanFont
          });
          
          yPosition -= 15;
        });
      }

      // Footer
      const totalPages = pdfDoc.getPageCount();
      const pages = pdfDoc.getPages();
      
      pages.forEach((page, index) => {
        page.drawText(`Page ${index + 1} of ${totalPages}`, {
          x: width - 100,
          y: 20,
          size: 8,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5)
        });
      });

      return await pdfDoc.save();
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  addWrappedText(page, text, x, y, maxWidth, config, font) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, config.fontSize);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    let currentY = y;
    lines.forEach(line => {
      page.drawText(line, {
        x,
        y: currentY,
        size: config.fontSize,
        font
      });
      currentY -= config.fontSize * config.lineHeight;
    });

    return currentY;
  }

  async generateTokenUsageReport(user, period = 'monthly') {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Title
    page.drawText('Token Usage Report', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont
    });
    
    yPosition -= 40;

    // User info
    page.drawText(`User: ${user.email}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font
    });
    
    yPosition -= 20;
    page.drawText(`Subscription: ${user.subscription.tier}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font
    });

    yPosition -= 40;

    // Usage stats
    page.drawText('Usage Statistics:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont
    });
    
    yPosition -= 25;
    page.drawText(`Current Period Used: ${user.tokenUsage.currentPeriodUsed.toLocaleString()} tokens`, {
      x: 50,
      y: yPosition,
      size: 12,
      font
    });
    
    yPosition -= 20;
    page.drawText(`Total Lifetime Used: ${user.tokenUsage.totalLifetimeUsed.toLocaleString()} tokens`, {
      x: 50,
      y: yPosition,
      size: 12,
      font
    });

    return await pdfDoc.save();
  }
}

module.exports = new PDFGenerator(); 