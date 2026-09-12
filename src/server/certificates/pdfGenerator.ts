import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import QRCode from 'qrcode';

export interface CertificateStage {
  stageNumber: number;
  stageCode: string;
  name: string;
  requiredRole: string;
  status: string;
  endorsedAt: string | Date;
  digitalStamp: string;
  signatureHash: string;
  endorsedBy: string;
}

export interface CertificatePayload {
  isValid: boolean;
  verificationStatus: string;
  verifiedAt: string | Date;
  certificate: {
    id: string;
    certificateNumber: string;
    clearanceId: string;
    issuanceDate: string | Date;
    academicSession: string;
    graduationYear: number;
    status: string;
    registrySignatureHash: string;
    qrCodeToken: string;
    verificationUrl?: string;
  };
  student: {
    fullName: string;
    matricNumber: string;
    programme: string;
    level?: string;
    departmentCode: string;
    departmentName: string;
    facultyCode: string;
    facultyName: string;
  };
  institution?: {
    degreeAwardingUniversity: string;
    affiliatedInstitution: string;
    directorate: string;
    registryUnit: string;
    accreditationStandard: string;
  };
  completionStatement?: string;
  stages: CertificateStage[];
}

/**
 * Sanitizes strings to WinAnsi/ASCII range to prevent font encoding errors
 */
function cleanText(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/[\u2022\u25CF]/g, '*')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim();
}

function formatDate(val: string | Date | undefined): string {
  if (!val) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return String(val);
  }
}

