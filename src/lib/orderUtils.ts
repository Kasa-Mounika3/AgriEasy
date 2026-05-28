import jsPDF from 'jspdf';
import { format } from 'date-fns';

export const generateOrderReceipt = (order: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(16, 185, 129); // Emerald 600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AgriEasy Order Receipt', 20, 25);
  
  // Order Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: ${order.orderId}`, 20, 55);
  const date = order.orderDate?.toDate ? order.orderDate.toDate() : new Date();
  doc.text(`Date: ${format(date, 'PPP pp')}`, 20, 60);
  doc.text(`Status: ${order.status}`, 20, 65);
  
  // Horizontal Line
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 75, pageWidth - 20, 75);
  
  // Customer Details
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', 20, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.shippingAddress.name}`, 20, 92);
  doc.text(`Phone: ${order.shippingAddress.phone}`, 20, 98);
  doc.text(`Address: ${order.shippingAddress.address}, ${order.shippingAddress.district}`, 20, 104);
  doc.text(`Pincode: ${order.shippingAddress.pincode}`, 20, 110);
  
  // Payment Details
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', 120, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(`Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}`, 120, 92);
  doc.text(`Total Amount: Rs. ${order.totalAmount}`, 120, 98);
  
  // Products Header
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 125, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Product Name', 25, 131);
  doc.text('Brand', 80, 131);
  doc.text('Qty', 130, 131);
  doc.text('Price', 150, 131);
  doc.text('Total', 175, 131);
  
  // Products List
  let yPos = 145;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  order.items.forEach((item: any) => {
    doc.text(item.name.substring(0, 30), 25, yPos);
    doc.text(item.brand, 80, yPos);
    doc.text(item.quantity.toString(), 133, yPos);
    doc.text(`${item.price}`, 150, yPos);
    doc.text(`${item.price * item.quantity}`, 175, yPos);
    yPos += 10;
  });
  
  // Total Section
  doc.line(20, yPos + 5, pageWidth - 20, yPos + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', 140, yPos + 15);
  doc.text(`Rs. ${order.totalAmount}`, 175, yPos + 15);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer generated receipt for your records.', pageWidth / 2, 280, { align: 'center' });
  doc.text('Thank you for shopping with AgriEasy!', pageWidth / 2, 285, { align: 'center' });
  
  // Save PDF
  doc.save(`AgriEasy_Receipt_${order.orderId}.pdf`);
};
