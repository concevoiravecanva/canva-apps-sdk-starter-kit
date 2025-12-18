import React from "react";
import { AppI18nProvider } from "@canva/app-i18n-kit";

interface Props {
  children: React.ReactNode;
}

export const AppIntlProvider: React.FC<Props> = ({ children }) => {
  // AppI18nProvider automatically detects locale and loads translations from Canva.
  // It is a Canva-specific replacement for `IntlProvider`.
  return <AppI18nProvider>{children}</AppI18nProvider>;
};
