from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_vente_pdf(vente, produits_by_id):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor("#D97706"),
        spaceAfter=4
    )
    right_align = ParagraphStyle('RightAlign', parent=styles['Normal'], alignment=2, fontSize=10)
    bold_right = ParagraphStyle('BoldRight', parent=styles['Normal'], alignment=2, fontName='Helvetica-Bold', fontSize=11)

    story.append(Paragraph("QUINCAILLERIE GÉNÉRALE", title_style))
    story.append(Paragraph(f"<b>FACTURE N° #{vente.id:05d}</b>", right_align))
    story.append(Spacer(1, 15))

    client_str = vente.client_nom if vente.client_nom else "Client Comptoir"
    story.append(Paragraph(f"<b>Client :</b> {client_str}", styles['Normal']))
    story.append(Paragraph(f"<b>Date :</b> {vente.date.strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 15))

    # Tableau des articles
    data = [["Référence / Désignation", "Prix Unitaire", "Quantité", "Sous-total"]]
    for ligne in vente.lignes.all():
        p_info = produits_by_id.get(ligne.produit_id, {})
        nom = p_info.get("nom", f"Produit #{ligne.produit_id}")
        ref = p_info.get("reference", "")
        desig = f"{ref} - {nom}" if ref else nom

        data.append([
            desig,
            f"{ligne.prix_unitaire:,.0f} FCFA",
            str(ligne.quantite),
            f"{ligne.sous_total:,.0f} FCFA"
        ])

    table = Table(data, colWidths=[240, 100, 70, 110])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#374151")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))

    # Calculs Financiers
    montant_total = float(vente.montant_total)
    montant_verse = float(vente.montant_verse)
    reste_a_payer = montant_total - montant_verse

    if reste_a_payer <= 0:
        statut_text = "<font color='green'><b>PAYÉ</b></font>"
    elif montant_verse > 0:
        statut_text = "<font color='orange'><b>PARTIELLEMENT PAYÉ</b></font>"
    else:
        statut_text = "<font color='red'><b>NON PAYÉ (À CRÉDIT)</b></font>"

    story.append(Paragraph(f"<b>Net à Payer :</b> {montant_total:,.0f} FCFA", bold_right))
    story.append(Paragraph(f"<b>Montant Versé :</b> {montant_verse:,.0f} FCFA", right_align))
    story.append(Paragraph(f"<b>Reste à Payer :</b> {reste_a_payer:,.0f} FCFA", bold_right))
    story.append(Spacer(1, 5))
    story.append(Paragraph(f"<b>Statut du règlement :</b> {statut_text}", right_align))

    doc.build(story)
    return buffer.getvalue()
