// ========================================================
// PDF Generation Service (pdfkit + qrcode)
// Generates official PDF Invoices and PDF Event Tickets
// ========================================================

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { getBrandSettings } = require('./settingsService');

// Ensure destination directories exist
const invoicesDir = path.join(__dirname, '../uploads/invoices');
const ticketsDir = path.join(__dirname, '../uploads/tickets');
if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });

/**
 * Generate a professional PDF Invoice
 */
async function generateInvoicePDF({ invoiceNumber, invoiceDate, payment, registration, user, event }) {
  const brand = await getBrandSettings();
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const relativePath = `/uploads/invoices/${fileName}`;

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- Header ---
      doc.fillColor('#123B70')
        .fontSize(20)
        .text(`${brand.brand_name.toUpperCase()}`, { align: 'left' });
      doc.fontSize(9)
        .fillColor('#666666')
        .text(`${brand.tagline || 'Official Event Booking & Registration Invoice'}`, { align: 'left' });
      if (brand.address || brand.email || brand.phone) {
        const contactLine = [brand.address, brand.email, brand.phone].filter(Boolean).join(' • ');
        doc.fontSize(8).fillColor('#888888').text(contactLine, { align: 'left' });
      }
      doc.moveDown(0.8);

      // Horizontal line
      doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.5);

      // --- Invoice & Billed To Section (2 Columns) ---
      const topY = doc.y;

      // Left Column: Billed To
      doc.fillColor('#333333').fontSize(11).font('Helvetica-Bold').text('BILLED TO:', 50, topY);
      doc.font('Helvetica').fontSize(10).fillColor('#444444');
      doc.text(user.name || 'Participant Name', 50, topY + 16);
      doc.text(`Email: ${user.email || 'N/A'}`, 50, topY + 30);
      if (user.phone) doc.text(`Phone: ${user.phone}`, 50, topY + 44);

      // Right Column: Invoice Metadata
      const rightX = 350;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333').text('INVOICE DETAILS:', rightX, topY);
      doc.font('Helvetica').fontSize(10).fillColor('#444444');
      doc.text(`Invoice No: ${invoiceNumber}`, rightX, topY + 16);
      doc.text(`Invoice Date: ${new Date(invoiceDate).toLocaleDateString('en-GB')}`, rightX, topY + 30);
      doc.text(`Registration ID: REG-${String(registration.id).padStart(4, '0')}`, rightX, topY + 44);
      if (payment && payment.transaction_number) {
        doc.text(`Transaction ID: ${payment.transaction_number}`, rightX, topY + 58);
      }

      doc.y = topY + 80;
      doc.moveDown(1.5);

      // --- Event Information Box ---
      doc.rect(50, doc.y, 495, 60).fillAndStroke('#F8F9FA', '#E2E8F0');
      const boxY = doc.y + 10;
      doc.fillColor('#123B70').font('Helvetica-Bold').fontSize(12).text(event.title || 'Event Name', 65, boxY);
      doc.fillColor('#555555').font('Helvetica').fontSize(9);
      doc.text(`Date & Time: ${event.date || 'TBD'} at ${event.time || 'TBD'}`, 65, boxY + 18);
      doc.text(`Location / Venue: ${event.location || 'Online'}`, 65, boxY + 32);

      doc.y = boxY + 65;
      doc.moveDown(1);

      // --- Itemized Table ---
      const tableTop = doc.y;
      doc.rect(50, tableTop, 495, 25).fill('#123B70');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
      doc.text('DESCRIPTION', 65, tableTop + 7);
      doc.text('QTY', 370, tableTop + 7);
      doc.text('PRICE', 420, tableTop + 7);
      doc.text('TOTAL', 490, tableTop + 7);

      const itemY = tableTop + 35;
      const amount = Number(payment ? payment.amount : event.registration_fee) || 0;
      doc.fillColor('#333333').font('Helvetica').fontSize(10);
      doc.text(`Event Pass: ${event.title}`, 65, itemY);
      doc.text('1', 375, itemY);
      doc.text(`Rs. ${amount.toFixed(2)}`, 415, itemY);
      doc.text(`Rs. ${amount.toFixed(2)}`, 485, itemY);

      doc.strokeColor('#EEEEEE').lineWidth(1).moveTo(50, itemY + 20).lineTo(545, itemY + 20).stroke();

      // Total Box
      const totalY = itemY + 30;
      doc.rect(340, totalY, 205, 30).fill('#F0FDF4');
      doc.fillColor('#047857').font('Helvetica-Bold').fontSize(12);
      doc.text(`Total Paid: Rs. ${amount.toFixed(2)}`, 355, totalY + 8);

      // Paid Badge / Stamp
      doc.rect(50, totalY, 120, 30).fillAndStroke('#DCFCE7', '#16A34A');
      doc.fillColor('#15803D').font('Helvetica-Bold').fontSize(12);
      doc.text('PAID & VERIFIED', 60, totalY + 8);

      // --- Footer ---
      doc.fontSize(9).fillColor('#888888').font('Helvetica');
      doc.text('This is a computer-generated invoice and requires no physical signature.', 50, 720, { align: 'center', width: 495 });
      doc.text(`${brand.brand_name} — Official Event Management System`, 50, 735, { align: 'center', width: 495 });

      doc.end();

      stream.on('finish', () => resolve(relativePath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate a professional event admission ticket PDF (A5 Portrait)
 */
async function generateTicketPDF({ ticketNumber, registration, user, event, payment, verificationToken }) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = `${ticketNumber}.pdf`;
      const filePath = path.join(ticketsDir, fileName);
      const relativePath = `/uploads/tickets/${fileName}`;

      const brand = await getBrandSettings();

      // Secure verification identifier: verificationToken or ticketNumber
      const tokenToEncode = verificationToken || ticketNumber;
      
      // QR Code encodes clean verification identifier (zero attendee PII leaked)
      const qrBuffer = await QRCode.toBuffer(tokenToEncode, {
        width: 140,
        margin: 1,
        color: { dark: '#0F172A', light: '#FFFFFF' }
      });

      // A5 dimensions in points: [419.53, 595.28]
      const pageWidth = 419.53;
      const pageHeight = 595.28;
      const cardMargin = 16;
      const cardX = cardMargin;
      const cardY = cardMargin;
      const cardWidth = pageWidth - (cardMargin * 2);
      const cardHeight = pageHeight - (cardMargin * 2);

      const doc = new PDFDocument({
        size: 'A5',
        layout: 'portrait',
        margin: 0
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Outer Card Background with Rounded Corners & Subtle Border
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 10)
        .strokeColor('#CBD5E1')
        .lineWidth(1.5)
        .fillAndStroke('#FFFFFF', '#CBD5E1');

      // 1. Header Banner
      const headerHeight = 62;
      doc.save();
      doc.roundedRect(cardX, cardY, cardWidth, headerHeight, 10).clip();
      doc.rect(cardX, cardY, cardWidth, headerHeight).fill('#0F172A');
      doc.restore();

      // Brand Title
      doc.fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text((brand.brand_name || 'Event Management').toUpperCase(), cardX + 16, cardY + 14);

      doc.fillColor('#94A3B8')
        .font('Helvetica')
        .fontSize(8.5)
        .text('OFFICIAL EVENT ADMISSION TICKET', cardX + 16, cardY + 32);

      // Category / Type Pill on Right
      const catText = (event.category_name || event.category || 'General').toUpperCase();
      const catWidth = Math.max(70, doc.widthOfString(catText, { font: 'Helvetica-Bold', size: 8 }) + 18);
      const catX = cardX + cardWidth - catWidth - 16;
      
      doc.roundedRect(catX, cardY + 16, catWidth, 22, 11).fill('#2563EB');
      doc.fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(catText, catX, cardY + 23, { width: catWidth, align: 'center' });

      // 2. Main Event Section
      let currY = cardY + headerHeight + 16;

      doc.fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(17)
        .text(event.title || 'Event Name', cardX + 18, currY, { width: cardWidth - 36, ellipsis: true });
      currY += 26;

      // Event Details Grid (Date, Time, Venue)
      const colWidth = (cardWidth - 36) / 3;

      // Date Block
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('DATE', cardX + 18, currY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(event.date || 'TBD', cardX + 18, currY + 10, { width: colWidth - 8 });

      // Time Block
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('TIME', cardX + 18 + colWidth, currY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(event.time || 'TBD', cardX + 18 + colWidth, currY + 10, { width: colWidth - 8 });

      // Venue Block
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('VENUE', cardX + 18 + (colWidth * 2), currY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(event.location || event.venue || 'Main Venue', cardX + 18 + (colWidth * 2), currY + 10, { width: colWidth - 4 });

      currY += 36;

      // 3. Ticket Perforation Line with Side Notches
      const perfY = currY + 4;
      doc.strokeColor('#E2E8F0')
        .lineWidth(1)
        .dash(5, { space: 4 })
        .moveTo(cardX + 14, perfY)
        .lineTo(cardX + cardWidth - 14, perfY)
        .stroke()
        .undash();

      // Side Notch Circles (giving realistic ticket coupon appearance)
      doc.circle(cardX, perfY, 8).fill('#F8FAFC');
      doc.circle(cardX + cardWidth, perfY, 8).fill('#F8FAFC');

      // 4. Attendee & Identification Section
      currY = perfY + 14;

      // Attendee Box (Left) & QR Code Box (Right)
      const leftColWidth = cardWidth - 160;

      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('ATTENDEE', cardX + 18, currY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text(user.name || 'Participant Name', cardX + 18, currY + 11, { width: leftColWidth - 10 });
      doc.fillColor('#475569').font('Helvetica').fontSize(9).text(user.email || '', cardX + 18, currY + 27, { width: leftColWidth - 10 });

      // Registration ID
      const regIdFormatted = `REG-${new Date().getFullYear()}-${String(registration.id).padStart(5, '0')}`;
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('REGISTRATION ID', cardX + 18, currY + 44);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(regIdFormatted, cardX + 18, currY + 54);

      // Ticket Number
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('TICKET NUMBER', cardX + 18, currY + 70);
      doc.fillColor('#2563EB').font('Helvetica-Bold').fontSize(10.5).text(ticketNumber, cardX + 18, currY + 80);

      // Pass Type
      const isPaid = Number(event.registration_fee || (payment ? payment.amount : 0)) > 0;
      const passTypeText = isPaid ? `PAID PASS (Rs. ${Number(event.registration_fee).toFixed(2)})` : 'FREE ADMISSION PASS';
      doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(7.5).text('PASS TYPE', cardX + 18, currY + 98);
      doc.fillColor('#0F172A').font('Helvetica').fontSize(9).text(passTypeText, cardX + 18, currY + 108);

      // 5. QR Code Section (Right Side)
      const qrBoxX = cardX + cardWidth - 138;
      const qrBoxY = currY;
      
      doc.roundedRect(qrBoxX, qrBoxY, 122, 122, 6).strokeColor('#E2E8F0').lineWidth(1).fillAndStroke('#FFFFFF', '#E2E8F0');
      doc.image(qrBuffer, qrBoxX + 6, qrBoxY + 6, { width: 110, height: 110 });

      doc.fillColor('#64748B')
        .font('Helvetica-Bold')
        .fontSize(7)
        .text('SCAN AT ENTRY GATE', qrBoxX, qrBoxY + 124, { width: 122, align: 'center' });

      currY += 138;

      // 6. Status Banner: CONFIRMED & VERIFIED
      const statusBannerY = currY;
      const bannerHeight = 36;
      doc.roundedRect(cardX + 16, statusBannerY, cardWidth - 32, bannerHeight, 6)
        .fillAndStroke('#F0FDF4', '#86EFAC');

      doc.fillColor('#15803D')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('CONFIRMED', cardX + 28, statusBannerY + 8);

      const paymentVerifiedLabel = isPaid ? '✓ PAYMENT VERIFIED' : '✓ ADMISSION CONFIRMED';
      doc.fillColor('#166534')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(`${paymentVerifiedLabel}   •   ✓ REGISTRATION CONFIRMED`, cardX + 28, statusBannerY + 21);

      // 7. Ticket Instructions & Security Code
      currY = statusBannerY + bannerHeight + 14;

      doc.fillColor('#64748B')
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Verification Ref: ${tokenToEncode}`, cardX + 18, currY);
      currY += 14;

      // 8. Footer Strip
      const footerY = cardY + cardHeight - 48;
      doc.roundedRect(cardX + 1, footerY, cardWidth - 2, 47, 8).fill('#F8FAFC');

      doc.fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('Please present this ticket at the event entrance.', cardX + 16, footerY + 10);

      doc.fillColor('#64748B')
        .font('Helvetica')
        .fontSize(7.5)
        .text('This ticket is valid only for the registered attendee. Non-transferable.', cardX + 16, footerY + 22);

      doc.fillColor('#94A3B8')
        .font('Helvetica-Bold')
        .fontSize(7)
        .text(brand.brand_name, cardX + cardWidth - 130, footerY + 22, { width: 114, align: 'right' });

      doc.end();

      stream.on('finish', () => resolve(relativePath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateInvoicePDF,
  generateTicketPDF
};
