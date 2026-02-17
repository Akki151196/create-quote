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
  let yPos = 15;

  doc.setFillColor(128, 0, 32);
  doc.rect(0, 0, pageWidth, 8, 'F');

  yPos = 28;

  const logoSize = 28;
  const logoX = 15;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text(companyDetails.name, logoX + logoSize + 5, yPos, { maxWidth: 100 });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Making Your Events Memorable', logoX + logoSize + 5, yPos + 5);

  yPos += 12;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  if (companyDetails.address) {
    doc.text(companyDetails.address, logoX + logoSize + 5, yPos);
    yPos += 3.5;
  }
  if (companyDetails.phone) {
    doc.text(`Phone: ${companyDetails.phone}`, logoX + logoSize + 5, yPos);
    yPos += 3.5;
  }
  if (companyDetails.email) {
    doc.text(`Email: ${companyDetails.email}`, logoX + logoSize + 5, yPos);
    yPos += 3.5;
  }
  if (companyDetails.gstin) {
    doc.text(`GSTIN: ${companyDetails.gstin}`, logoX + logoSize + 5, yPos);
    yPos += 3.5;
  }
  if (companyDetails.website) {
    doc.text(`Website: ${companyDetails.website}`, logoX + logoSize + 5, yPos);
    yPos += 3.5;
  }

  const rightColX = pageWidth - 60;
  let rightYPos = 20;

  doc.setFillColor(240, 240, 245);
  doc.roundedRect(rightColX - 5, rightYPos - 5, 55, validUntil ? 38 : 30, 2, 2, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text(documentType.toUpperCase(), rightColX, rightYPos);

  rightYPos += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Number:', rightColX, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text(documentNumber, rightColX + 18, rightYPos);

  rightYPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightColX, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text(documentDate, rightColX + 18, rightYPos);

  if (eventDate) {
    rightYPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Event Date:', rightColX, rightYPos);
    doc.setFont('helvetica', 'normal');
    doc.text(eventDate, rightColX + 18, rightYPos);
  }

  if (validUntil) {
    rightYPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Valid Until:', rightColX, rightYPos);
    doc.setFont('helvetica', 'normal');
    doc.text(validUntil, rightColX + 18, rightYPos);
  }

  return Math.max(yPos, rightYPos) + 10;
}

