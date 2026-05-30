import type { LegalEntity, LegalPage, LegalPageContent } from './types'

export const legalEntity: LegalEntity = {
  companyName: '[À COMPLÉTER]',
  legalForm: '[À COMPLÉTER]',
  address: ['Genève', 'Suisse'],
  country: 'Suisse',
  vatId: 'Non assujetti à la TVA',
  registrationId: '[À COMPLÉTER]',
  email: 'eclipsegold@outlook.fr',
  privacyEmail: 'eclipsegold@outlook.fr',
  publisher: '[À COMPLÉTER]',
  host: ['Vercel Inc.', '340 S Lemon Ave #4133', 'Walnut, CA 91789, USA'],
}

const terms: LegalPageContent = {
  slug: { fr: 'cgv', de: 'agb', it: 'condizioni-vendita' },
  seoTitle: {
    fr: 'Conditions générales de vente — Eclipse Gold',
    de: 'Allgemeine Geschäftsbedingungen — Eclipse Gold',
    it: 'Condizioni generali di vendita — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Conditions générales de vente d’Eclipse Gold : commande, prix, paiement, livraison et rétractation.',
    de: 'Allgemeine Geschäftsbedingungen von Eclipse Gold: Bestellung, Preise, Zahlung, Lieferung und Widerruf.',
    it: 'Condizioni generali di vendita di Eclipse Gold: ordine, prezzi, pagamento, spedizione e recesso.',
  },
  title: {
    fr: 'Conditions générales de vente',
    de: 'Allgemeine Geschäftsbedingungen',
    it: 'Condizioni generali di vendita',
  },
  intro: {
    fr: 'Les présentes conditions régissent toute commande passée sur le site Eclipse Gold, édité par {companyName}.',
    de: 'Diese Bedingungen gelten für jede Bestellung über die Website Eclipse Gold, betrieben von {companyName}.',
    it: 'Le presenti condizioni disciplinano ogni ordine effettuato sul sito Eclipse Gold, gestito da {companyName}.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Objet', de: 'Gegenstand', it: 'Oggetto' },
      body: {
        fr: ['Les présentes conditions générales de vente s’appliquent à toutes les ventes de lunettes de soleil conclues sur le site Eclipse Gold. Toute commande implique l’acceptation sans réserve des présentes conditions.'],
        de: ['Diese Allgemeinen Geschäftsbedingungen gelten für alle über die Website Eclipse Gold abgeschlossenen Verkäufe von Sonnenbrillen. Jede Bestellung gilt als vorbehaltlose Annahme dieser Bedingungen.'],
        it: ['Le presenti condizioni generali di vendita si applicano a tutte le vendite di occhiali da sole concluse sul sito Eclipse Gold. Ogni ordine implica l’accettazione senza riserve delle presenti condizioni.'],
      },
    },
    {
      heading: { fr: 'Prix et paiement', de: 'Preise und Zahlung', it: 'Prezzi e pagamento' },
      body: {
        fr: ['Les prix sont indiqués en CHF ou en EUR selon le pays de livraison, toutes taxes comprises le cas échéant. Le paiement s’effectue en ligne au moment de la commande.'],
        de: ['Die Preise werden je nach Lieferland in CHF oder EUR angegeben, gegebenenfalls inklusive Steuern. Die Zahlung erfolgt online zum Zeitpunkt der Bestellung.'],
        it: ['I prezzi sono indicati in CHF o in EUR a seconda del paese di consegna, tasse incluse ove applicabile. Il pagamento avviene online al momento dell’ordine.'],
      },
      bullets: {
        fr: ['Carte bancaire', 'Apple Pay', 'Google Pay'],
        de: ['Kreditkarte', 'Apple Pay', 'Google Pay'],
        it: ['Carta di credito', 'Apple Pay', 'Google Pay'],
      },
    },
    {
      heading: { fr: 'Livraison', de: 'Lieferung', it: 'Spedizione' },
      body: {
        fr: ['La livraison est offerte. Les délais sont de 7 à 21 jours ouvrés selon la destination. Le détail figure sur la page Livraison.'],
        de: ['Die Lieferung ist kostenlos. Die Lieferzeit beträgt je nach Zielort 7 bis 21 Werktage. Einzelheiten finden Sie auf der Seite Versand.'],
        it: ['La spedizione è gratuita. I tempi sono di 7-21 giorni lavorativi a seconda della destinazione. I dettagli sono indicati nella pagina Spedizioni.'],
      },
    },
    {
      heading: { fr: 'Droit de rétractation', de: 'Widerrufsrecht', it: 'Diritto di recesso' },
      body: {
        fr: ['Conformément à la réglementation applicable, vous disposez d’un délai de 14 jours à compter de la réception pour retourner un article. Les frais de retour sont à la charge du client. Les modalités figurent sur la page Retours.'],
        de: ['Gemäß den geltenden Vorschriften haben Sie ab Erhalt 14 Tage Zeit, einen Artikel zurückzusenden. Die Rücksendekosten trägt der Kunde. Einzelheiten finden Sie auf der Seite Rückgabe.'],
        it: ['Ai sensi della normativa applicabile, disponi di 14 giorni dalla ricezione per restituire un articolo. Le spese di reso sono a carico del cliente. Le modalità sono indicate nella pagina Resi.'],
      },
    },
    {
      heading: { fr: 'Contact', de: 'Kontakt', it: 'Contatto' },
      body: {
        fr: ['Pour toute question relative à une commande, contactez-nous à l’adresse {email}.'],
        de: ['Bei Fragen zu einer Bestellung kontaktieren Sie uns unter {email}.'],
        it: ['Per qualsiasi domanda relativa a un ordine, contattaci all’indirizzo {email}.'],
      },
    },
  ],
}

