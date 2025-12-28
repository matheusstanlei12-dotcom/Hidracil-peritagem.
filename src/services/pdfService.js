import jsPDF from 'jspdf';

const COLORS = {
    primary: '#006945',      // Hidracil Green
    primaryLight: '#E8F5E9', // Soft Green for blocks
    secondary: '#1A1A1A',    // Deep Black for titles
    text: '#374151',         // Gray for body text
    border: '#D1D5DB',       // Light Border
    accent: '#059669',       // Accent Green
    white: '#FFFFFF',
    red: '#DC2626'
};

const PAGE = {
    w: 210,
    h: 297,
    m: 15, // Slightly larger margins for a modern look
    cw: 180
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

export const generatePeritagemPDF = (peritagem, type) => {
    const doc = new jsPDF();
    let currentY = 0;

    // --- CAPA ---
    const drawCover = () => {
        // Logo center
        doc.setFillColor(COLORS.white);
        try {
            // Using a rectangle as placeholder for logo if not available, 
            // but in Hidracil we expect logo.png to exist in public.
            doc.addImage("/logo.png", "PNG", (PAGE.w / 2) - 40, 40, 80, 40);
        } catch (e) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(COLORS.primary);
            doc.text("HIDRACIL", PAGE.w / 2, 60, { align: 'center' });
        }

        // Title Section
        doc.setDrawColor(COLORS.primary);
        doc.setLineWidth(1);
        doc.line(PAGE.m, 110, PAGE.w - PAGE.m, 110);

        doc.setFontSize(26);
        doc.setTextColor(COLORS.secondary);
        doc.setFont('helvetica', 'bold');
        doc.text("RELATÓRIO TÉCNICO", PAGE.w / 2, 130, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.text);
        doc.text("PERITAGEM E ANÁLISE DE EQUIPAMENTOS", PAGE.w / 2, 140, { align: 'center' });

        doc.line(PAGE.m, 150, PAGE.w - PAGE.m, 150);

        // Client Info Block on Cover
        currentY = 180;
        doc.setFillColor(COLORS.primaryLight);
        doc.roundedRect(PAGE.m, currentY, PAGE.cw, 50, 3, 3, 'F');

        doc.setFontSize(10);
        doc.setTextColor(COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text("DADOS DO CLIENTE E EQUIPAMENTO", PAGE.m + 5, currentY + 10);

        doc.setTextColor(COLORS.secondary);
        doc.setFontSize(11);
        doc.text(`CLIENTE: ${peritagem.cliente || "-"}`, PAGE.m + 5, currentY + 22);
        doc.text(`EQUIPAMENTO: ${peritagem.equipamento || "-"}`, PAGE.m + 5, currentY + 30);
        doc.text(`ORÇAMENTO: #${peritagem.orcamento || peritagem.id || "-"}`, PAGE.m + 5, currentY + 38);

        // Footer Cover
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text);
        doc.text(`Goiânia, ${formatDate(peritagem.created_at || new Date())}`, PAGE.w / 2, PAGE.h - 20, { align: 'center' });
        doc.text("www.hidracil.com.br", PAGE.w / 2, PAGE.h - 15, { align: 'center' });
    };

    // --- CONTENT HEADER ---
    const drawHeader = () => {
        currentY = PAGE.m;

        // Minimalist header
        try {
            doc.addImage("/logo.png", "PNG", PAGE.m, currentY, 30, 15);
        } catch (e) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(COLORS.primary);
            doc.text("HIDRACIL", PAGE.m, currentY + 10);
        }

        doc.setFontSize(8);
        doc.setTextColor(COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.text(`Relatório #${peritagem.orcamento || peritagem.id}`, PAGE.w - PAGE.m, currentY + 5, { align: 'right' });
        doc.text(`Equipamento: ${peritagem.equipamento}`, PAGE.w - PAGE.m, currentY + 10, { align: 'right' });

        currentY += 20;
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.1);
        doc.line(PAGE.m, currentY, PAGE.w - PAGE.m, currentY);
        currentY += 10;
    };

    // 1. Initial Cover
    drawCover();
    doc.addPage();

    // 2. Initial Page Header
    drawHeader();

    peritagem.items.forEach((item, idx) => {
        // Space Check
        if (currentY + 60 > PAGE.h - PAGE.m) {
            doc.addPage();
            drawHeader();
        }

        // Technical Block Header
        doc.setFillColor(COLORS.primary);
        doc.rect(PAGE.m, currentY, PAGE.cw, 8, 'F');
        doc.setTextColor(COLORS.white);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`ITEM ${idx + 1}: ${item.component?.toUpperCase() || "COMPONENTE"}`, PAGE.m + 5, currentY + 5.5);

        currentY += 8;

        // Metadata Grid (Anomalia / Solução)
        const blockH = 25;
        doc.setFillColor(COLORS.primaryLight);
        doc.rect(PAGE.m, currentY, PAGE.cw, blockH, 'F');

        doc.setFontSize(8);
        doc.setTextColor(COLORS.accent);
        doc.text("ANOMALIA IDENTIFICADA:", PAGE.m + 5, currentY + 6);
        doc.setTextColor(COLORS.secondary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        // Use splitTextToSize for long text
        const anomalyLines = doc.splitTextToSize(item.anomalies || "Nenhuma anomalia relatada.", PAGE.cw - 10);
        doc.text(anomalyLines, PAGE.m + 5, currentY + 11);

        doc.setDrawColor(COLORS.border);
        doc.line(PAGE.m + 5, currentY + 13, PAGE.w - PAGE.m - 5, currentY + 13);

        const solutionY = currentY + 18;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.accent);
        doc.text("SOLUÇÃO RECOMENDADA:", PAGE.m + 5, solutionY);
        doc.setTextColor(COLORS.secondary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const solutionLines = doc.splitTextToSize(item.solution || "Manutenção padrão / Limpeza.", PAGE.cw - 10);
        doc.text(solutionLines, PAGE.m + 5, solutionY + 5);

        currentY += blockH + 10;

        // Extra info (Custo/Valor) - discreet
        if (type === 'comprador' || type === 'orcamentista' || type === 'cliente') {
            doc.setFontSize(8);
            doc.setTextColor(COLORS.text);
            let label = "";
            let val = "";
            if (type === 'comprador') {
                label = "CUSTO ESTIMADO:";
                val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.costs?.cost || 0);
            } else {
                label = "VALOR UNITÁRIO:";
                val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.budget?.sellPrice || 0);
            }
            doc.setFont('helvetica', 'bold');
            doc.text(label, PAGE.m, currentY - 5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(COLORS.accent);
            doc.text(val, PAGE.m + 35, currentY - 5);
        }

        // PHOTOS GRID
        if (item.photos && item.photos.length > 0) {
            const photoW = 86;
            const photoH = 58;
            const gap = 8;

            item.photos.forEach((photo, pIdx) => {
                const col = pIdx % 2;
                const x = PAGE.m + (col * (photoW + gap));

                if (col === 0 && currentY + photoH + 15 > PAGE.h - PAGE.m) {
                    doc.addPage();
                    drawHeader();
                }

                try {
                    // Frame
                    doc.setDrawColor(COLORS.border);
                    doc.setLineWidth(0.1);
                    doc.rect(x, currentY, photoW, photoH);
                    doc.addImage(photo, 'JPEG', x + 1, currentY + 1, photoW - 2, photoH - 2);

                    // Technical Caption
                    doc.setFontSize(7);
                    doc.setTextColor(COLORS.text);
                    doc.setFont('helvetica', 'italic');
                    doc.text(`Registro ${idx + 1}.${pIdx + 1}: Vista técnica do componente ${item.component || ""}`, x, currentY + photoH + 5);
                } catch (e) {
                    doc.text("Erro ao processar imagem", x + 5, currentY + 20);
                }

                if (col === 1 || pIdx === item.photos.length - 1) {
                    currentY += photoH + 15;
                }
            });
        }

        currentY += 5; // spacing between items
    });

    // --- SIGNATURES SECTION (LAST PAGE) ---
    // Check space for signature
    if (currentY + 40 > PAGE.h - PAGE.m - 20) {
        doc.addPage();
        drawHeader();
        currentY = 60; // Start higher on empty last page
    } else {
        currentY += 20;
    }

    const sigW = 75;
    const sigY = currentY + 15;

    doc.setDrawColor(COLORS.secondary);
    doc.setLineWidth(0.5);

    // Left Sig: Hidracil
    doc.line(PAGE.m, sigY, PAGE.m + sigW, sigY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.secondary);
    doc.text("HIDRACIL COMPONENTES HIDRÁULICOS LTDA", PAGE.m + (sigW / 2), sigY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    doc.text("RESPONSÁVEL TÉCNICO / ENGENHARIA", PAGE.m + (sigW / 2), sigY + 9, { align: 'center' });

    // Right Sig: Cliente
    const rightSigX = PAGE.w - PAGE.m - sigW;
    doc.line(rightSigX, sigY, PAGE.w - PAGE.m, sigY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.secondary);
    doc.text("ACEITE DO CLIENTE", rightSigX + (sigW / 2), sigY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    doc.text("RESPONSÁVEL / DATA: ___/___/___", rightSigX + (sigW / 2), sigY + 9, { align: 'center' });


    // --- GLOBAL FOOTER (ON ALL PAGES) ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor("#9CA3AF"); // Light Gray (Discreet)
        doc.setFont('helvetica', 'normal');

        const footerY = PAGE.h - 15;
        const footerText = `HIDRACIL Componentes Hidráulicos | Documento Gerado em ${new Date().toLocaleDateString('pt-BR')} | Página ${i} de ${totalPages}`;
        doc.text(footerText, PAGE.w / 2, footerY, { align: 'center' });

        doc.setFontSize(7);
        doc.text("Documento técnico gerado automaticamente pelo sistema TrustEng", PAGE.w / 2, footerY + 4, { align: 'center' });
    }

    doc.save(`Relatório_Técnico_Hidracil_${peritagem.orcamento || "Draft"}.pdf`);
};
