import React from "react";
import { Button, Text, Rows, Alert } from "@canva/app-ui-kit";
import { ArrowLeftIcon } from "@canva/app-ui-kit";
import { useIntl, FormattedMessage } from "react-intl";
import "@canva/app-ui-kit/styles.css";

function ShortcutBox({ keys }: { keys: string[] }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: 4,
        marginLeft: 8,
        verticalAlign: "middle",
      }}
    >
      {keys.map((variant, i) => {
        const parts = variant.split("+");
        return (
          <span
            key={i}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            {parts.map((p, j) => (
              <span
                key={j}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2px 6px",
                  background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                  border: "1px solid var(--ui-kit-color-ui-border)",
                  borderRadius: 6,
                  fontFamily: "var(--ui-kit-typography-font-family-monospace)",
                  fontSize: 13,
                  lineHeight: 1.2,
                  color: "var(--ui-kit-color-content-fg)",
                }}
              >
                {p}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

export default function HelpPage({ onBack }: { onBack: () => void }) {
  const intl = useIntl();

  const shortcuts = [
    {
      description: intl.formatMessage({
        defaultMessage: "Add to design",
        description: "Shortcut description",
      }),
      keys: ["Enter"],
    },
    {
      description: intl.formatMessage({
        defaultMessage: "Reset settings",
        description: "Shortcut description",
      }),
      keys: ["R"],
    },
    {
      description: intl.formatMessage({
        defaultMessage: "Toggle this help page",
        description: "Shortcut description",
      }),
      keys: ["H"],
    },
    {
      description: intl.formatMessage({
        defaultMessage: "Cycle through shapes",
        description: "Shortcut description",
      }),
      keys: ["C"],
    },
    {
      description: intl.formatMessage({
        defaultMessage: "Cycle through materials",
        description: "Shortcut description",
      }),
      keys: ["M"],
    },
    {
      description: intl.formatMessage({
        defaultMessage: "Rotate object (X-axis)",
        description: "Shortcut description",
      }),
      keys: ["ArrowUp", "ArrowDown"],
    },
    {
      description: intl.formatMessage({
        defaultMessage: "Rotate object (Y-axis)",
        description: "Shortcut description",
      }),
      keys: ["ArrowLeft", "ArrowRight"],
    },
  ];

  const tips = [
    intl.formatMessage({
      defaultMessage:
        "Combine the 'Glass' material with a high 'Twist' value for interesting light-bending effects.",
      description: "Useful tip",
    }),
    intl.formatMessage({
      defaultMessage:
        "For a dramatic look, use a dark 'Shadow Tint' and increase the 'Shadow Intensity'. Move the light source to create long shadows.",
      description: "Useful tip",
    }),
    intl.formatMessage({
      defaultMessage:
        "Higher export sizes create better quality images but can take longer to process. Use a smaller size for quick previews.",
      description: "Useful tip",
    }),
  ];

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        boxSizing: "border-box",
      }}
    >
      <Rows spacing="2u">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            ariaLabel={intl.formatMessage({
              defaultMessage: "Back",
              description: "Back button",
            })}
            icon={ArrowLeftIcon}
            variant="tertiary"
            size="small"
            onClick={onBack}
          />
          <Text size="small" variant="bold">
            {intl.formatMessage({
              defaultMessage: "Help & Shortcuts",
              description: "Help page title",
            })}
          </Text>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
          <Rows spacing="3u">
            <Rows spacing="1u">
              <Text size="medium" variant="bold">
                {intl.formatMessage({
                  defaultMessage: "How it works",
                  description: "Help section title",
                })}
              </Text>
              <Text size="medium">
                {intl.formatMessage({
                  defaultMessage:
                    "Use the controls to create a unique 3D object. You can adjust the shape, materials, lighting, and more. When you're ready, add it to your Canva design.",
                  description: "Help section content",
                })}
              </Text>
            </Rows>

            <Rows spacing="1u">
              <Text size="medium" variant="bold">
                {intl.formatMessage({
                  defaultMessage: "Useful Tips",
                  description: "Help section title",
                })}
              </Text>
              <ul style={{ margin: 0, paddingLeft: "16px", listStyle: "disc" }}>
                {tips.map((tip, index) => (
                  <li key={index} style={{ marginBottom: "8px" }}>
                    <Text size="medium">{tip}</Text>
                  </li>
                ))}
              </ul>
            </Rows>

            <Rows spacing="1u">
              <Text size="medium" variant="bold">
                {intl.formatMessage({
                  defaultMessage: "Keyboard Shortcuts",
                  description: "Help section title",
                })}
              </Text>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                {shortcuts.map((shortcut) => (
                  <li
                    key={shortcut.description}
                    style={{ marginBottom: "12px" }}
                  >
                    <Text size="medium">
                      <FormattedMessage
                        defaultMessage="{description}:"
                        description="Displays a shortcut description followed by a colon"
                        values={{ description: shortcut.description }}
                      />
                      <ShortcutBox keys={shortcut.keys} />
                    </Text>
                  </li>
                ))}
              </ul>
              <Alert tone="info">
                {intl.formatMessage({
                  defaultMessage:
                    "These keyboard shortcuts only work when the app is active.",
                  description: "Info alert about shortcuts",
                })}
              </Alert>
            </Rows>
          </Rows>
        </div>
      </Rows>
    </div>
  );
}