const legal: LegalPageContent = {
  slug: { fr: 'mentions-legales', de: 'impressum', it: 'note-legali' },
  seoTitle: {
    fr: 'Mentions légales — Eclipse Gold',
    de: 'Impressum — Eclipse Gold',
    it: 'Note legali — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Mentions légales d’Eclipse Gold : éditeur, contact et hébergeur du site.',
    de: 'Impressum von Eclipse Gold: Betreiber, Kontakt und Hosting der Website.',
    it: 'Note legali di Eclipse Gold: editore, contatto e hosting del sito.',
  },
  title: { fr: 'Mentions légales', de: 'Impressum', it: 'Note legali' },
  intro: { fr: '', de: '', it: '' },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Éditeur du site', de: 'Betreiber der Website', it: 'Editore del sito' },
      body: {
        fr: ['{companyName}, {legalForm}.', 'Adresse : {address}.', 'Contact : {email}.', 'Directeur de la publication : {publisher}.', 'Identifiant : {registrationId}.', 'TVA : {vatId}.'],
        de: ['{companyName}, {legalForm}.', 'Adresse: {address}.', 'Kontakt: {email}.', 'Verantwortlich für den Inhalt: {publisher}.', 'Registernummer: {registrationId}.', 'MwSt: {vatId}.'],
        it: ['{companyName}, {legalForm}.', 'Indirizzo: {address}.', 'Contatto: {email}.', 'Direttore della pubblicazione: {publisher}.', 'Identificativo: {registrationId}.', 'IVA: {vatId}.'],
      },
    },
    {
      heading: { fr: 'Hébergement', de: 'Hosting', it: 'Hosting' },
      body: {
        fr: ['Le site est hébergé par {host}.'],
        de: ['Die Website wird gehostet von {host}.'],
        it: ['Il sito è ospitato da {host}.'],
      },
    },
    {
      heading: { fr: 'Propriété intellectuelle', de: 'Geistiges Eigentum', it: 'Proprietà intellettuale' },
      body: {
        fr: ['L’ensemble des contenus du site (textes, images, marque Eclipse Gold) est protégé. Toute reproduction sans autorisation est interdite.'],
        de: ['Sämtliche Inhalte der Website (Texte, Bilder, Marke Eclipse Gold) sind geschützt. Jede Vervielfältigung ohne Genehmigung ist untersagt.'],
        it: ['Tutti i contenuti del sito (testi, immagini, marchio Eclipse Gold) sono protetti. Qualsiasi riproduzione senza autorizzazione è vietata.'],
      },
    },
  ],
}

