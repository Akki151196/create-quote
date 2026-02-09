import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LineItem {
  item_name: string;
  description: string;
  unit_price: number;
  quantity: number;
  total: number;
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
  company_details?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    logo?: string;
  };
}

const DEFAULT_COMPANY_DETAILS = {
  name: 'The Royal Catering Service & Events',
  address: '',
  phone: '',
  email: '',
  gstin: '',
};

function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';

  const formatted = numValue.toFixed(2);
  const parts = formatted.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedInteger = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return decimalPart === '00' ? formattedInteger : `${formattedInteger}.${decimalPart}`;
}

async function addLogoToPDF(doc: jsPDF, yPosition: number): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      const imgWidth = 20;
      const imgHeight = 20;
      const xPosition = 20;
      doc.addImage(img, 'PNG', xPosition, yPosition - 5, imgWidth, imgHeight);
      resolve(yPosition + 20);
    };
    img.onerror = function() {
      resolve(yPosition);
    };
    img.src = '/xraakgc9_img_0167-removebg-preview.png';
  });
}

export async function generateQuotationPDF(quotation: QuotationData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  const companyDetails = { ...DEFAULT_COMPANY_DETAILS, ...quotation.company_details };

  try {
    yPosition = await addLogoToPDF(doc, yPosition);
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text(companyDetails.name, 50, yPosition, { align: 'left' });

  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Making Your Events Memorable', 50, yPosition, { align: 'left' });

  yPosition += 10;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  if (companyDetails.address) {
    doc.text(companyDetails.address, 50, yPosition, { align: 'left' });
    yPosition += 5;
  }

  if (companyDetails.phone || companyDetails.email) {
    const contactLine = [
      companyDetails.phone && `Phone: ${companyDetails.phone}`,
      companyDetails.email && `Email: ${companyDetails.email}`
    ].filter(Boolean).join(' | ');
    doc.text(contactLine, 50, yPosition, { align: 'left' });
    yPosition += 5;
  }

  if (companyDetails.gstin) {
    doc.text(`GSTIN: ${companyDetails.gstin}`, 50, yPosition, { align: 'left' });
    yPosition += 5;
  }

  yPosition += 5;
  doc.setDrawColor(128, 0, 32);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  yPosition += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('QUOTATION', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const leftColumn = 20;
  const rightColumn = pageWidth / 2 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Quotation #:', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(quotation.quotation_number, leftColumn + 30, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('en-IN'), rightColumn + 15, yPosition);

  yPosition += 6;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + quotation.validity_days);

  doc.setFont('helvetica', 'bold');
  doc.text('Valid Until:', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(validUntil.toLocaleDateString('en-IN'), rightColumn + 25, yPosition);

  yPosition += 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(leftColumn, yPosition - 5, pageWidth / 2 - 25, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bill To:', leftColumn + 3, yPosition);

  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quotation.client_name, leftColumn + 3, yPosition);

  yPosition += 5;
  doc.text(quotation.client_phone, leftColumn + 3, yPosition);

  if (quotation.client_email) {
    yPosition += 5;
    doc.text(quotation.client_email, leftColumn + 3, yPosition);
  }

  yPosition += 15;
  doc.setFillColor(240, 240, 240);
  doc.rect(leftColumn, yPosition - 5, pageWidth - 40, 25, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Event Details:', leftColumn + 3, yPosition);

  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const eventInfo = [];
  eventInfo.push(`Type: ${quotation.event_type}`);
  eventInfo.push(`Date: ${new Date(quotation.event_date).toLocaleDateString('en-IN')}`);

  if (quotation.service_date) {
    eventInfo.push(`Service Date: ${new Date(quotation.service_date).toLocaleDateString('en-IN')}`);
  }

  eventInfo.push(`Guests: ${quotation.number_of_guests}`);

  if (quotation.event_venue) {
    eventInfo.push(`Venue: ${quotation.event_venue}`);
  }

  doc.text(eventInfo.join(' | '), leftColumn + 3, yPosition);

  yPosition += 15;

  const tableData = quotation.items.map((item, index) => [
    (index + 1).toString(),
    item.item_name,
    item.description || '-',
    `Rs ${formatCurrency(item.unit_price)}`,
    item.quantity.toString(),
    `Rs ${formatCurrency(item.total)}`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Item', 'Description', 'Unit Price', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [128, 0, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 50 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  const summaryX = pageWidth - 80;
  const labelX = summaryX - 50;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', labelX, yPosition);
  doc.text(`Rs ${formatCurrency(quotation.subtotal)}`, summaryX, yPosition, { align: 'right' });

  if (quotation.discount_amount > 0) {
    yPosition += 6;
    doc.text(`Discount (${quotation.discount_percentage}%):`, labelX, yPosition);
    doc.setTextColor(200, 0, 0);
    doc.text(`-Rs ${formatCurrency(quotation.discount_amount)}`, summaryX, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  if (quotation.service_charges > 0) {
    yPosition += 6;
    doc.text('Service Charges:', labelX, yPosition);
    doc.text(`Rs ${formatCurrency(quotation.service_charges)}`, summaryX, yPosition, { align: 'right' });
  }

  if (quotation.external_charges > 0) {
    yPosition += 6;
    doc.text('External Charges:', labelX, yPosition);
    doc.text(`Rs ${formatCurrency(quotation.external_charges)}`, summaryX, yPosition, { align: 'right' });
  }

  yPosition += 6;
  doc.text(`Tax (${quotation.tax_percentage}%):`, labelX, yPosition);
  doc.text(`Rs ${formatCurrency(quotation.tax_amount)}`, summaryX, yPosition, { align: 'right' });

  yPosition += 8;
  doc.setLineWidth(0.5);
  doc.line(labelX, yPosition, summaryX + 10, yPosition);

  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(128, 0, 32);
  doc.text('Grand Total:', labelX, yPosition);
  doc.text(`Rs ${formatCurrency(quotation.grand_total)}`, summaryX, yPosition, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  yPosition += 15;

  if (quotation.remarks) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Remarks:', 20, yPosition);

    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const remarksLines = doc.splitTextToSize(quotation.remarks, pageWidth - 40);
    doc.text(remarksLines, 20, yPosition);
    yPosition += remarksLines.length * 5 + 5;
  }

  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Terms & Conditions:', 20, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const termsLines = doc.splitTextToSize(quotation.terms_and_conditions, pageWidth - 40);
  doc.text(termsLines, 20, yPosition);

  yPosition += termsLines.length * 5 + 10;

  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosition < pageHeight - 30) {
    yPosition = pageHeight - 25;
  } else {
    doc.addPage();
    yPosition = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  yPosition += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');

  const footerText = `${companyDetails.name} | Making Your Events Memorable`;
  doc.text(footerText, pageWidth / 2, yPosition, { align: 'center' });

  if (companyDetails.phone || companyDetails.email) {
    yPosition += 4;
    const contactInfo = [companyDetails.phone, companyDetails.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, pageWidth / 2, yPosition, { align: 'center' });
  }

  const filename = `Quotation_${quotation.quotation_number}_${quotation.client_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
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
    logo?: string;
  };
}

export async function generatePackagePDF(packageData: PackageData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  const companyDetails = { ...DEFAULT_COMPANY_DETAILS, ...packageData.company_details };

  try {
    yPosition = await addLogoToPDF(doc, yPosition);
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text(companyDetails.name, 50, yPosition, { align: 'left' });

  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Making Your Events Memorable', 50, yPosition, { align: 'left' });

  yPosition += 10;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  if (companyDetails.address) {
    doc.text(companyDetails.address, 50, yPosition, { align: 'left' });
    yPosition += 5;
  }

  if (companyDetails.phone || companyDetails.email) {
    const contactLine = [
      companyDetails.phone && `Phone: ${companyDetails.phone}`,
      companyDetails.email && `Email: ${companyDetails.email}`
    ].filter(Boolean).join(' | ');
    doc.text(contactLine, 50, yPosition, { align: 'left' });
    yPosition += 5;
  }

  if (companyDetails.gstin) {
    doc.text(`GSTIN: ${companyDetails.gstin}`, 50, yPosition, { align: 'left' });
    yPosition += 5;
  }

  yPosition += 5;
  doc.setDrawColor(128, 0, 32);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  yPosition += 10;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(128, 0, 32);
  doc.text('SERVICE PACKAGE', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 12;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(packageData.name, pageWidth / 2, yPosition, { align: 'center' });

  if (packageData.description) {
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(packageData.description, pageWidth - 60);
    doc.text(descLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += descLines.length * 5 + 5;
  }

  if (packageData.base_price_per_person) {
    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 0, 32);
    doc.text(
      `Rs ${formatCurrency(packageData.base_price_per_person)} per person`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
  }

  yPosition += 15;

  const menuItems = packageData.items.filter(item => item.item_type === 'menu_item');
  const services = packageData.items.filter(item => item.item_type === 'service');

  if (menuItems.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 0, 32);
    doc.text('Menu Items', 20, yPosition);
    yPosition += 8;

    const menuTableData = menuItems.map((item, index) => [
      (index + 1).toString(),
      item.item_name,
      item.description || '-',
      `Rs ${formatCurrency(item.unit_price)}`,
      `x${item.quantity_multiplier}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Item Name', 'Description', 'Unit Price', 'Qty Multiplier']],
      body: menuTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [128, 0, 32],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 48 },
        2: { cellWidth: 62 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: 20, right: 20 },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  if (services.length > 0) {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 0, 32);
    doc.text('Additional Services', 20, yPosition);
    yPosition += 8;

    const serviceTableData = services.map((item, index) => [
      (index + 1).toString(),
      item.item_name,
      item.description || '-',
      `Rs ${formatCurrency(item.unit_price)}`,
      `x${item.quantity_multiplier}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Service Name', 'Description', 'Unit Price', 'Qty Multiplier']],
      body: serviceTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [128, 0, 32],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 48 },
        2: { cellWidth: 62 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: 20, right: 20 },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosition < pageHeight - 30) {
    yPosition = pageHeight - 25;
  } else {
    doc.addPage();
    yPosition = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  yPosition += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');

  const footerText = `${companyDetails.name} | Making Your Events Memorable`;
  doc.text(footerText, pageWidth / 2, yPosition, { align: 'center' });

  if (companyDetails.phone || companyDetails.email) {
    yPosition += 4;
    const contactInfo = [companyDetails.phone, companyDetails.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, pageWidth / 2, yPosition, { align: 'center' });
  }

  const filename = `Package_${packageData.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
