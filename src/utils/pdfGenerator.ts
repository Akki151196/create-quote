import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LineItem {
  item_name: string;
  description: string;
  unit_price: number;
  quantity: number;
  total: number;
  category?: string;
}

interface QuotationData {
  quotation_number: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  event_date: string;
  service_date?: string;
  event_type: string;
  event_venue?: string;
  number_of_guests: number;
  subtotal: number;
  service_charges: number;
  external_charges: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  grand_total: number;
  validity_days: number;
  remarks?: string;
  terms_and_conditions: string;
  items: LineItem[];
  advance_paid?: number;
  balance_due?: number;
  company_details?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    website?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    logo?: string;
  };
}

const DEFAULT_COMPANY_DETAILS = {
  name: 'The Royal Catering Service & Events',
  address: '',
  phone: '',
  email: '',
  gstin: '',
  website: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
};

const DEFAULT_TERMS = `1. 50% advance payment required to confirm booking
2. Balance payment due before event date
3. Any changes to menu must be informed 5 days prior
4. Prices are subject to change without notice
5. GST as applicable will be charged extra`;

const DEFAULT_BANK_DETAILS = `Bank Name: HDFC Bank
Account Name: The Royal Catering Service & Events
Account Number: XXXX XXXX XXXX
IFSC Code: HDFCXXXXXXX
UPI ID: royalcatering@hdfc`;

function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.00';

  const formatted = numValue.toFixed(2);
  const parts = formatted.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedInteger = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return `${formattedInteger}.${decimalPart}`;
}

function sanitizeText(text: string): string {
  if (!text) return '';
  return text.replace(/[^\x20-\x7E\u00A0-\u00FF\u0900-\u097F]/g, '').trim();
}

async function addLogoToPDF(doc: jsPDF, xPos: number, yPos: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeoutId = setTimeout(() => {
      reject(new Error('Logo loading timed out'));
    }, 3000);

    img.onload = function() {
      clearTimeout(timeoutId);
      try {
        if (!img.complete || !img.naturalWidth) {
          reject(new Error('Image failed to load properly'));
          return;
        }
        const imgWidth = 25;
        const imgHeight = 25;
        doc.addImage(img, 'PNG', xPos, yPos, imgWidth, imgHeight);
        resolve();
      } catch (error) {
        console.warn('Failed to add image to PDF:', error);
        reject(error);
      }
    };

    img.onerror = function(error) {
      clearTimeout(timeoutId);
      console.warn('Failed to load logo image:', error);
      reject(new Error('Logo image failed to load'));
    };

    try {
      img.src = '/xraakgc9_img_0167-removebg-preview.png';
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

async function addLogoToHeader(doc: jsPDF, xPos: number, yPos: number, size: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        doc.addImage(img, 'PNG', xPos, yPos, size, size);
        resolve();
      } catch (error) {
        console.warn('Error adding logo:', error);
        resolve();
      }
    };

    img.onerror = () => {
      console.warn('Logo load failed');
      resolve();
    };

    img.src = '/Gemini_Generated_Image_ui2uh7ui2uh7ui2u-removebg-preview.png';

    setTimeout(() => resolve(), 2000);
  });
}

async function addWatermark(doc: jsPDF): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const watermarkSize = 80;
        const xPos = (pageWidth - watermarkSize) / 2;
        const yPos = (pageHeight - watermarkSize) / 2;

        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        doc.addImage(img, 'PNG', xPos, yPos, watermarkSize, watermarkSize);
        doc.restoreGraphicsState();
        resolve();
      } catch (error) {
        console.warn('Error adding watermark:', error);
        resolve();
      }
    };

    img.onerror = () => {
      console.warn('Watermark load failed');
      resolve();
    };

    img.src = '/Gemini_Generated_Image_ui2uh7ui2uh7ui2u-removebg-preview.png';

    setTimeout(() => resolve(), 2000);
  });
}

