import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot } from "react-dom/client";
import App from "./app";
import "@canva/app-ui-kit/styles.css";
import { AppIntlProvider } from "./i18n/IntlProviderWrapper";

const root = createRoot(document.getElementById("root") as Element);
function render() {
  root.render(
    <AppIntlProvider>
      <AppUiProvider>
        <App />
      </AppUiProvider>
    </AppIntlProvider>,
  );
}

render();

if (module.hot) {
  module.hot.accept("./app", render);
}
