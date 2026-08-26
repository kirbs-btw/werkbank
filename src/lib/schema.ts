import { SITE } from '../config/site';
import type { Tool, FaqItem } from './types';
import type { Generator } from './generators';
import { SITE_START } from './lastmod';

const abs = (path: string) => new URL(path, SITE.url).href;

/** Gemeinsame Felder aller Werkzeugseiten. */
function appLd(fields: {
  name: string;
  path: string;
  description: string;
  category: string;
  updated?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: fields.name,
    url: abs(fields.path),
    description: fields.description,
    applicationCategory: fields.category,
    operatingSystem: 'Web',
    inLanguage: 'de-DE',
    isAccessibleForFree: true,
    // Ehrliche Datumsangaben: dateModified stammt aus dem Modul, nicht aus dem Build.
    datePublished: SITE_START,
    dateModified: fields.updated ?? SITE_START,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function faqLd(faq: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function softwareAppLd(tool: Tool, path: string) {
  return appLd({
    name: tool.title,
    path,
    description: tool.description,
    category: 'UtilitiesApplication',
    updated: tool.updated,
  });
}

/** JSON-LD für die Generatorseiten – bisher auf jeder Seite einzeln ausgeschrieben. */
export function generatorAppLd(gen: Generator, path: string) {
  return appLd({
    name: gen.title,
    path,
    description: gen.description,
    category: 'DesignApplication',
    updated: gen.updated,
  });
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'de-DE',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/rechner?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: abs('/favicon.svg'),
    description: SITE.description,
  };
}