function addProfessionalHeader(
  doc: jsPDF,
  companyDetails: any,
  documentType: string,
  documentNumber: string,
  documentDate: string,
  eventDate?: string,
  validUntil?: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 18;

  doc.setFillColor(123, 0, 0);
  doc.rect(0, 0, pageWidth, 10, 'F');

  yPos = 25;

  const logoSize = 28;
  const logoX = 25;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(123, 0, 0);
  const companyNameLines = doc.splitTextToSize(sanitizeText(companyDetails.name), 85);
  doc.text(companyNameLines, logoX + logoSize + 5, yPos);

  const nameHeight = companyNameLines.length * 5.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Making Your Events Memorable', logoX + logoSize + 5, yPos + nameHeight + 2);

  yPos = Math.max(yPos + nameHeight + 10, 48);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  if (companyDetails.address) {
    doc.text(sanitizeText(companyDetails.address), logoX + logoSize + 5, yPos);
    yPos += 4;
  }
  if (companyDetails.phone) {
    doc.text(`Phone: ${sanitizeText(companyDetails.phone)}`, logoX + logoSize + 5, yPos);
    yPos += 4;
  }
  if (companyDetails.email) {
    doc.text(`Email: ${sanitizeText(companyDetails.email)}`, logoX + logoSize + 5, yPos);
    yPos += 4;
  }
  if (companyDetails.gstin) {
    doc.text(`GSTIN: ${sanitizeText(companyDetails.gstin)}`, logoX + logoSize + 5, yPos);
    yPos += 4;
  }
  if (companyDetails.website) {
    doc.text(`Website: ${sanitizeText(companyDetails.website)}`, logoX + logoSize + 5, yPos);
    yPos += 4;
  }

  const rightColX = pageWidth - 60;
  let rightYPos = 20;

  const boxHeight = validUntil ? 42 : 34;
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(rightColX - 5, rightYPos - 3, 55, boxHeight, 3, 3, 'F');
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightColX - 5, rightYPos - 3, 55, boxHeight, 3, 3, 'S');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(123, 0, 0);
  doc.text(documentType.toUpperCase(), rightColX, rightYPos + 4);

  rightYPos += 11;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Number:', rightColX, rightYPos);
  doc.setFont('helvetica', 'normal');
  const numberText = doc.splitTextToSize(sanitizeText(documentNumber), 28);
  doc.text(numberText, rightColX + 18, rightYPos);

  rightYPos += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightColX, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(documentDate), rightColX + 18, rightYPos);

  if (eventDate) {
    rightYPos += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Event Date:', rightColX, rightYPos);
    doc.setFont('helvetica', 'normal');
    const eventDateText = doc.splitTextToSize(sanitizeText(eventDate), 28);
    doc.text(eventDateText, rightColX + 18, rightYPos);
  }

  if (validUntil) {
    rightYPos += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Valid Until:', rightColX, rightYPos);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeText(validUntil), rightColX + 18, rightYPos);
  }

  return Math.max(yPos, rightYPos + 8) + 8;
}

