from fpdf import FPDF
from pathlib import Path


def _money(value):
    return f"{float(value):,.0f}".replace(",", " ")


def _draw_logo(pdf, parametres, x, y, size=28):
    logo_path = None
    if parametres and hasattr(parametres, 'logo') and parametres.logo:
        try:
            logo_path = parametres.logo.path
        except Exception:
            logo_path = None

    if logo_path and Path(logo_path).exists():
        pdf.image(logo_path, x=x, y=y, w=size, h=size, keep_aspect_ratio=True)
    else:
        pdf.set_fill_color(217, 122, 41)
        pdf.rect(x, y, size, size, style="F")
        nom_shop = parametres.nom if (parametres and hasattr(parametres, 'nom') and parametres.nom) else "Quincaillerie"
        initiales = "".join(w[0].upper() for w in nom_shop.split()[:2])
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(x, y + size / 2 - 3)
        pdf.cell(size, 6, text=initiales, align="C")
        pdf.set_text_color(30, 28, 26)


def generate_invoice_pdf(facture, lignes, client_nom, parametres):
    pdf = FPDF(format="A4", unit="mm")
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(True, margin=20)
    pdf.add_page()

    y_start = 15

    # Sécurité si les paramètres sont vides
    nom_shop = parametres.nom if (parametres and hasattr(parametres, 'nom') and parametres.nom) else "QUINCAILLERIE"
    slogan_shop = parametres.slogan if (parametres and hasattr(parametres, 'slogan')) else ""
    adresse_shop = parametres.adresse if (parametres and hasattr(parametres, 'adresse')) else ""
    tel_shop = parametres.telephone if (parametres and hasattr(parametres, 'telephone')) else ""
    email_shop = parametres.email if (parametres and hasattr(parametres, 'email')) else ""

    # Logo
    _draw_logo(pdf, parametres, x=15, y=y_start, size=28)

    # Nom et infos boutique
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 28, 26)
    pdf.set_xy(48, y_start)
    pdf.cell(0, 7, text=nom_shop.upper(), new_x="LMARGIN", new_y="NEXT")

    if slogan_shop:
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(107, 100, 92)
        pdf.set_x(48)
        pdf.cell(0, 5, text=f'"{slogan_shop}"', new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(107, 100, 92)
    for info in [adresse_shop, tel_shop, email_shop]:
        if info:
            pdf.set_x(48)
            pdf.cell(0, 4, text=info, new_x="LMARGIN", new_y="NEXT")

    # Bloc FACTURE (droite)
    pdf.set_fill_color(33, 32, 29)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.rect(135, y_start, 60, 10, style="F")
    pdf.set_xy(135, y_start)
    pdf.cell(60, 10, text="FACTURE", align="C")

    pdf.set_fill_color(242, 240, 235)
    pdf.set_text_color(30, 28, 26)
    pdf.set_font("Helvetica", "", 8)
    
    num_facture = facture.numero if getattr(facture, 'numero', None) else f"FAC-{facture.id}"
    date_str = facture.date_emission.strftime("%d/%m/%Y") if getattr(facture, 'date_emission', None) else ""
    
    infos_facture = [
        ("N° :", num_facture),
        ("Date :", date_str),
    ]
    if parametres and getattr(parametres, 'ninea', None):
        infos_facture.append(("NINEA :", parametres.ninea))
    if parametres and getattr(parametres, 'registre_commerce', None):
        infos_facture.append(("RC :", parametres.registre_commerce))

    for label, valeur in infos_facture:
        pdf.set_xy(135, pdf.get_y() + (10 if label == "N° :" else 0))
        pdf.cell(30, 6, text=label, border="B", fill=True)
        pdf.cell(30, 6, text=valeur, border="B", fill=True, new_x="LMARGIN", new_y="NEXT")

    # Bloc client
    pdf.set_y(y_start + 50)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(30, 28, 26)
    pdf.cell(80, 6, text="FACTURE A :", border="B")
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(80, 6, text=client_nom or "Client comptoir")
    pdf.ln(12)

    # Calcul TVA
    tva_active = parametres.tva_active if (parametres and hasattr(parametres, 'tva_active')) else False
    taux_val = parametres.taux_tva if (parametres and hasattr(parametres, 'taux_tva')) else 0
    taux = float(taux_val) / 100

    # En-tete tableau
    pdf.set_fill_color(33, 32, 29)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 9)
    cols = [
        ("N°", 12, "C"),
        ("DESIGNATION", 78, "L"),
        ("QTE", 18, "C"),
        ("PRIX UNIT." if not tva_active else "PU HT", 30, "R"),
        ("MONTANT" if not tva_active else "MONTANT HT", 37, "R"),
    ]
    for label, w, align in cols:
        pdf.cell(w, 8, text=label, align=align, fill=True)
    pdf.ln(8)

    # Lignes produits
    pdf.set_text_color(30, 28, 26)
    fill = False
    for i, ligne in enumerate(lignes, 1):
        pu = float(ligne.get("prix_unitaire", 0))
        st = float(ligne.get("sous_total", 0))
        if tva_active:
            pu = pu / (1 + taux)
            st = st / (1 + taux)
        pdf.set_fill_color(242, 240, 235)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(12, 7, text=str(i), align="C", border="B", fill=fill)
        pdf.cell(78, 7, text=str(ligne.get("nom", "Article"))[:40], border="B", fill=fill)
        pdf.cell(18, 7, text=str(ligne.get("quantite", 1)), align="C", border="B", fill=fill)
        pdf.cell(30, 7, text=_money(pu), align="R", border="B", fill=fill)
        pdf.cell(37, 7, text=_money(st), align="R", border="B", fill=fill, new_x="LMARGIN", new_y="NEXT")
        fill = not fill

    # Lignes vides pour remplissage
    for _ in range(max(0, 6 - len(lignes))):
        for _, w, _ in cols:
            pdf.cell(w, 7, text="", border="B")
        pdf.ln(7)

    # Totaux
    pdf.ln(4)
    montant_ttc = float(facture.montant_total)
    montant_ht = montant_ttc / (1 + taux) if tva_active else montant_ttc

    pdf.set_font("Helvetica", "", 9)
    pdf.set_x(120)
    pdf.cell(40, 7, text="TOTAL HT :", align="R")
    pdf.cell(35, 7, text=f"{_money(montant_ht)} FCFA", align="R", new_x="LMARGIN", new_y="NEXT")

    if tva_active:
        tva_montant = montant_ttc - montant_ht
        pdf.set_x(120)
        pdf.cell(40, 7, text=f"TVA ({int(float(taux_val))}%) :", align="R")
        pdf.cell(35, 7, text=f"{_money(tva_montant)} FCFA", align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(33, 32, 29)
    pdf.set_text_color(255, 255, 255)
    pdf.set_x(120)
    pdf.cell(40, 8, text="TOTAL TTC :", align="R", fill=True)
    pdf.cell(35, 8, text=f"{_money(montant_ttc)} FCFA", align="R", fill=True, new_x="LMARGIN", new_y="NEXT")

    # Pied de page
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(107, 100, 92)
    pdf.cell(0, 5, text="Merci de votre confiance. Marchandises vendues non reprises ni echangees.", align="C", new_x="LMARGIN", new_y="NEXT")
    if parametres and getattr(parametres, 'ninea', None):
        pdf.cell(0, 4, text=f"NINEA : {parametres.ninea}  —  RC : {parametres.registre_commerce}", align="C")

    # Correction FPDF2 pour retourner une chaîne d'octets pure
    return pdf.output()


def generate_ticket_pdf(facture, lignes, client_nom, parametres):
    height = 60 + len(lignes) * 8 + 25
    pdf = FPDF(format=(80, max(height, 100)), unit="mm")
    pdf.set_auto_page_break(False)
    pdf.add_page()
    pdf.set_margins(4, 4, 4)

    # En-tete ticket
    logo_path = None
    if parametres and hasattr(parametres, 'logo') and parametres.logo:
        try:
            logo_path = parametres.logo.path
        except Exception:
            logo_path = None

    if logo_path and Path(logo_path).exists():
        pdf.image(logo_path, x=30, y=4, w=20, h=20, keep_aspect_ratio=True)
        pdf.ln(24)
    else:
        pdf.set_font("Helvetica", "B", 12)
        nom_shop = parametres.nom if (parametres and hasattr(parametres, 'nom') and parametres.nom) else "QUINCAILLERIE"
        pdf.cell(0, 6, text=nom_shop.upper(), align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 7.5)
    if parametres and getattr(parametres, 'slogan', None):
        pdf.cell(0, 4, text=parametres.slogan, align="C", new_x="LMARGIN", new_y="NEXT")
    if parametres and getattr(parametres, 'adresse', None):
        pdf.cell(0, 4, text=parametres.adresse, align="C", new_x="LMARGIN", new_y="NEXT")
    if parametres and getattr(parametres, 'telephone', None):
        pdf.cell(0, 4, text=f"Tel : {parametres.telephone}", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(1)
    pdf.cell(0, 0, text="-" * 38, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    num_facture = facture.numero if getattr(facture, 'numero', None) else f"FAC-{facture.id}"
    pdf.cell(0, 4, text=f"Ticket : {num_facture}", new_x="LMARGIN", new_y="NEXT")
    date_str = facture.date_emission.strftime('%d/%m/%Y %H:%M') if getattr(facture, 'date_emission', None) else ""
    pdf.cell(0, 4, text=f"Date : {date_str}", new_x="LMARGIN", new_y="NEXT")
    if client_nom:
        pdf.cell(0, 4, text=f"Client : {client_nom}", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(1)
    pdf.cell(0, 0, text="-" * 38, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    tva_active = parametres.tva_active if (parametres and hasattr(parametres, 'tva_active')) else False
    taux_val = parametres.taux_tva if (parametres and hasattr(parametres, 'taux_tva')) else 0
    taux = float(taux_val) / 100

    for ligne in lignes:
        pu = float(ligne.get("prix_unitaire", 0))
        st = float(ligne.get("sous_total", 0))
        if tva_active:
            pu = pu / (1 + taux)
            st = st / (1 + taux)
        pdf.set_font("Helvetica", "", 7.5)
        pdf.cell(0, 4, text=str(ligne.get("nom", "Article"))[:32], new_x="LMARGIN", new_y="NEXT")
        pdf.cell(45, 4, text=f"  {ligne.get('quantite', 1)} x {_money(pu)}")
        pdf.cell(0, 4, text=f"{_money(st)} FCFA", align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(1)
    pdf.cell(0, 0, text="-" * 38, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    montant_ttc = float(facture.montant_total)
    montant_ht = montant_ttc / (1 + taux) if tva_active else montant_ttc

    if tva_active:
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, 5, text=f"Total HT : {_money(montant_ht)} FCFA", new_x="LMARGIN", new_y="NEXT")
        tva_m = montant_ttc - montant_ht
        pdf.cell(0, 5, text=f"TVA ({int(float(taux_val))}%) : {_money(tva_m)} FCFA", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, text=f"TOTAL : {_money(montant_ttc)} FCFA", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 7)
    pdf.cell(0, 4, text="Merci de votre confiance", align="C", new_x="LMARGIN", new_y="NEXT")

    # Correction FPDF2 pour retourner une chaîne d'octets pure
    return pdf.output()


def generate_facture_pdf(facture, lignes, client_nom, parametres):
    fmt = getattr(facture, 'format', 'FACTURE')
    if fmt == "TICKET":
        return generate_ticket_pdf(facture, lignes, client_nom, parametres)
    return generate_invoice_pdf(facture, lignes, client_nom, parametres)