const shipping: LegalPageContent = {
  slug: { fr: 'livraison', de: 'versand', it: 'spedizioni' },
  seoTitle: {
    fr: 'Livraison — Eclipse Gold',
    de: 'Versand — Eclipse Gold',
    it: 'Spedizioni — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Livraison offerte, délais de 7 à 21 jours ouvrés selon la destination.',
    de: 'Kostenloser Versand, Lieferzeit 7 bis 21 Werktage je nach Zielort.',
    it: 'Spedizione gratuita, tempi di 7-21 giorni lavorativi a seconda della destinazione.',
  },
  title: { fr: 'Livraison', de: 'Versand', it: 'Spedizioni' },
  intro: {
    fr: 'La livraison est offerte sur toutes les commandes.',
    de: 'Der Versand ist bei allen Bestellungen kostenlos.',
    it: 'La spedizione è gratuita su tutti gli ordini.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Délais et frais', de: 'Fristen und Kosten', it: 'Tempi e costi' },
      body: {
        fr: ['Les commandes sont préparées puis expédiées selon la destination.'],
        de: ['Die Bestellungen werden je nach Zielort vorbereitet und versandt.'],
        it: ['Gli ordini vengono preparati e spediti a seconda della destinazione.'],
      },
      bullets: {
        fr: ['Livraison offerte partout', 'Délais : 7 à 21 jours ouvrés selon la destination', 'Transporteur : selon la destination'],
        de: ['Kostenloser Versand überallhin', 'Lieferzeit: 7 bis 21 Werktage je nach Zielort', 'Versanddienstleister: je nach Zielort'],
        it: ['Spedizione gratuita ovunque', 'Tempi: 7-21 giorni lavorativi a seconda della destinazione', 'Corriere: a seconda della destinazione'],
      },
    },
    {
      heading: { fr: 'Suivi de commande', de: 'Sendungsverfolgung', it: 'Tracciamento dell’ordine' },
      body: {
        fr: ['Pour toute question sur l’acheminement de votre commande, écrivez-nous à {email}.'],
        de: ['Bei Fragen zur Zustellung Ihrer Bestellung schreiben Sie uns an {email}.'],
        it: ['Per qualsiasi domanda sulla consegna del tuo ordine, scrivici a {email}.'],
      },
    },
  ],
}

const returns: LegalPageContent = {
  slug: { fr: 'retours', de: 'ruckgabe', it: 'resi' },
  seoTitle: {
    fr: 'Retours — Eclipse Gold',
    de: 'Rückgabe — Eclipse Gold',
    it: 'Resi — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Retours sous 14 jours. Frais de retour à la charge du client.',
    de: 'Rückgabe innerhalb von 14 Tagen. Rücksendekosten trägt der Kunde.',
    it: 'Resi entro 14 giorni. Spese di reso a carico del cliente.',
  },
  title: { fr: 'Retours', de: 'Rückgabe', it: 'Resi' },
  intro: {
    fr: 'Vous disposez de 14 jours pour changer d’avis.',
    de: 'Sie haben 14 Tage Zeit, um es sich anders zu überlegen.',
    it: 'Hai 14 giorni per cambiare idea.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Conditions', de: 'Bedingungen', it: 'Condizioni' },
      body: {
        fr: ['Le délai de rétractation est de 14 jours à compter de la réception de votre commande.'],
        de: ['Die Widerrufsfrist beträgt 14 Tage ab Erhalt Ihrer Bestellung.'],
        it: ['Il termine di recesso è di 14 giorni dalla ricezione del tuo ordine.'],
      },
      bullets: {
        fr: ['Délai : 14 jours après réception', 'Article non porté, dans son état d’origine', 'Frais de retour à la charge du client'],
        de: ['Frist: 14 Tage nach Erhalt', 'Artikel ungetragen, im Originalzustand', 'Rücksendekosten trägt der Kunde'],
        it: ['Termine: 14 giorni dalla ricezione', 'Articolo non indossato, nello stato originale', 'Spese di reso a carico del cliente'],
      },
    },
    {
      heading: { fr: 'Procédure', de: 'Ablauf', it: 'Procedura' },
      body: {
        fr: ['Pour initier un retour, contactez-nous à {email} en précisant votre numéro de commande. Le remboursement intervient après réception et contrôle de l’article.'],
        de: ['Um eine Rückgabe einzuleiten, kontaktieren Sie uns unter {email} und geben Sie Ihre Bestellnummer an. Die Rückerstattung erfolgt nach Erhalt und Prüfung des Artikels.'],
        it: ['Per avviare un reso, contattaci a {email} indicando il numero d’ordine. Il rimborso avviene dopo la ricezione e il controllo dell’articolo.'],
      },
    },
  ],
}