function addClientSection(doc: jsPDF, quotation: QuotationData, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 60) / 2;

  doc.setFillColor(247, 249, 251);
  doc.roundedRect(25, yPos, boxWidth, 38, 3, 3, 'F');
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.4);
  doc.roundedRect(25, yPos, boxWidth, 38, 3, 3, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(123, 0, 0);
  doc.text('BILL TO', 30, yPos + 8);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(sanitizeText(quotation.client_name), 30, yPos + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Phone: ${sanitizeText(quotation.client_phone)}`, 30, yPos + 23);

  if (quotation.client_email) {
    doc.text(`Email: ${sanitizeText(quotation.client_email)}`, 30, yPos + 29);
  }

  const rightBoxX = 25 + boxWidth + 10;
  doc.setFillColor(247, 249, 251);
  doc.roundedRect(rightBoxX, yPos, boxWidth, 38, 3, 3, 'F');
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.4);
  doc.roundedRect(rightBoxX, yPos, boxWidth, 38, 3, 3, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(123, 0, 0);
  doc.text('EVENT DETAILS', rightBoxX + 5, yPos + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  let eventYPos = yPos + 16;
  doc.text(`Type: ${sanitizeText(quotation.event_type)}`, rightBoxX + 5, eventYPos);
  eventYPos += 6;
  doc.text(`Guests: ${quotation.number_of_guests}`, rightBoxX + 5, eventYPos);

  if (quotation.event_venue) {
    eventYPos += 6;
    const venueText = doc.splitTextToSize(`Venue: ${sanitizeText(quotation.event_venue)}`, boxWidth - 10);
    doc.text(venueText, rightBoxX + 5, eventYPos);
  }

  return yPos + 45;
}

function addItemsTable(doc: jsPDF, items: LineItem[], yPos: number): number {
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    sanitizeText(item.item_name),
    sanitizeText(item.category || '-'),
    sanitizeText(item.description || '-'),
    item.quantity.toString(),
    `Rs. ${formatCurrency(item.unit_price)}`,
    `Rs. ${formatCurrency(item.total)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Item Name', 'Category', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [123, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      lineWidth: 0.2,
      lineColor: [123, 0, 0]
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: [30, 30, 30],
      lineWidth: 0.1,
      lineColor: [220, 220, 220]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', valign: 'middle' },
      1: { cellWidth: 48, halign: 'left', valign: 'top' },
      2: { cellWidth: 19, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      3: { cellWidth: 29, halign: 'left', valign: 'top', overflow: 'linebreak' },
      4: { cellWidth: 13, halign: 'center', valign: 'middle' },
      5: { cellWidth: 19, halign: 'right', valign: 'middle' },
      6: { cellWidth: 24, halign: 'right', valign: 'middle', fontStyle: 'bold', textColor: [123, 0, 0] }
    },
    margin: { left: 25, right: 25 },
    styles: {
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    }
  });

  return (doc as any).lastAutoTable.finalY;
}

