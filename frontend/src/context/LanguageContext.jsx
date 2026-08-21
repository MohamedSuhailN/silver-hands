import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('sh_lang') || 'en';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('sh_lang', lang);
  };

  const t = (key) => {
    const langObj = translations[language] || translations.en;
    const fallbackObj = translations.en;
    
    // Support nested keys like 'nav.services'
    const getNested = (obj, path) => {
      if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
      const separator = path.indexOf('.');
      if (separator === -1) return undefined;
      const parent = obj[path.slice(0, separator)];
      return parent ? getNested(parent, path.slice(separator + 1)) : undefined;
    };
    
    return getNested(langObj, key) || getNested(fallbackObj, key) || key;
  };

  useEffect(() => {
    const translateValue = (value) => {
      const uiKeys = Object.keys(translations.en.ui || {});
      const key = uiKeys.find((uiKey) => (
        Object.values(translations).some((locale) => locale.ui?.[uiKey] === value)
      ));
      return key ? t(`ui.${key}`) : value;
    };

    const translateNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const value = node.nodeValue;
        const trimmed = value.trim();
        const translated = translateValue(trimmed);
        if (trimmed && translated !== trimmed) {
          node.nodeValue = value.replace(trimmed, translated);
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
        const value = node.getAttribute(attribute);
        if (!value) return;
        const translated = translateValue(value);
        if (translated !== value) node.setAttribute(attribute, translated);
      });
      node.childNodes.forEach(translateNode);
    };

    translateNode(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(({ addedNodes, target }) => {
        addedNodes.forEach(translateNode);
        if (target.nodeType === Node.TEXT_NODE) translateNode(target);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