const privacy: LegalPageContent = {
  slug: { fr: 'confidentialite', de: 'datenschutz', it: 'privacy' },
  seoTitle: {
    fr: 'Politique de confidentialité — Eclipse Gold',
    de: 'Datenschutzerklärung — Eclipse Gold',
    it: 'Informativa sulla privacy — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Comment Eclipse Gold collecte et protège vos données personnelles.',
    de: 'Wie Eclipse Gold Ihre personenbezogenen Daten erhebt und schützt.',
    it: 'Come Eclipse Gold raccoglie e protegge i tuoi dati personali.',
  },
  title: { fr: 'Politique de confidentialité', de: 'Datenschutzerklärung', it: 'Informativa sulla privacy' },
  intro: {
    fr: 'Nous traitons vos données personnelles avec soin et uniquement pour traiter vos commandes.',
    de: 'Wir behandeln Ihre personenbezogenen Daten sorgfältig und ausschließlich zur Abwicklung Ihrer Bestellungen.',
    it: 'Trattiamo i tuoi dati personali con cura ed esclusivamente per gestire i tuoi ordini.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Données collectées', de: 'Erhobene Daten', it: 'Dati raccolti' },
      body: {
        fr: ['Nous collectons les données nécessaires au traitement de votre commande :'],
        de: ['Wir erheben die zur Abwicklung Ihrer Bestellung erforderlichen Daten:'],
        it: ['Raccogliamo i dati necessari alla gestione del tuo ordine:'],
      },
      bullets: {
        fr: ['Nom et adresse de livraison', 'Adresse e-mail', 'Données de paiement (traitées par notre prestataire)'],
        de: ['Name und Lieferadresse', 'E-Mail-Adresse', 'Zahlungsdaten (von unserem Dienstleister verarbeitet)'],
        it: ['Nome e indirizzo di consegna', 'Indirizzo e-mail', 'Dati di pagamento (trattati dal nostro fornitore)'],
      },
    },
    {
      heading: { fr: 'Paiement', de: 'Zahlung', it: 'Pagamento' },
      body: {
        fr: ['Les paiements sont traités par Stripe. Vos données de carte ne transitent jamais par nos serveurs.'],
        de: ['Zahlungen werden von Stripe verarbeitet. Ihre Kartendaten werden niemals über unsere Server geleitet.'],
        it: ['I pagamenti sono gestiti da Stripe. I dati della tua carta non transitano mai dai nostri server.'],
      },
    },
    {
      heading: { fr: 'Vos droits', de: 'Ihre Rechte', it: 'I tuoi diritti' },
      body: {
        fr: ['Vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à {privacyEmail}.'],
        de: ['Sie können Zugang, Berichtigung oder Löschung Ihrer Daten verlangen, indem Sie an {privacyEmail} schreiben.'],
        it: ['Puoi richiedere l’accesso, la rettifica o la cancellazione dei tuoi dati scrivendo a {privacyEmail}.'],
      },
    },
  ],
}

const cookies: LegalPageContent = {
  slug: { fr: 'cookies', de: 'cookies', it: 'cookie' },
  seoTitle: {
    fr: 'Cookies — Eclipse Gold',
    de: 'Cookies — Eclipse Gold',
    it: 'Cookie — Eclipse Gold',
  },
  metaDescription: {
    fr: 'Eclipse Gold n’utilise que des cookies strictement nécessaires au fonctionnement du site.',
    de: 'Eclipse Gold verwendet nur technisch notwendige Cookies.',
    it: 'Eclipse Gold utilizza solo cookie strettamente necessari al funzionamento del sito.',
  },
  title: { fr: 'Cookies', de: 'Cookies', it: 'Cookie' },
  intro: {
    fr: 'Nous n’utilisons que des cookies nécessaires au fonctionnement du site.',
    de: 'Wir verwenden nur Cookies, die für den Betrieb der Website erforderlich sind.',
    it: 'Utilizziamo solo cookie necessari al funzionamento del sito.',
  },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Cookies utilisés', de: 'Verwendete Cookies', it: 'Cookie utilizzati' },
      body: {
        fr: ['Le site n’utilise pas de cookies publicitaires ni de mesure d’audience. Seuls des cookies fonctionnels sont employés :'],
        de: ['Die Website verwendet keine Werbe- oder Analyse-Cookies. Es werden ausschließlich funktionale Cookies eingesetzt:'],
        it: ['Il sito non utilizza cookie pubblicitari né di misurazione del pubblico. Sono impiegati solo cookie funzionali:'],
      },
      bullets: {
        fr: ['Préférence de pays/devise (affichage du prix)', 'Sécurité du paiement (Stripe)'],
        de: ['Land-/Währungseinstellung (Preisanzeige)', 'Zahlungssicherheit (Stripe)'],
        it: ['Preferenza paese/valuta (visualizzazione del prezzo)', 'Sicurezza del pagamento (Stripe)'],
      },
    },
    {
      heading: { fr: 'Gestion', de: 'Verwaltung', it: 'Gestione' },
      body: {
        fr: ['Ces cookies étant strictement nécessaires, aucun consentement n’est requis. Vous pouvez les supprimer via les réglages de votre navigateur.'],
        de: ['Da diese Cookies unbedingt erforderlich sind, ist keine Einwilligung notwendig. Sie können sie über die Einstellungen Ihres Browsers löschen.'],
        it: ['Essendo strettamente necessari, questi cookie non richiedono consenso. Puoi eliminarli tramite le impostazioni del browser.'],
      },
    },
  ],
}

export const legalPages: Record<LegalPage, LegalPageContent> = {
  terms,
  legal,
  shipping,
  returns,
  privacy,
  cookies,
}
