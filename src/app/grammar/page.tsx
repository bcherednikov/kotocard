"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SectionItem = {
  href?: string;
  title: string;
  description: string;
  detail: string;
  available: boolean;
};

const SECTIONS: SectionItem[] = [
  {
    href: "/grammar/irregular-verbs",
    title: "Неправильные глаголы",
    description: "go -> went -> gone, тренировка в нескольких форматах.",
    detail: "Открыть раздел",
    available: true,
  },
  {
    title: "Артикли",
    description: "a, an, the - правила и устойчивые случаи.",
    detail: "В разработке",
    available: false,
  },
  {
    title: "Времена",
    description: "Present, Past, Future и ключевые различия.",
    detail: "В разработке",
    available: false,
  },
  {
    title: "Фразовые глаголы",
    description: "look up, give in, come across и другие связки.",
    detail: "В разработке",
    available: false,
  },
];

export default function GrammarPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Grammar</h1>
        <p className="text-sm text-muted-foreground">
          Единый раздел правил и практики английской грамматики.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => {
          const content = (
            <Card className={!section.available ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{section.detail}</p>
              </CardContent>
            </Card>
          );

          if (section.href && section.available) {
            return (
              <Link key={section.title} href={section.href} className="block">
                {content}
              </Link>
            );
          }

          return <div key={section.title}>{content}</div>;
        })}
      </div>
    </div>
  );
}
