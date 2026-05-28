export const CATEGORIES = [
  { id: "main",     label: "ГЛАВНОЕ"         },
  { id: "world",    label: "МИР"             },
  { id: "russia",   label: "РОССИЯ"          },
  { id: "crimea",   label: "КРЫМ"            },
  { id: "economy",  label: "ЭКОНОМИКА"       },
  { id: "science",  label: "НАУКА И ТЕХНИКА" },
  { id: "politics", label: "ПОЛИТИКА"        },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
