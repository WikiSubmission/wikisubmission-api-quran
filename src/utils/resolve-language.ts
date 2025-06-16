const fullMap = {
    tr: "turkish",
    turkish: "turkish",
    fr: "french",
    french: "french",
    de: "german",
    german: "german",
    id: "bahasa",
    bahasa: "bahasa",
    fa: "persian",
    persian: "persian",
    ta: "tamil",
    tamil: "tamil",
    se: "swedish",
    swedish: "swedish",
    ru: "russian",
    russian: "russian",
    en: "english",
    english: "english",
};

export function resolveLanguage(codeOrName: string): string {
    return fullMap[codeOrName.toLowerCase() as keyof typeof fullMap] || "english";
}