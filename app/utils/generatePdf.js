import jsPDF from 'jspdf';

export const generateCertificate = (studentName, date) => {
  // 1. Create PDF (Landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // 2. Add Background Color (Dark Blue)
  doc.setFillColor(15, 15, 26); // #0F0F1A
  doc.rect(0, 0, 297, 210, 'F');

  // 3. Add Border (Purple)
  doc.setLineWidth(2);
  doc.setDrawColor(147, 51, 234); // Purple-600
  doc.rect(10, 10, 277, 190);

  // 4. Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('ATTESTATION DE SUCCÈS', 148.5, 50, { align: 'center' });

  // 5. Subtitle
  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160); // Slate-400
  doc.text('Délivrée officiellement à', 148.5, 80, { align: 'center' });

  // 6. Student Name (Large & Gold)
  doc.setFontSize(50);
  doc.setTextColor(250, 204, 21); // Yellow-400
  doc.text(studentName, 148.5, 110, { align: 'center' });

  // 7. Description
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "Pour avoir participé avec succès à l'aventure FICAM et validé son parcours.",
    148.5,
    140,
    { align: 'center' }
  );

  // 8. Date and Signature
  doc.setFontSize(14);
  doc.setTextColor(160, 160, 160);
  doc.text(`Fait le : ${date}`, 50, 170);
  doc.text('L\'Équipe FICAM', 240, 170, { align: 'right' });

  // 9. Save file
  doc.save(`Attestation_${studentName.replace(' ', '_')}.pdf`);
};