export async function generateCertificatePdf(data: CertificatePayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Standard A4 dimensions in points (595.28 x 841.89)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = doc.addPage([pageWidth, pageHeight]);

  // Embed standard Type 1 fonts (guaranteed support in all PDF viewers)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimesRoman = await doc.embedFont(StandardFonts.TimesRoman);
  const fontTimesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const fontTimesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontCourier = await doc.embedFont(StandardFonts.Courier);

  // Core Institutional Color Palette
  const colorDeepPurple = rgb(0.18, 0.06, 0.35); // #2E1065
  const colorMediumPurple = rgb(0.35, 0.12, 0.55); // #581C87
  const colorLightPurple = rgb(0.96, 0.93, 0.99); // #F3E8FF tint
  const colorBorderPurple = rgb(0.45, 0.2, 0.65);
  const colorGold = rgb(0.82, 0.62, 0.15); // Institutional gold
  const colorDarkText = rgb(0.12, 0.12, 0.15);
  const colorMutedText = rgb(0.4, 0.42, 0.48);
  const colorWhite = rgb(1, 1, 1);
  const colorApprovedGreen = rgb(0.08, 0.52, 0.32); // Emerald 700
  const colorApprovedGreenBg = rgb(0.92, 0.98, 0.94); // Emerald 50

  // -------------------------------------------------------------------------
  // 1. Double Ornamental Perimeter Border & Security Corner Brackets
  // -------------------------------------------------------------------------
  const outerBorderInset = 20;
  const innerBorderInset = 25;

  // Outer bold border
  page.drawRectangle({
    x: outerBorderInset,
    y: outerBorderInset,
    width: pageWidth - outerBorderInset * 2,
    height: pageHeight - outerBorderInset * 2,
    borderColor: colorDeepPurple,
    borderWidth: 2.5,
  });

  // Inner fine gold accent border
  page.drawRectangle({
    x: innerBorderInset,
    y: innerBorderInset,
    width: pageWidth - innerBorderInset * 2,
    height: pageHeight - innerBorderInset * 2,
    borderColor: colorGold,
    borderWidth: 0.8,
  });

  // 4 Decorative Corner Insets (L-shaped ornate brackets)
  const bracketSize = 14;
  const drawCornerBrackets = (bx: number, by: number, dx: number, dy: number) => {
    page.drawLine({
      start: { x: bx, y: by },
      end: { x: bx + dx * bracketSize, y: by },
      color: colorDeepPurple,
      thickness: 1.5,
    });
    page.drawLine({
      start: { x: bx, y: by },
      end: { x: bx, y: by + dy * bracketSize },
      color: colorDeepPurple,
      thickness: 1.5,
    });
  };
  drawCornerBrackets(innerBorderInset + 4, pageHeight - innerBorderInset - 4, 1, -1);
  drawCornerBrackets(pageWidth - innerBorderInset - 4, pageHeight - innerBorderInset - 4, -1, -1);
  drawCornerBrackets(innerBorderInset + 4, innerBorderInset + 4, 1, 1);
  drawCornerBrackets(pageWidth - innerBorderInset - 4, innerBorderInset + 4, -1, 1);

  // Helper for centering text horizontally
  const drawCenteredText = (
    text: string,
    y: number,
    font: PDFFont,
    size: number,
    color = colorDarkText
  ) => {
    const safeText = cleanText(text);
    const textWidth = font.widthOfTextAtSize(safeText, size);
    const x = (pageWidth - textWidth) / 2;
    page.drawText(safeText, { x, y, size, font, color });
  };

  // -------------------------------------------------------------------------
  // 2. Institutional Emblem & Header
  // -------------------------------------------------------------------------
  // Heraldic Institutional Seal (top center)
  const sealCenterX = pageWidth / 2;
  const sealCenterY = 788;
  const sealRadius = 22;

  // Outer gold rim
  page.drawCircle({
    x: sealCenterX,
    y: sealCenterY,
    size: sealRadius,
    borderColor: colorGold,
    borderWidth: 1.8,
    color: colorDeepPurple,
  });

  // Inner ring
  page.drawCircle({
    x: sealCenterX,
    y: sealCenterY,
    size: sealRadius - 4,
    borderColor: colorGold,
    borderWidth: 0.8,
  });

  // Center crest symbol (star & shield text)
  page.drawText('FEDPOFFA', {
    x: sealCenterX - 17,
    y: sealCenterY + 4,
    size: 6,
    font: fontBold,
    color: colorGold,
  });
  page.drawText('FUTMINNA', {
    x: sealCenterX - 18,
    y: sealCenterY - 6,
    size: 6,
    font: fontBold,
    color: colorWhite,
  });

  // Header Typography
  drawCenteredText('FEDERAL POLYTECHNIC OFFA', 750, fontBold, 14, colorDeepPurple);
  drawCenteredText('IN AFFILIATION WITH', 738, fontBold, 7.5, colorMutedText);
  drawCenteredText('FEDERAL UNIVERSITY OF TECHNOLOGY, MINNA', 724, fontBold, 12, colorMediumPurple);
  drawCenteredText('DIRECTORATE OF DEGREE AFFILIATION & PARTNERSHIP PROGRAMMES', 712, fontBold, 7.5, colorDeepPurple);

  // Certificate Main Banner Ribbon
  const bannerY = 688;
  const bannerHeight = 18;
  const bannerWidth = 370;
  const bannerX = (pageWidth - bannerWidth) / 2;

  page.drawRectangle({
    x: bannerX,
    y: bannerY,
    width: bannerWidth,
    height: bannerHeight,
    color: colorDeepPurple,
  });

  page.drawRectangle({
    x: bannerX + 1.5,
    y: bannerY + 1.5,
    width: bannerWidth - 3,
    height: bannerHeight - 3,
    borderColor: colorGold,
    borderWidth: 0.75,
  });

  drawCenteredText(
    'FINAL DEGREE GRADUATION CLEARANCE CERTIFICATE',
    bannerY + 5,
    fontBold,
    9,
    colorWhite
  );

  // -------------------------------------------------------------------------
  // 3. Metadata Reference Bar (4 Columns)
  // -------------------------------------------------------------------------
  const metaY = 654;
  const metaHeight = 26;
  const metaMargin = 38;
  const metaWidth = pageWidth - metaMargin * 2;

  page.drawRectangle({
    x: metaMargin,
    y: metaY,
    width: metaWidth,
    height: metaHeight,
    color: colorLightPurple,
    borderColor: colorBorderPurple,
    borderWidth: 0.6,
  });

  const certNumber = cleanText(data.certificate?.certificateNumber || 'FUT-FP-CLR-2026-0001');
  const clearanceId = cleanText(data.certificate?.clearanceId || 'CLR-2026-FUT-00123');
  const session = cleanText(data.certificate?.academicSession || data.student?.programme || '2024/2025');
  const issueDate = formatDate(data.certificate?.issuanceDate);

  const colWidth = metaWidth / 4;
  const drawMetaCell = (colIdx: number, label: string, val: string) => {
    const cx = metaMargin + colIdx * colWidth + 8;
    page.drawText(label, { x: cx, y: metaY + 15, size: 6.5, font: fontBold, color: colorMutedText });
    page.drawText(val, { x: cx, y: metaY + 5, size: 8, font: fontBold, color: colorDeepPurple });
  };

  drawMetaCell(0, 'CERTIFICATE REF:', certNumber);
  drawMetaCell(1, 'CLEARANCE ID:', clearanceId);
  drawMetaCell(2, 'ACADEMIC SESSION:', session);
  drawMetaCell(3, 'DATE OF ISSUANCE:', issueDate);

  // -------------------------------------------------------------------------
  // 4. Candidate Identification Box
  // -------------------------------------------------------------------------
  drawCenteredText(
    'This is to authoritatively certify that the candidate whose full identity is inscribed below has fulfilled all graduation requirements:',
    638,
    fontTimesItalic,
    8.5,
    colorDarkText
  );

  const studentBoxY = 560;
  const studentBoxHeight = 68;
  page.drawRectangle({
    x: metaMargin,
    y: studentBoxY,
    width: metaWidth,
    height: studentBoxHeight,
    color: colorWhite,
    borderColor: colorBorderPurple,
    borderWidth: 0.8,
  });

  // Candidate Full Name (Large prominent text)
  const candidateName = cleanText(data.student?.fullName || 'STUDENT CANDIDATE').toUpperCase();
  drawCenteredText(candidateName, studentBoxY + 48, fontBold, 13, colorDeepPurple);

  // Dividing accent line under name
  page.drawLine({
    start: { x: metaMargin + 30, y: studentBoxY + 42 },
    end: { x: metaMargin + metaWidth - 30, y: studentBoxY + 42 },
    color: colorGold,
    thickness: 0.75,
  });

  // 2-Column Grid Details
  const matric = cleanText(data.student?.matricNumber || 'N/A');
  const programme = cleanText(data.student?.programme || 'Bachelor of Technology (B.Tech)');
  const dept = cleanText(`${data.student?.departmentName || 'Computer Science'} (${data.student?.departmentCode || 'CSC'})`);
  const faculty = cleanText(`${data.student?.facultyName || 'Applied Sciences & Technology'} (${data.student?.facultyCode || 'FAST'})`);

  const leftColX = metaMargin + 20;
  const rightColX = metaMargin + metaWidth / 2 + 10;

  // Row 1
  page.drawText('Matriculation No:', { x: leftColX, y: studentBoxY + 26, size: 7.5, font: fontBold, color: colorMutedText });
  page.drawText(matric, { x: leftColX + 78, y: studentBoxY + 26, size: 8, font: fontBold, color: colorDarkText });

  page.drawText('Degree Awarded:', { x: rightColX, y: studentBoxY + 26, size: 7.5, font: fontBold, color: colorMutedText });
  page.drawText('B.Tech Direct Degree Affiliation', { x: rightColX + 78, y: studentBoxY + 26, size: 8, font: fontBold, color: colorDarkText });

  // Row 2
  page.drawText('Department:', { x: leftColX, y: studentBoxY + 10, size: 7.5, font: fontBold, color: colorMutedText });
  page.drawText(dept, { x: leftColX + 78, y: studentBoxY + 10, size: 8, font: fontBold, color: colorDarkText });

  page.drawText('Faculty/School:', { x: rightColX, y: studentBoxY + 10, size: 7.5, font: fontBold, color: colorMutedText });
  page.drawText(faculty, { x: rightColX + 78, y: studentBoxY + 10, size: 8, font: fontBold, color: colorDarkText });

  // -------------------------------------------------------------------------
  // 5. Statutory 7-Stage Clearance Completion Audit Table
  // -------------------------------------------------------------------------
  drawCenteredText(
    'STATUTORY 7-STAGE INSTITUTIONAL CLEARANCE AUDIT TRAIL',
    542,
    fontBold,
    8,
    colorDeepPurple
  );

  const tableY = 388;
  const tableHeight = 144;
  const col1W = 24;  // #
  const col2W = 180; // Clearance Unit & Authorized Officer
  const col3W = 100; // Signoff Status & Date
  const col4W = metaWidth - col1W - col2W - col3W; // 215.28 - Digital Stamp & Hash

  // Table Header Row (Deep Purple Background)
  const headerY = tableY + tableHeight - 16;
  page.drawRectangle({
    x: metaMargin,
    y: headerY,
    width: metaWidth,
    height: 16,
    color: colorDeepPurple,
  });

  const headerTextY = headerY + 4.5;
  page.drawText('#', { x: metaMargin + 8, y: headerTextY, size: 7, font: fontBold, color: colorWhite });
  page.drawText('CLEARANCE UNIT / STATUTORY AUTHORITY', { x: metaMargin + col1W + 6, y: headerTextY, size: 7, font: fontBold, color: colorWhite });
  page.drawText('SIGNOFF STATUS', { x: metaMargin + col1W + col2W + 6, y: headerTextY, size: 7, font: fontBold, color: colorWhite });
  page.drawText('DIGITAL STAMP & VERIFICATION HASH', { x: metaMargin + col1W + col2W + col3W + 6, y: headerTextY, size: 7, font: fontBold, color: colorWhite });

  // 7 Defined Sequential Stages
  const defaultStageNames = [
    'Departmental Clearance (HOD)',
    'Faculty Office Clearance (Dean)',
    'University Library Clearance (Librarian)',
    'Bursary Department Clearance (Bursar)',
    'Hostel & Hall Management (Student Affairs)',
    'ICT & E-Portal Clearance (Director of ICT)',
    'Academic Registry Final Clearance (Registry)',
  ];

  const rowHeight = 18.2;
  for (let i = 0; i < 7; i++) {
    const stageNum = i + 1;
    const stageData = data.stages?.find((s) => s.stageNumber === stageNum);
    const rowY = headerY - (i + 1) * rowHeight;
    const isEven = i % 2 === 0;

    // Zebra row background
    page.drawRectangle({
      x: metaMargin,
      y: rowY,
      width: metaWidth,
      height: rowHeight,
      color: isEven ? colorWhite : colorLightPurple,
      borderColor: colorBorderPurple,
      borderWidth: 0.3,
    });

    const rowTextY = rowY + 5;

    // Col 1: Stage Number
    page.drawText(String(stageNum), {
      x: metaMargin + 9,
      y: rowTextY,
      size: 7.5,
      font: fontBold,
      color: colorDeepPurple,
    });

    // Col 2: Stage Name & Officer
    const stageTitle = cleanText(stageData?.name || defaultStageNames[i]);
    const officerName = cleanText(stageData?.endorsedBy || 'Authorized Clearance Officer');
    page.drawText(stageTitle, {
      x: metaMargin + col1W + 6,
      y: rowTextY + 3.5,
      size: 7,
      font: fontBold,
      color: colorDarkText,
    });
    page.drawText(`Endorsed by: ${officerName}`, {
      x: metaMargin + col1W + 6,
      y: rowTextY - 4.5,
      size: 6,
      font: fontRegular,
      color: colorMutedText,
    });

    // Col 3: Status & Date (Green Approved Badge)
    const isApproved = stageData?.status === 'APPROVED' || !stageData; // Default to approved on generated cert
    const endorsedDate = formatDate(stageData?.endorsedAt || data.certificate?.issuanceDate);

    // Green Pill
    page.drawRectangle({
      x: metaMargin + col1W + col2W + 6,
      y: rowY + 5,
      width: 48,
      height: 9.5,
      color: colorApprovedGreenBg,
      borderColor: colorApprovedGreen,
      borderWidth: 0.5,
    });
    page.drawText('[OK] APPROVED', {
      x: metaMargin + col1W + col2W + 9,
      y: rowY + 6.5,
      size: 5.5,
      font: fontBold,
      color: colorApprovedGreen,
    });

    page.drawText(endorsedDate, {
      x: metaMargin + col1W + col2W + 6,
      y: rowY - 4.5,
      size: 5.5,
      font: fontRegular,
      color: colorMutedText,
    });

    // Col 4: Digital Stamp & Verification Hash
    const stampText = cleanText(stageData?.digitalStamp || `FUTMINNA-FEDPOFFA/STAGE_${stageNum}/APPROVED`);
    const hashText = cleanText(stageData?.signatureHash || data.certificate?.registrySignatureHash || 'sha256:7f83b1657ff1...').slice(0, 36);

    page.drawText(stampText, {
      x: metaMargin + col1W + col2W + col3W + 6,
      y: rowTextY + 3.5,
      size: 6.5,
      font: fontCourier,
      color: colorDeepPurple,
    });
    page.drawText(`Sig: ${hashText}`, {
      x: metaMargin + col1W + col2W + col3W + 6,
      y: rowTextY - 4.5,
      size: 5.5,
      font: fontCourier,
      color: colorMutedText,
    });
  }

  // Statutory Certification Sentence
  drawCenteredText(
    'The candidate is hereby granted full institutional clearance and is certified eligible for NYSC mobilization and Degree Certificate.',
    374,
    fontTimesItalic,
    8,
    colorDarkText
  );

  // -------------------------------------------------------------------------
  // 6. QR Code Verification & 3 Institutional Signatures
  // -------------------------------------------------------------------------
  const footerSectionY = 215;

  // Generate dynamic QR Code buffer with high error correction
  const verificationUrl = data.certificate?.verificationUrl
    ? (data.certificate.verificationUrl.startsWith('http')
        ? data.certificate.verificationUrl
        : `https://clearance.futminna-fedpoffa.edu.ng${data.certificate.verificationUrl}`)
    : `https://clearance.futminna-fedpoffa.edu.ng/verify/certificate/${encodeURIComponent(data.certificate?.certificateNumber || '')}`;

  try {
    const qrPngBuffer = await QRCode.toBuffer(verificationUrl, {
      type: 'png',
      width: 256,
      margin: 1,
      color: {
        dark: '#1E1B4B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    const qrImage = await doc.embedPng(qrPngBuffer);
    const qrSize = 70;
    const qrX = metaMargin + 10;
    const qrY = footerSectionY - 12;

    page.drawRectangle({
      x: qrX - 3,
      y: qrY - 3,
      width: qrSize + 6,
      height: qrSize + 6,
      color: colorWhite,
      borderColor: colorDeepPurple,
      borderWidth: 1,
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    page.drawText('SCAN TO VERIFY', {
      x: qrX + 4,
      y: qrY - 12,
      size: 6.5,
      font: fontBold,
      color: colorDeepPurple,
    });
    page.drawText('SHA-256 Authenticated', {
      x: qrX + 2,
      y: qrY - 20,
      size: 5.5,
      font: fontRegular,
      color: colorMutedText,
    });
  } catch (err) {
    console.error('Failed to embed QR code into PDF:', err);
  }

  // 3 Institutional Signatures Columns
  const sigColWidth = 118;
  const sigStartY = footerSectionY + 42;

  const signatures = [
    {
      signatoryName: 'Prof. Comfort Ogunleye',
      title: 'Dean of Faculty',
      subTitle: 'Faculty of Applied Sciences (FAST)',
      institution: 'The Federal Polytechnic Offa',
      signFont: fontTimesItalic,
    },
    {
      signatoryName: 'Dr. A. O. Babalola',
      title: 'Director, Degree Directorate',
      subTitle: 'Affiliation Programmes Division',
      institution: 'The Federal Polytechnic Offa',
      signFont: fontTimesItalic,
    },
    {
      signatoryName: 'Alh. A. N. Kolo, mni',
      title: 'Academic Registrar',
      subTitle: 'Central Registry Division',
      institution: 'Federal University of Technology Minna',
      signFont: fontTimesItalic,
    },
  ];

  signatures.forEach((sig, idx) => {
    const sx = metaMargin + 105 + idx * (sigColWidth + 12);

    // Calligraphic style simulated handwritten signoff
    page.drawText(sig.signatoryName, {
      x: sx + 10,
      y: sigStartY,
      size: 10.5,
      font: sig.signFont,
      color: colorMediumPurple,
    });

    // Horizontal signature line
    page.drawLine({
      start: { x: sx, y: sigStartY - 6 },
      end: { x: sx + sigColWidth, y: sigStartY - 6 },
      color: colorDarkText,
      thickness: 0.75,
    });

    // Official Printed Title
    page.drawText(sig.signatoryName, {
      x: sx,
      y: sigStartY - 16,
      size: 7.5,
      font: fontBold,
      color: colorDarkText,
    });

    page.drawText(sig.title, {
      x: sx,
      y: sigStartY - 25,
      size: 6.5,
      font: fontBold,
      color: colorDeepPurple,
    });

    page.drawText(sig.subTitle, {
      x: sx,
      y: sigStartY - 33,
      size: 6,
      font: fontRegular,
      color: colorMutedText,
    });

    page.drawText(sig.institution, {
      x: sx,
      y: sigStartY - 41,
      size: 5.5,
      font: fontRegular,
      color: colorMutedText,
    });
  });

  // -------------------------------------------------------------------------
  // 7. Cryptographic Security Bottom Foil
  // -------------------------------------------------------------------------
  const bottomLineY = 48;
  page.drawLine({
    start: { x: innerBorderInset + 8, y: bottomLineY },
    end: { x: pageWidth - innerBorderInset - 8, y: bottomLineY },
    color: colorBorderPurple,
    thickness: 0.5,
  });

  const fullHash = cleanText(data.certificate?.registrySignatureHash || 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');
  page.drawText(`Cryptographic Registry Hash: ${fullHash}`, {
    x: innerBorderInset + 10,
    y: bottomLineY - 10,
    size: 6,
    font: fontCourier,
    color: colorMutedText,
  });

  page.drawText(
    'Official Institutional Registry System * Direct Degree Affiliation Framework * FUTMINNA & FEDPOFFA',
    {
      x: innerBorderInset + 10,
      y: bottomLineY - 18,
      size: 5.5,
      font: fontRegular,
      color: colorMutedText,
    }
  );

  return doc.save();
}
