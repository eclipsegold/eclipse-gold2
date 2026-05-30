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

export const legalPages: Record<LegalPage, LegalPageContent> = {
  terms,
  legal,
  // shipping, returns, privacy, cookies added in Tasks 6–9
} as Record<LegalPage, LegalPageContent>