function addPricingSummary(doc: jsPDF, quotation: QuotationData, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const summaryWidth = 85;
  const summaryX = pageWidth - 30 - summaryWidth;
  let currentY = yPos + 10;

  const totalRowsNeeded = 4 +
    (quotation.discount_amount > 0 ? 1 : 0) +
    (quotation.service_charges > 0 ? 1 : 0) +
    (quotation.external_charges > 0 ? 1 : 0);
  const summaryHeight = (totalRowsNeeded * 7) + 40 + (quotation.advance_paid ? 26 : 0);

  doc.setFillColor(250, 251, 253);
  doc.roundedRect(summaryX, currentY, summaryWidth, summaryHeight, 4, 4, 'F');
  doc.setDrawColor(210, 215, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(summaryX, currentY, summaryWidth, summaryHeight, 4, 4, 'S');

  currentY += 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  const labelX = summaryX + 8;
  const valueX = summaryX + summaryWidth - 8;

  doc.text('Subtotal:', labelX, currentY);
  doc.text(`Rs. ${formatCurrency(quotation.subtotal)}`, valueX, currentY, { align: 'right' });

  if (quotation.discount_amount > 0) {
    currentY += 7;
    doc.text(`Discount (${quotation.discount_percentage}%):`, labelX, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`- Rs. ${formatCurrency(quotation.discount_amount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(40, 40, 40);
  }

  if (quotation.service_charges > 0) {
    currentY += 7;
    doc.text('Service Charges:', labelX, currentY);
    doc.text(`Rs. ${formatCurrency(quotation.service_charges)}`, valueX, currentY, { align: 'right' });
  }

  if (quotation.external_charges > 0) {
    currentY += 7;
    doc.text('External Charges:', labelX, currentY);
    doc.text(`Rs. ${formatCurrency(quotation.external_charges)}`, valueX, currentY, { align: 'right' });
  }

  currentY += 7;
  doc.text(`Tax (GST ${quotation.tax_percentage}%):`, labelX, currentY);
  doc.text(`Rs. ${formatCurrency(quotation.tax_amount)}`, valueX, currentY, { align: 'right' });

  currentY += 10;
  doc.setDrawColor(123, 0, 0);
  doc.setLineWidth(1);
  doc.line(labelX, currentY, valueX, currentY);

  currentY += 3;
  doc.setFillColor(123, 0, 0);
  doc.rect(summaryX, currentY, summaryWidth, 18, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', labelX, currentY + 11);
  doc.text(`Rs. ${formatCurrency(quotation.grand_total)}`, valueX, currentY + 11, { align: 'right' });

  currentY += 18;

  if (quotation.advance_paid) {
    currentY += 3;
    doc.setFillColor(240, 253, 244);
    doc.rect(summaryX, currentY, summaryWidth, 10, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('Advance Paid:', labelX, currentY + 6.5);
    doc.text(`Rs. ${formatCurrency(quotation.advance_paid)}`, valueX, currentY + 6.5, { align: 'right' });

    currentY += 10;
    doc.setFillColor(254, 242, 242);
    doc.rect(summaryX, currentY, summaryWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('Balance Due:', labelX, currentY + 6.5);
    doc.text(`Rs. ${formatCurrency(quotation.balance_due || 0)}`, valueX, currentY + 6.5, { align: 'right' });
    currentY += 10;
  }

  return currentY + 10;
}

function addFooter(doc: jsPDF, companyDetails: any, terms: string, yPos: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = yPos;

  if (currentY > pageHeight - 90) {
    doc.addPage();
    currentY = 25;
  }

  if (terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(123, 0, 0);
    doc.text('Terms & Conditions', 25, currentY);

    currentY += 7;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const termsLines = doc.splitTextToSize(sanitizeText(terms), pageWidth - 50);
    doc.text(termsLines, 25, currentY);
    currentY += termsLines.length * 4.5 + 10;
  }

  if (companyDetails.bank_name || DEFAULT_BANK_DETAILS) {
    const bankDetails = companyDetails.bank_name
      ? `Bank: ${sanitizeText(companyDetails.bank_name)}\nAccount: ${sanitizeText(companyDetails.account_number)}\nIFSC: ${sanitizeText(companyDetails.ifsc_code)}`
      : DEFAULT_BANK_DETAILS;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(123, 0, 0);
    doc.text('Bank Details', 25, currentY);

    currentY += 7;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const bankLines = doc.splitTextToSize(bankDetails, 90);
    doc.text(bankLines, 25, currentY);
  }

  const signatureX = pageWidth - 85;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Authorized Signature', signatureX, currentY);
  doc.setLineWidth(0.4);
  doc.setDrawColor(120, 120, 120);
  doc.line(signatureX, currentY + 18, signatureX + 55, currentY + 18);

  currentY = pageHeight - 22;
  doc.setDrawColor(123, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(25, currentY, pageWidth - 25, currentY);

  currentY += 7;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(123, 0, 0);
  doc.text('Thank you for your business!', pageWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const contactText = `${sanitizeText(companyDetails.name)} | ${sanitizeText(companyDetails.phone || '')} | ${sanitizeText(companyDetails.email || '')}`;
  doc.text(contactText, pageWidth / 2, currentY, { align: 'center' });
}

export async function generateQuotationPDF(quotation: QuotationData) {
  try {
    const doc = new jsPDF();
    const companyDetails = { ...DEFAULT_COMPANY_DETAILS, ...quotation.company_details };

    try {
      await addLogoToHeader(doc, 25, 25, 28);
    } catch (error) {
      console.warn('Logo loading failed, continuing without logo');
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (quotation.validity_days || 7));

    let yPos = addProfessionalHeader(
      doc,
      companyDetails,
      'Quotation',
      quotation.quotation_number || 'N/A',
      new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      new Date(quotation.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    );

    yPos = addClientSection(doc, quotation, yPos);

    if (quotation.items && quotation.items.length > 0) {
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(123, 0, 0);
      doc.text('Items & Services', 25, yPos);
      yPos += 6;

      yPos = addItemsTable(doc, quotation.items, yPos);
    } else {
      yPos += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('No items added yet', 25, yPos);
    }

    if (quotation.remarks) {
      yPos += 12;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(123, 0, 0);
      doc.text('Remarks:', 25, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);
      const remarksLines = doc.splitTextToSize(sanitizeText(quotation.remarks), 120);
      doc.text(remarksLines, 25, yPos);
    }

    yPos = addPricingSummary(doc, quotation, yPos);

    yPos += 12;
    addFooter(doc, companyDetails, quotation.terms_and_conditions || DEFAULT_TERMS, yPos);

    const filename = `Quotation_${quotation.quotation_number || 'Draft'}_${(quotation.client_name || 'Client').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);

    console.log('PDF saved successfully:', filename);
  } catch (error) {
    console.error('Critical error in PDF generation:', error);
    throw new Error('Failed to generate PDF. Please check the data and try again.');
  }
}

interface PackageItem {
  item_type: string;
  item_name: string;
  description: string | null;
  unit_price: number;
  quantity_multiplier: number;
}

interface PackageData {
  name: string;
  description: string | null;
  base_price_per_person: number | null;
  items: PackageItem[];
  company_details?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    website?: string;
    logo?: string;
  };
}

export async function generatePackagePDF(packageData: PackageData) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const companyDetails = { ...DEFAULT_COMPANY_DETAILS, ...packageData.company_details };

    let yPos = addProfessionalHeader(
    doc,
    companyDetails,
    'Package',
    `PKG-${Date.now()}`,
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  );

  yPos += 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text(packageData.name, pageWidth / 2, yPos, { align: 'center' });

  if (packageData.description) {
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(packageData.description, pageWidth - 60);
    doc.text(descLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += descLines.length * 4 + 5;
  }

  if (packageData.base_price_per_person) {
    yPos += 3;
    doc.setFillColor(128, 0, 32);
    doc.roundedRect(pageWidth / 2 - 40, yPos - 5, 80, 12, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Rs. ${formatCurrency(packageData.base_price_per_person)} per person`,
      pageWidth / 2,
      yPos + 3,
      { align: 'center' }
    );
    yPos += 15;
  }

  const menuItems = packageData.items.filter(item => item.item_type === 'menu_item');
  const services = packageData.items.filter(item => item.item_type === 'service');

  if (menuItems.length > 0) {
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(123, 0, 0);
    doc.text('Menu Items', 25, yPos);
    yPos += 6;

    const menuTableData = menuItems.map((item, index) => [
      (index + 1).toString(),
      sanitizeText(item.item_name),
      sanitizeText(item.description || '-'),
      `Rs. ${formatCurrency(item.unit_price)}`,
      `x${item.quantity_multiplier}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Item Name', 'Description', 'Unit Price', 'Multiplier']],
      body: menuTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [123, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: [30, 30, 30]
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 60 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 25, right: 25 },
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        overflow: 'linebreak'
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  if (services.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 25;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(123, 0, 0);
    doc.text('Additional Services', 25, yPos);
    yPos += 6;

    const serviceTableData = services.map((item, index) => [
      (index + 1).toString(),
      sanitizeText(item.item_name),
      sanitizeText(item.description || '-'),
      `Rs. ${formatCurrency(item.unit_price)}`,
      `x${item.quantity_multiplier}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Service Name', 'Description', 'Unit Price', 'Multiplier']],
      body: serviceTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [123, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: [30, 30, 30]
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 60 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 25, right: 25 },
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        overflow: 'linebreak'
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  yPos += 12;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos > pageHeight - 45) {
    doc.addPage();
    yPos = 25;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'This is a package template. Final pricing may vary based on guest count and customization.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  yPos += 12;
  doc.setDrawColor(123, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(25, yPos, pageWidth - 25, yPos);

  yPos += 7;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(123, 0, 0);
  doc.text('Thank you for considering our services!', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const contactText = `${sanitizeText(companyDetails.name)} | ${sanitizeText(companyDetails.phone || '')} | ${sanitizeText(companyDetails.email || '')}`;
  doc.text(contactText, pageWidth / 2, yPos, { align: 'center' });

    const filename = `Package_${(packageData.name || 'Package').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);

    console.log('Package PDF saved successfully:', filename);
  } catch (error) {
    console.error('Critical error in package PDF generation:', error);
    throw new Error('Failed to generate package PDF. Please check the data and try again.');
  }
}