function addClientSection(doc: jsPDF, quotation: QuotationData, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 50) / 2;

  doc.setFillColor(245, 248, 250);
  doc.roundedRect(20, yPos, boxWidth, 35, 2, 2, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(20, yPos, boxWidth, 35, 2, 2, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text('BILL TO', 25, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(quotation.client_name, 25, yPos + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Phone: ${quotation.client_phone}`, 25, yPos + 20);

  if (quotation.client_email) {
    doc.text(`Email: ${quotation.client_email}`, 25, yPos + 25);
  }

  const rightBoxX = 20 + boxWidth + 10;
  doc.setFillColor(245, 248, 250);
  doc.roundedRect(rightBoxX, yPos, boxWidth, 35, 2, 2, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(rightBoxX, yPos, boxWidth, 35, 2, 2, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text('EVENT DETAILS', rightBoxX + 5, yPos + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  let eventYPos = yPos + 14;
  doc.text(`Type: ${quotation.event_type}`, rightBoxX + 5, eventYPos);
  eventYPos += 5;
  doc.text(`Guests: ${quotation.number_of_guests}`, rightBoxX + 5, eventYPos);

  if (quotation.event_venue) {
    eventYPos += 5;
    const venueText = doc.splitTextToSize(`Venue: ${quotation.event_venue}`, boxWidth - 10);
    doc.text(venueText, rightBoxX + 5, eventYPos);
  }

  return yPos + 40;
}

function addItemsTable(doc: jsPDF, items: LineItem[], yPos: number): number {
  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.item_name,
    item.category || '-',
    item.description || '-',
    item.quantity.toString(),
    `Rs. ${formatCurrency(item.unit_price)}`,
    `Rs. ${formatCurrency(item.total)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Item Name', 'Category', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [128, 0, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 20 },
      3: { cellWidth: 46 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 38, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 },
    styles: {
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      overflow: 'linebreak'
    }
  });

  return (doc as any).lastAutoTable.finalY;
}

function addPricingSummary(doc: jsPDF, quotation: QuotationData, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const summaryWidth = 105;
  const summaryX = pageWidth - 25 - summaryWidth;
  let currentY = yPos + 10;

  doc.setFillColor(248, 250, 252);
  const summaryHeight = 70 + (quotation.advance_paid ? 16 : 0);
  doc.roundedRect(summaryX, currentY, summaryWidth, summaryHeight, 3, 3, 'F');
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.5);
  doc.roundedRect(summaryX, currentY, summaryWidth, summaryHeight, 3, 3, 'S');

  currentY += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const labelX = summaryX + 10;
  const valueX = summaryX + summaryWidth - 10;

  doc.text('Subtotal:', labelX, currentY);
  doc.text(`Rs. ${formatCurrency(quotation.subtotal)}`, valueX, currentY, { align: 'right' });

  if (quotation.discount_amount > 0) {
    currentY += 6;
    doc.text(`Discount (${quotation.discount_percentage}%):`, labelX, currentY);
    doc.setTextColor(200, 30, 40);
    doc.text(`- Rs. ${formatCurrency(quotation.discount_amount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  if (quotation.service_charges > 0) {
    currentY += 6;
    doc.text('Service Charges:', labelX, currentY);
    doc.text(`Rs. ${formatCurrency(quotation.service_charges)}`, valueX, currentY, { align: 'right' });
  }

  if (quotation.external_charges > 0) {
    currentY += 6;
    doc.text('External Charges:', labelX, currentY);
    doc.text(`Rs. ${formatCurrency(quotation.external_charges)}`, valueX, currentY, { align: 'right' });
  }

  currentY += 6;
  doc.text(`Tax (GST ${quotation.tax_percentage}%):`, labelX, currentY);
  doc.text(`Rs. ${formatCurrency(quotation.tax_amount)}`, valueX, currentY, { align: 'right' });

  currentY += 10;
  doc.setDrawColor(128, 0, 32);
  doc.setLineWidth(1);
  doc.line(labelX, currentY - 3, valueX, currentY - 3);

  doc.setFillColor(128, 0, 32);
  doc.rect(summaryX, currentY + 2, summaryWidth, 14, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', labelX, currentY + 10);
  doc.text(`Rs. ${formatCurrency(quotation.grand_total)}`, valueX, currentY + 10, { align: 'right' });

  if (quotation.advance_paid) {
    currentY += 20;
    doc.setFillColor(240, 253, 244);
    doc.rect(summaryX, currentY, summaryWidth, 6, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('Advance Paid:', labelX, currentY + 4);
    doc.text(`Rs. ${formatCurrency(quotation.advance_paid)}`, valueX, currentY + 4, { align: 'right' });

    currentY += 6;
    doc.setFillColor(254, 242, 242);
    doc.rect(summaryX, currentY, summaryWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('Balance Due:', labelX, currentY + 4);
    doc.text(`Rs. ${formatCurrency(quotation.balance_due || 0)}`, valueX, currentY + 4, { align: 'right' });
    currentY += 6;
  } else {
    currentY += 14;
  }

  return currentY + 10;
}

function addFooter(doc: jsPDF, companyDetails: any, terms: string, yPos: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = yPos;

  if (currentY > pageHeight - 80) {
    doc.addPage();
    currentY = 20;
  }

  if (terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 0, 32);
    doc.text('Terms & Conditions', 20, currentY);

    currentY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const termsLines = doc.splitTextToSize(terms, pageWidth - 40);
    doc.text(termsLines, 20, currentY);
    currentY += termsLines.length * 4 + 8;
  }

  if (companyDetails.bank_name || DEFAULT_BANK_DETAILS) {
    const bankDetails = companyDetails.bank_name
      ? `Bank: ${companyDetails.bank_name}\nAccount: ${companyDetails.account_number}\nIFSC: ${companyDetails.ifsc_code}`
      : DEFAULT_BANK_DETAILS;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 0, 32);
    doc.text('Bank Details', 20, currentY);

    currentY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const bankLines = doc.splitTextToSize(bankDetails, 80);
    doc.text(bankLines, 20, currentY);
  }

  const signatureX = pageWidth - 80;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Authorized Signature', signatureX, currentY);
  doc.setLineWidth(0.3);
  doc.setDrawColor(100, 100, 100);
  doc.line(signatureX, currentY + 15, signatureX + 50, currentY + 15);

  currentY = pageHeight - 20;
  doc.setDrawColor(128, 0, 32);
  doc.setLineWidth(0.5);
  doc.line(20, currentY, pageWidth - 20, currentY);

  currentY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text('Thank you for your business!', pageWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${companyDetails.name} | ${companyDetails.phone || ''} | ${companyDetails.email || ''}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
}

export async function generateQuotationPDF(quotation: QuotationData) {
  try {
    const doc = new jsPDF();
    const companyDetails = { ...DEFAULT_COMPANY_DETAILS, ...quotation.company_details };

    try {
      await addLogoToHeader(doc, 15, 23, 28);
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
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      doc.text('Items & Services', 20, yPos);
      yPos += 5;

      yPos = addItemsTable(doc, quotation.items, yPos);
    } else {
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No items added yet', 20, yPos);
    }

    if (quotation.remarks) {
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      doc.text('Remarks:', 20, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const remarksLines = doc.splitTextToSize(quotation.remarks, 110);
      doc.text(remarksLines, 20, yPos);
    }

    yPos = addPricingSummary(doc, quotation, yPos);

    yPos += 10;
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
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 0, 32);
    doc.text('Menu Items', 20, yPos);
    yPos += 5;

    const menuTableData = menuItems.map((item, index) => [
      (index + 1).toString(),
      item.item_name,
      item.description || '-',
      `Rs. ${formatCurrency(item.unit_price)}`,
      `x${item.quantity_multiplier}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Item Name', 'Description', 'Unit Price', 'Multiplier']],
      body: menuTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [128, 0, 32],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [40, 40, 40]
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 60 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 20, right: 20 },
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
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 0, 32);
    doc.text('Additional Services', 20, yPos);
    yPos += 5;

    const serviceTableData = services.map((item, index) => [
      (index + 1).toString(),
      item.item_name,
      item.description || '-',
      `Rs. ${formatCurrency(item.unit_price)}`,
      `x${item.quantity_multiplier}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Service Name', 'Description', 'Unit Price', 'Multiplier']],
      body: serviceTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [128, 0, 32],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [40, 40, 40]
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 60 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 20, right: 20 },
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        overflow: 'linebreak'
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  yPos += 10;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
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

  yPos += 10;
  doc.setDrawColor(128, 0, 32);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text('Thank you for considering our services!', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${companyDetails.name} | ${companyDetails.phone || ''} | ${companyDetails.email || ''}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

    const filename = `Package_${(packageData.name || 'Package').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);

    console.log('Package PDF saved successfully:', filename);
  } catch (error) {
    console.error('Critical error in package PDF generation:', error);
    throw new Error('Failed to generate package PDF. Please check the data and try again.');
  }
}
