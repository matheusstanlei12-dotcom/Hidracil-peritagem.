import jsPDF from 'jspdf';

const COLORS = {
    primary: '#006945',
    text: '#333333',
    blue: '#0056b3',
    border: '#000000',
    red: '#dc3545'
};

const PAGE = {
    w: 210,
    h: 297,
    m: 10,
    cw: 190
};

export const generatePeritagemPDF = (peritagem, type) => {
    const doc = new jsPDF();
    let currentY = PAGE.m;

    const drawHeader = () => {
        currentY = PAGE.m;

        // Logo & Brand
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(COLORS.primary);
        doc.text("HIDRACIL - SISTEMA ATUALIZADO V2.0", PAGE.m, currentY + 10);

        doc.setFontSize(8);
        doc.setTextColor(COLORS.text);
        doc.text("Relatorio Tecnico de Peritagem Hidraulica", PAGE.m, currentY + 15);

        // Header Border Text
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(PAGE.m, currentY + 20, PAGE.w - PAGE.m, currentY + 20);

        currentY += 25;

        // Info Box
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Cliente: ${peritagem.cliente || "-"}`, PAGE.m, currentY);
        doc.text(`Equipamento: ${peritagem.equipamento || "-"}`, PAGE.m, currentY + 6);
        doc.text(`Orcamento: ${peritagem.orcamento || "-"}`, PAGE.m, currentY + 12);

        const dateStr = peritagem.created_at ? new Date(peritagem.created_at).toLocaleDateString('pt-BR') : "-";
        doc.text(`Data: ${dateStr}`, PAGE.w - PAGE.m - 40, currentY);

        currentY += 18;
        doc.line(PAGE.m, currentY, PAGE.w - PAGE.m, currentY);
        currentY += 10;
    };

    drawHeader();

    peritagem.items.forEach((item, idx) => {
        // Table Rows
        const rowH = 8;

        // Page break check for the metadata block
        if (currentY + 30 > PAGE.h - PAGE.m) {
            doc.addPage();
            drawHeader();
        }

        // DRAW TABLE ROWS (Full width, no side columns)
        doc.setLineWidth(0.1);

        // Row 1
        doc.rect(PAGE.m, currentY, PAGE.cw, rowH);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text("DESCRICAO:", PAGE.m + 2, currentY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.blue);
        doc.text(item.component || "-", PAGE.m + 30, currentY + 5);
        doc.setTextColor(COLORS.text);
        currentY += rowH;

        // Row 2
        doc.rect(PAGE.m, currentY, PAGE.cw, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text("ANOMALIA:", PAGE.m + 2, currentY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.blue);
        doc.text(item.anomalies || "-", PAGE.m + 30, currentY + 5);
        doc.setTextColor(COLORS.text);
        currentY += rowH;

        // Row 3
        doc.rect(PAGE.m, currentY, PAGE.cw, rowH);
        doc.setFont('helvetica', 'bold');
        doc.text("SOLUCAO:", PAGE.m + 2, currentY + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.blue);
        doc.text(item.solution || "-", PAGE.m + 30, currentY + 5);
        doc.setTextColor(COLORS.text);
        currentY += rowH + 5;

        // PHOTOS GRID (2 per row)
        if (item.photos && item.photos.length > 0) {
            const photoW = 92;
            const photoH = 60;
            const gap = 4;

            item.photos.forEach((photo, pIdx) => {
                const col = pIdx % 2;
                const x = PAGE.m + (col * (photoW + gap));

                // If we are starting a new row, check page space
                if (col === 0 && currentY + photoH > PAGE.h - PAGE.m) {
                    doc.addPage();
                    drawHeader();
                    // currentY is reset in drawHeader, but we might need a small offset
                    currentY += 5;
                }

                try {
                    // Border for photo
                    doc.setDrawColor(COLORS.red);
                    doc.setLineWidth(0.5);
                    doc.rect(x, currentY, photoW, photoH);
                    doc.addImage(photo, 'JPEG', x, currentY, photoW, photoH);
                } catch (e) {
                    doc.text("Erro na foto", x + 5, currentY + 20);
                }

                // If it's the 2nd photo or the last one, move currentY down
                if (col === 1 || pIdx === item.photos.length - 1) {
                    currentY += photoH + gap;
                }
            });
        }

        currentY += 8; // Spacing between components
    });

    // Page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Pagina ${i} de ${totalPages}`, PAGE.w - PAGE.m, PAGE.h - 5, { align: 'right' });
    }

    doc.save(`Peritagem_${peritagem.id || "Report"}.pdf`);
};
