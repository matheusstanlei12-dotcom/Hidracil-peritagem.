import jsPDF from 'jspdf';

const COLORS = {
    primary: '#2563EB',      // Trust Tecnologia Blue
    primaryLight: '#EFF6FF', // Ultra light blue for backgrounds
    secondary: '#111827',    // Near black for high contrast
    text: '#4B5563',         // Slate gray for readability
    muted: '#9CA3AF',        // Gray for labels
    border: '#E5E7EB',       // Modern light border
    white: '#FFFFFF',
    accent: '#3B82F6'        // Vibrant blue for icons/markers
};

const PAGE = {
    w: 210,
    h: 297,
    m: 15,
    cw: 180
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const generatePeritagemPDF = (peritagem, type) => {
    const doc = new jsPDF();
    let currentY = 0;

    // --- HELPER: NEW PAGE ---
    const startNewPage = (showHeader = true) => {
        doc.addPage();
        currentY = PAGE.m;
        if (showHeader) drawMiniHeader();
    };

    // --- MINI HEADER (Internal Pages) ---
    const drawMiniHeader = () => {
        currentY = 10;
        try {
            doc.addImage("/logo.png", "PNG", PAGE.m, currentY, 30, 15);
        } catch (e) { }

        doc.setFontSize(8);
        doc.setTextColor(COLORS.muted);
        doc.text(`Relatório Técnico #${peritagem.orcamento || peritagem.id}`, PAGE.w - PAGE.m, currentY + 5, { align: 'right' });
        doc.text(`Cliente: ${peritagem.cliente || "-"}`, PAGE.w - PAGE.m, currentY + 10, { align: 'right' });

        currentY += 18;
        doc.setDrawColor(COLORS.border);
        doc.line(PAGE.m, currentY, PAGE.w - PAGE.m, currentY);
        currentY += 10;
    };

    // --- CABEÇALHO TÉCNICO (PAGE 1) ---
    const drawTechnicalHeader = () => {
        currentY = 10;

        // 1. Logo and Company Info Grid
        try {
            doc.addImage("/logo.png", "PNG", PAGE.m, currentY, 45, 20);
        } catch (e) {
            doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(COLORS.primary).text("HIDRACIL", PAGE.m, currentY + 12);
        }

        doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(COLORS.secondary).text("Hidracil Componentes Hidráulicos Ltda", 80, currentY + 5);

        doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(COLORS.text);
        doc.text("CNPJ: 00.376.390/0001-07    I.E.: 10.271.903-9", 80, currentY + 10);
        doc.text("Fone: (62) 4006-5151    Fax: (62) 4006-5130", 80, currentY + 14);
        doc.text("Rua Guararapes, 120 Qd.34 Lt.01    Bairro Ipiranga", 80, currentY + 18);

        currentY += 28;

        // 2. Main Title Section
        doc.setFillColor(COLORS.primary);
        doc.rect(PAGE.m, currentY, PAGE.cw, 10, 'F');
        doc.setFontSize(14).setFont('helvetica', 'bold').setTextColor(COLORS.white);
        doc.text("RELATÓRIO TÉCNICO", PAGE.w / 2, currentY + 7, { align: 'center' });

        currentY += 15;

        // 3. Info Boxes - Staggered Modern Layout
        doc.setDrawColor(COLORS.secondary).setLineWidth(0.5);

        // Box 1: Cliente
        doc.roundedRect(PAGE.m, currentY, PAGE.cw, 32, 3, 3, 'D');
        doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(COLORS.primary).text(" DADOS DO CLIENTE", PAGE.m + 3, currentY + 6);

        doc.setTextColor(COLORS.secondary);
        doc.text("Cliente:", PAGE.m + 5, currentY + 14);
        doc.setFont('helvetica', 'normal').text(peritagem.cliente || "-", PAGE.m + 20, currentY + 14);

        doc.setFont('helvetica', 'bold').text("Endereço:", PAGE.m + 5, currentY + 21);
        doc.setFont('helvetica', 'normal').text(`${peritagem.endereco || "-"}, ${peritagem.bairro || "-"}`, PAGE.m + 24, currentY + 21);

        doc.setFont('helvetica', 'bold').text("Localidade:", PAGE.m + 5, currentY + 28);
        doc.setFont('helvetica', 'normal').text(`${peritagem.municipio || peritagem.cidade || "-"} - ${peritagem.uf || "-"}`, PAGE.m + 25, currentY + 28);

        currentY += 35;

        // Box 2: Equipamento
        doc.roundedRect(PAGE.m, currentY, PAGE.cw, 52, 3, 3, 'D');
        doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(COLORS.primary).text(" IDENTIFICAÇÃO DO EQUIPAMENTO", PAGE.w / 2, currentY + 8, { align: 'center' });

        const drawLabel = (label, value, x, y) => {
            doc.setFont('helvetica', 'bold').setTextColor(COLORS.secondary).text(label, x, y);
            doc.setFont('helvetica', 'normal').setTextColor(COLORS.text).text(String(value), x + 25, y);
        };

        drawLabel("Orçamento:", peritagem.orcamento || "-", PAGE.m + 5, currentY + 18);

        doc.setFont('helvetica', 'bold').text("Equipamento:", PAGE.m + 5, currentY + 25);
        const equipText = doc.splitTextToSize(peritagem.equipamento || "-", PAGE.cw - 35);
        doc.setFont('helvetica', 'normal').text(equipText, PAGE.m + 30, currentY + 25);

        const nextY = currentY + 34;
        drawLabel("CX:", peritagem.cx || "-", PAGE.m + 5, nextY);
        drawLabel("TAG:", peritagem.tag || "-", PAGE.m + 70, nextY);
        drawLabel("NF:", peritagem.nf || "-", PAGE.m + 130, nextY);

        currentY += 65;

        // Header Footer: Responsible
        doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(COLORS.secondary);
        doc.text(`Responsável: ${peritagem.responsavel_tecnico || peritagem.perito_name || "-"}`, PAGE.m, currentY);
        doc.setFontSize(9).setFont('helvetica', 'italic').setTextColor(COLORS.text);
        const cityAndDate = `${peritagem.cidade || "Goiânia"}, ${formatDate(peritagem.created_at || new Date())}`;
        doc.text(cityAndDate, PAGE.w - PAGE.m, currentY, { align: 'right' });

        currentY += 8;
        doc.setDrawColor(COLORS.border).setLineWidth(0.1).line(PAGE.m, currentY, PAGE.w - PAGE.m, currentY);
        currentY += 12;
    };

    // 1. Initial Page
    drawTechnicalHeader();

    // 2. Dynamic Items
    peritagem.items.forEach((item, idx) => {
        // Space Check
        if (currentY + 50 > PAGE.h - 30) {
            startNewPage();
        }

        // Technical Card Header
        doc.setFillColor(COLORS.primary);
        doc.rect(PAGE.m, currentY, PAGE.cw, 7, 'F');
        doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(COLORS.white);
        doc.text(`ITEM ${idx + 1} | ANALISE DE ${item.component?.toUpperCase() || "COMPONENTE"}`, PAGE.m + 4, currentY + 5);

        currentY += 7;

        // Content Block
        const contentLines = Math.max(
            doc.splitTextToSize(item.anomalies, PAGE.cw - 10).length,
            doc.splitTextToSize(item.solution, PAGE.cw - 10).length
        );
        const blockHeight = 15 + (contentLines * 5) + (item.photos?.length > 0 ? 0 : 10);

        doc.setFillColor(COLORS.primaryLight);
        doc.rect(PAGE.m, currentY, PAGE.cw, blockHeight, 'F');

        // Textual Content
        doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(COLORS.accent);
        doc.text("ANOMALIA IDENTIFICADA:", PAGE.m + 5, currentY + 6);
        doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(COLORS.secondary);
        doc.text(doc.splitTextToSize(item.anomalies || "Nenhuma anomalia relatada.", PAGE.cw - 10), PAGE.m + 5, currentY + 11);

        const solY = currentY + 20;
        doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(COLORS.primary);
        doc.text("INTERVENÇÃO TÉCNICA RECOMENDADA:", PAGE.m + 5, solY);
        doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(COLORS.secondary);
        doc.text(doc.splitTextToSize(item.solution || "-", PAGE.cw - 10), PAGE.m + 5, solY + 5);

        currentY += blockHeight + 10;

        // PHOTOS GRID (Clean Design)
        if (item.photos && item.photos.length > 0) {
            const photoW = 87;
            const photoH = 58;
            const gap = 6;

            for (let i = 0; i < item.photos.length; i += 2) {
                if (currentY + photoH + 15 > PAGE.h - 30) {
                    startNewPage();
                }

                // Row of 2 photos
                for (let j = 0; j < 2; j++) {
                    const pIdx = i + j;
                    if (pIdx >= item.photos.length) break;

                    const x = PAGE.m + (j * (photoW + gap));

                    try {
                        // Shadow-like border
                        doc.setDrawColor(COLORS.border).setLineWidth(0.2);
                        doc.rect(x, currentY, photoW, photoH);
                        doc.addImage(item.photos[pIdx], 'JPEG', x + 1, currentY + 1, photoW - 2, photoH - 2);

                        doc.setFontSize(7).setFont('helvetica', 'italic').setTextColor(COLORS.muted);
                        doc.text(`Registro ${idx + 1}.${pIdx + 1}: Verificação técnica (${item.component})`, x, currentY + photoH + 4);
                    } catch (e) { }
                }
                currentY += photoH + 12;
            }
        }
        currentY += 5;
    });

    // --- SIGNATURES (Last Page) ---
    if (currentY + 60 > PAGE.h - 30) {
        startNewPage();
    } else {
        currentY += 15;
    }

    const sigW = 80;
    const sigY = currentY + 20;
    doc.setDrawColor(COLORS.secondary).setLineWidth(0.5);

    // Left
    doc.line(PAGE.m, sigY, PAGE.m + sigW, sigY);
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(COLORS.secondary).text("HIDRACIL COMPONENTES HIDRÁULICOS LTDA", PAGE.m + (sigW / 2), sigY + 5, { align: 'center' });
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(COLORS.text).text("ASSINATURA DO TÉCNICO RESPONSÁVEL", PAGE.m + (sigW / 2), sigY + 9, { align: 'center' });

    // Right
    const rX = PAGE.w - PAGE.m - sigW;
    doc.line(rX, sigY, PAGE.w - PAGE.m, sigY);
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(COLORS.secondary).text("ACEITE E CONCORDÂNCIA DO CLIENTE", rX + (sigW / 2), sigY + 5, { align: 'center' });
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(COLORS.text).text("DATA E CARIMBO DA EMPRESA", rX + (sigW / 2), sigY + 9, { align: 'center' });

    // --- FOOTER FOR ALL ---
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor("#9CA3AF");

        const fY = PAGE.h - 10;
        doc.text(`HIDRACIL | Peritagem Técnica #${peritagem.orcamento || peritagem.id} | Page ${i} of ${total}`, PAGE.w / 2, fY, { align: 'center' });
        doc.text("Sistema TrustEng - Soluções em Engenharia Hidráulica Industrial", PAGE.w / 2, fY + 4, { align: 'center' });
    }

    doc.save(`Relatorio_Premium_Hidracil_${peritagem.orcamento || "Export"}.pdf`);
};
