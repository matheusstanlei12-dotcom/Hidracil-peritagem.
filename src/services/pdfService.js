import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Constants & Config ---
const COLORS = {
    primary: '#006945', // Updated to Hidracil Green from logo
    secondary: '#495057',
    text: '#000000',
    blueText: '#0056b3', // For table values
    lightBg: '#ffffff',
    border: '#000000', // Bold borders
    white: '#ffffff',
    red: '#dc3545'
};

const PAGE = {
    width: 210,
    height: 297,
    margin: 10,
    contentWidth: 190
};

// --- Helper Functions ---
const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Returns "Goiânia DD de MMMM de YYYY" format
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    const city = "Goiânia"; // Hardcoded or from env
    return `${city} ${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
};

export const generatePeritagemPDF = (peritagem, type) => {
    const doc = new jsPDF();
    let currentY = PAGE.margin;

    // --- Header Generator ---
    const drawHeader = () => {
        currentY = PAGE.margin;

        // 1. Top Section: Logo + Company Info
        // Logo (Left) - Placeholder
        doc.setFillColor(COLORS.white);
        // Assuming we have a logo image, using text for now if image fails, but drawing a placeholder rect
        // doc.addImage("/logo.png", "PNG", PAGE.margin, currentY, 40, 20); 
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.primary);
        doc.text("HIDRACIL", PAGE.margin + 10, currentY + 10);
        doc.setFontSize(8);
        doc.text("Componentes Hidráulicos", PAGE.margin + 5, currentY + 15);

        // Company Details (Right)
        const infoX = 70;
        doc.setTextColor(COLORS.text);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("Hidracil Componentes Hidráulicos Ltda", infoX, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text("CNPJ: 08.376.390/0001-07", infoX, currentY + 10);
        doc.text("I.E.: 10.271.903-9", infoX + 60, currentY + 10);
        doc.text("Fone: (62) 4006-5151", infoX, currentY + 14);
        doc.text("Fax: (62) 4006-5130", infoX + 60, currentY + 14);
        doc.text("Rua Guaranapes, 120 Qd 34 Lt 01    Bairro Ipiranga", infoX, currentY + 18);

        // Title
        currentY += 25;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("RELATÓRIO TÉCNICO", PAGE.width / 2, currentY, { align: 'center' });

        // 2. Client Info Box
        currentY += 5;
        drawRoundedBox(currentY, 22); // Height approx

        doc.setFontSize(8);
        const line1Y = currentY + 6;
        const line2Y = currentY + 12;
        const line3Y = currentY + 18;

        // Line 1: Cliente
        doc.setFont('helvetica', 'bold');
        doc.text("Cliente:", PAGE.margin + 2, line1Y);
        doc.setFont('helvetica', 'normal');
        doc.text(peritagem.cliente || "", PAGE.margin + 15, line1Y);

        // Line 2: Endereço (Mocked if missing) | Bairro
        doc.setFont('helvetica', 'bold');
        doc.text("Endereço:", PAGE.margin + 2, line2Y);
        doc.setFont('helvetica', 'normal');
        doc.text("Rua Rio Azul, Qd. 03 Lt. 07,09 11 e 13 N.0", PAGE.margin + 18, line2Y); // Mock from image ref? Or leave blank/field

        doc.setFont('helvetica', 'bold');
        doc.text("Bairro:", PAGE.margin + 120, line2Y);
        doc.setFont('helvetica', 'normal');
        doc.text(peritagem.cidade || "Beira Rio", PAGE.margin + 132, line2Y);

        // Line 3: Município | UF
        doc.setFont('helvetica', 'bold');
        doc.text("Município:", PAGE.margin + 2, line3Y);
        doc.setFont('helvetica', 'normal');
        doc.text(peritagem.cidade || "Parauapebas", PAGE.margin + 18, line3Y);

        doc.setFont('helvetica', 'bold');
        doc.text("UF:", PAGE.margin + 120, line3Y);
        doc.setFont('helvetica', 'normal');
        doc.text("PA", PAGE.margin + 126, line3Y); // Mock

        // 3. Equipment Info Box
        currentY += 25;
        // Title for box
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("IDENTIFICAÇÃO DO EQUIPAMENTO", PAGE.width / 2, currentY + 4, { align: 'center' });

        // The box itself
        drawRoundedBox(currentY + 5, 30);

        const contentBoxY = currentY + 5;
        doc.setFontSize(8);

        const fields = [
            { label: "Orçamento:", val: peritagem.orcamento },
            { label: "Equipamento:", val: peritagem.equipamento },
            { label: "CX:", val: peritagem.cx },
            { label: "TAG:", val: peritagem.tag },
            { label: "NF:", val: peritagem.nf }
        ];

        fields.forEach((f, i) => {
            const y = contentBoxY + 6 + (i * 5);
            doc.setFont('helvetica', 'bold');
            doc.text(f.label, PAGE.margin + 2, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(f.val || ""), PAGE.margin + 25, y);
        });

        currentY += 40;

        // Footer of Header (Responsible + Date)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text("Responsável:", PAGE.width / 2 - 20, currentY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text(peritagem.responsavel_tecnico || "Guilherme F. Rodrigues", PAGE.width / 2 - 18, currentY);

        doc.setFont('helvetica', 'italic');
        doc.text(formatDate(peritagem.created_at || new Date()), PAGE.width - PAGE.margin, currentY, { align: 'right' });

        currentY += 10;
        // Separator double line or simple line
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(PAGE.margin, currentY, PAGE.width - PAGE.margin, currentY);
        currentY += 5;
    };

    const drawRoundedBox = (y, h) => {
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.7);
        doc.roundedRect(PAGE.margin, y, PAGE.contentWidth, h, 3, 3, 'S');
    };

    // --- Initial Header ---
    drawHeader();

    // --- Items Loop ---

    peritagem.items.forEach((item, index) => {
        const tableHeaderHeight = 7;
        const photoHeight = 60;
        const photoWidth = 90;
        const gap = 5;

        // Estimate item height without photos first
        let itemBaseHeight = tableHeaderHeight * 3 + 10;

        // Photos calculation
        const photosCount = item.photos?.length || 0;
        const rowsCount = Math.ceil(photosCount / 2);
        const itemPhotosHeight = rowsCount * (photoHeight + gap);
        const totalItemHeight = itemBaseHeight + itemPhotosHeight;

        // Page Break
        if (currentY + itemBaseHeight > PAGE.height - PAGE.margin - 20) {
            doc.addPage();
            drawHeader();
        }

        // Row 1: Descrição
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.1);
        doc.rect(PAGE.margin, currentY, PAGE.contentWidth, tableHeaderHeight);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.text);
        doc.text("DESCRIÇÃO:", PAGE.margin + 2, currentY + 5);

        doc.setTextColor(COLORS.blueText);
        doc.setFont('helvetica', 'normal');
        doc.text(item.component || "", PAGE.margin + 35, currentY + 5);

        currentY += tableHeaderHeight;

        // Row 2: Anomalia
        doc.setTextColor(COLORS.text);
        doc.rect(PAGE.margin, currentY, PAGE.contentWidth, tableHeaderHeight);
        doc.setFont('helvetica', 'bold');
        doc.text("ANOMALIA:", PAGE.margin + 2, currentY + 5);

        doc.setTextColor(COLORS.blueText);
        doc.setFont('helvetica', 'normal');
        doc.text(item.anomalies || "", PAGE.margin + 35, currentY + 5);

        currentY += tableHeaderHeight;

        // Row 3: Solução
        doc.rect(PAGE.margin, currentY, PAGE.contentWidth, tableHeaderHeight);
        doc.setFont('helvetica', 'bold');
        doc.text("SOLUÇÃO:", PAGE.margin + 2, currentY + 5);

        doc.setTextColor(COLORS.blueText);
        doc.setFont('helvetica', 'normal');
        doc.text(item.solution || "", PAGE.margin + 35, currentY + 5);

        currentY += tableHeaderHeight + 5;

        // Photos Grid (2 per row)
        if (item.photos && item.photos.length > 0) {
            item.photos.forEach((photo, pIdx) => {
                const col = pIdx % 2;
                const row = Math.floor(pIdx / 2);

                const xPos = PAGE.margin + (col * (photoWidth + gap));
                const yPos = currentY;

                // Check if photo fits in current page
                if (yPos + photoHeight > PAGE.height - PAGE.margin) {
                    doc.addPage();
                    drawHeader();
                    // After header, reset currentY and yPos for the remaining photos of THIS item
                    currentY = 110; // Approx Y after header in new page
                }

                try {
                    // Small red border for highlight
                    doc.setDrawColor(COLORS.red);
                    doc.setLineWidth(0.5);
                    doc.rect(xPos, currentY, photoWidth, photoHeight);

                    doc.addImage(photo, 'JPEG', xPos, currentY, photoWidth, photoHeight);
                } catch (e) {
                    doc.setFontSize(7);
                    doc.text("Erro ao carregar imagem", xPos + 5, currentY + 20);
                }

                // If it's the second photo in a row, or the last photo, move Y down
                if (col === 1 || pIdx === item.photos.length - 1) {
                    if (col === 1 || pIdx === item.photos.length - 1) {
                        currentY += photoHeight + gap;
                    }
                }
            });
        }

        currentY += 5; // Spacing before next item
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(COLORS.secondary);
        doc.text(`Página ${i} de ${pageCount}`, PAGE.width - PAGE.margin, PAGE.height - 5, { align: 'right' });
    }

    doc.save(`Relatorio_${peritagem.id || 'Draft'}.pdf`);
};
